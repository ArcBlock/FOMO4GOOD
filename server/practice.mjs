import { createHash, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { Store, UNIT, units, amount } from './store.mjs';

export function practiceConfiguration(config, env = process.env) {
 const result = { ...config, mode: 'practice', preview: true, chainId: 0, recipient: '', rpcUrl: '', explorer: '', startBlock: 0, startsAt: 0, endsAt: 0,
  spaceRoot: resolve(env.FOMO_PRACTICE_SPACE_ROOT || 'var/practice/spaces'),
  instanceDid: 'did:abt:fomo4good-practice-v1', ownerDid: 'did:abt:fomo4good-practice-owner' };
 if (result.spaceRoot === config.spaceRoot) throw new Error('Practice requires its own DID Space root.');
 return result;
}
const key = token => {
 if (!/^[a-f0-9]{64}$/.test(token || '')) throw new Error('Start a practice session first.');
 return createHash('sha256').update(token).digest('hex');
};
const wallet = player => ({ id: player.id, balance: amount(player.units), currency: 'FUSD', grants: player.grants });
export class PracticeStore extends Store {
 async session(token) {
  const hash = key(token);
  return this.update(s => {
   s.players ||= {};
   if (!s.players[hash]) { s.players[hash] = { id: randomUUID(), units: String(1000n * UNIT), grants: 1 }; s.visits++; }
   return wallet(s.players[hash]);
  });
 }
 async refill(token) {
  const hash = key(token);
  return this.update(s => {
   const player = s.players?.[hash];
   if (!player) throw new Error('Start a practice session first.');
   if (BigInt(player.units) >= UNIT) throw new Error('Use your remaining FUSD before refilling.');
   player.units = String(1000n * UNIT); player.grants++;
   return wallet(player);
  });
 }
 async donate(token, input, now = Date.now()) {
  const hash = key(token), value = units(input.amount);
  if (!/^[a-f0-9-]{36}$/.test(input.requestId || '')) throw new Error('Invalid practice request ID.');
  if (!this.config.charities.some(t => t.id === input.team)) throw new Error('Choose a team.');
  const name = String(input.name || '').trim(), url = String(input.url || '').trim();
  if (name.length > 32 || /[\x00-\x1f\x7f]/.test(name)) throw new Error('Display name must be at most 32 characters.');
  if (url) {
   const parsed = new URL(url);
   if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || url.length > 200) throw new Error('Use a public http or https URL, at most 200 characters.');
  }
  return this.update(s => {
   const player = s.players?.[hash];
   if (!player) throw new Error('Start a practice session first.');
   const id = `practice:${player.id}:${input.requestId}`;
   const previous = s.payments.find(p => p.id === id);
   if (previous) {
    if (previous.units !== String(value) || previous.team !== input.team || previous.name !== name || previous.url !== url) throw new Error('Practice request already used with different details.');
    return { paymentId: id, wallet: wallet(player) };
   }
   if (BigInt(player.units) < value) throw new Error('Not enough FUSD. Fake money still has a balance.');
   // The same countdown engine, in a separate instance. No chain event, real intent or payout.
   s.intents.push({ id: randomUUID(), units: String(value), createdAt: now, expiresAt: now + this.config.intentMs, team: input.team, name, url, paymentId: null });
   this.ingest(s, { id, units: String(value), at: now, from: player.id, txHash: null, block: 0, blockHash: null, logIndex: 0 });
   player.units = String(BigInt(player.units) - value);
   s.chainTime = now;
   return { paymentId: id, wallet: wallet(player) };
  });
 }
 async state(now = Date.now(), token = null) {
  const result = await super.state(now);
  const { state } = await this.read();
  const player = token ? state.players?.[key(token)] : null;
  return { ...result, currency: 'FUSD', realDonationTotal: '0', wallet: player ? wallet(player) : null,
   teams: result.teams.map(t => ({ ...t, topUp: '0', realDonation: '0' })),
   receipts: [], payment: { recipient: '', networkName: 'OFFCHAIN PRACTICE', chainId: null, explorer: '' },
   campaign: { ...result.campaign, accepting: true, permanent: true } };
 }
}

export function unavailableRealState(config, now = Date.now()) {
 return { now, mode: 'unavailable', currency: 'USDC', round: null, community: '0', rogueTotal: '0',
  teams: config.charities.map(t => ({ ...t, allocated: '0', topUp: '100', wins: 0 })),
  topDonors: [], roundDonors: [], rogueDonors: [], recent: [], history: [], receipts: [],
  watcher: { block: null, chainTime: 0, stale: false }, campaign: { startsAt: 0, endsAt: 0, ended: false, accepting: false },
  metrics: { visits: 0, intents: 0, paidIntents: 0, donors: 0, repeatDonors: 0, rogueTransfers: 0, rogueDonors: 0, intentConversion: 0, median: '0', lastMinuteMoves: 0 },
  payment: { recipient: '', networkName: 'REAL DONATIONS NOT OPEN', chainId: null, explorer: '' } };
}
