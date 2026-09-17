import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const target = process.env.FOMO_DEPLOY_ENV;
assert.ok(['staging', 'production'].includes(target), 'Explicit deployment target required');
const origin = target === 'staging' ? 'https://fomo4good.afsd.io' : 'https://fomo4good.com';
const request = (url, options = {}) => fetch(url, { ...options, signal: AbortSignal.timeout(30000) });
// The Worker route can lag `wrangler deploy` by seconds; until it lands, ARC answers 404.
let real = null;
for (let tries = 0; ; tries++) {
  const realResponse = await request(`${origin}/arc/api/fomo/state`);
  if (realResponse.status === 200) {
    real = await realResponse.json();
    if (real.watcher?.stale !== true) break;
  } else if (![404, 503].includes(realResponse.status)) {
    assert.equal(realResponse.status, 200);
  }
  assert.ok(
    tries < 60,
    `Timed out waiting for ${origin}/arc/api/fomo/state ${JSON.stringify(real?.watcher || real?.mode || realResponse.status)}`,
  );
  await new Promise(r => setTimeout(r, 5000));
}
assert.ok(real);
const sessionResponse = await request(`${origin}/arc/api/practice/session`, {method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'});
assert.equal(sessionResponse.status, 200);
assert.ok(sessionResponse.headers.get('set-cookie')?.includes('HttpOnly'));
const cookie = sessionResponse.headers.get('set-cookie').split(';')[0];
assert.equal((await sessionResponse.json()).balance, '1000');
const stateResponse = await request(`${origin}/arc/api/practice/state`, {headers:{Cookie:cookie}});
assert.equal(stateResponse.status, 200);
const state = await stateResponse.json();
assert.equal(state.currency, 'FUSD');
assert.equal(state.wallet.balance, '1000');
const intents = await request(`${origin}/arc/api/fomo/intents`, {method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'});
const campaign = JSON.parse(readFileSync(new URL(target === 'staging' ? '../config/staging-campaign.json' : '../config/mainnet-campaign.json', import.meta.url), 'utf8'));
assert.equal(real.mode, campaign.mode);
assert.equal(real.campaign.accepting, true);
assert.equal(real.payment.chainId, campaign.chainId);
assert.equal(real.payment.recipient, campaign.recipient.toLowerCase());
assert.equal(intents.status, 400, `${target} must reject an empty intent with 400, not stay closed`);
console.log(`Live API passed: FUSD session/state, Arc ${campaign.mode} collection open (${origin}).`);
