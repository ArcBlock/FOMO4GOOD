import assert from 'node:assert/strict';
const target = process.env.FOMO_DEPLOY_ENV;
assert.ok(['staging', 'production'].includes(target), 'Explicit deployment target required');
const origin = target === 'staging' ? 'https://fomo4good.afsd.io' : 'https://fomo4good.com';
const request = (url, options = {}) => fetch(url, { ...options, signal: AbortSignal.timeout(30000) });
// The /api/* route lags `wrangler deploy` by seconds; until it lands, the ARC page server answers 404.
let realResponse;
for (let tries = 0; ; tries++) {
  realResponse = await request(`${origin}/api/fomo/state`);
  if (realResponse.status !== 404 || tries >= 18) break;
  await new Promise(r => setTimeout(r, 5000));
}
assert.equal(realResponse.status, 200);
const real = await realResponse.json();
assert.equal(real.community, '0');
const sessionResponse = await request(`${origin}/api/practice/session`, {method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'});
assert.equal(sessionResponse.status, 200);
assert.ok(sessionResponse.headers.get('set-cookie')?.includes('HttpOnly'));
const cookie = sessionResponse.headers.get('set-cookie').split(';')[0];
assert.equal((await sessionResponse.json()).balance, '1000');
const stateResponse = await request(`${origin}/api/practice/state`, {headers:{Cookie:cookie}});
assert.equal(stateResponse.status, 200);
const state = await stateResponse.json();
assert.equal(state.currency, 'FUSD');
assert.equal(state.wallet.balance, '1000');
const closed = await request(`${origin}/api/fomo/intents`, {method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'});
assert.equal(closed.status, 409);
console.log(`Live API passed: FUSD session/state, isolated real pool, real-payment closure (${origin}).`);
