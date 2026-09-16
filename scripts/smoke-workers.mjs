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
    if (target !== 'staging' || real.watcher?.stale !== true) break;
  } else if (realResponse.status !== 404 || tries >= 18) {
    assert.equal(realResponse.status, 200);
  }
  assert.ok(tries < 18, `Timed out waiting for ${origin}/arc/api/fomo/state`);
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
if (target === 'staging') {
  const campaign = JSON.parse(readFileSync(new URL('../config/staging-campaign.json', import.meta.url), 'utf8'));
  assert.equal(real.mode, 'testnet');
  assert.equal(real.campaign.accepting, true);
  assert.equal(real.payment.chainId, 5042002);
  assert.equal(real.payment.recipient, campaign.recipient.toLowerCase());
  assert.equal(intents.status, 400, 'Staging must reject an empty intent with 400, not stay closed');
} else {
  assert.equal(real.community, '0');
  assert.equal(real.mode, 'unavailable');
  assert.equal(real.campaign.accepting, false);
  assert.equal(intents.status, 409);
}
console.log(
  target === 'staging'
    ? `Live API passed: FUSD session/state, Arc testnet collection open (${origin}).`
    : `Live API passed: FUSD session/state, isolated real pool, real-payment closure (${origin}).`,
);
