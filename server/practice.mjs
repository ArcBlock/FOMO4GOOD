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
const roundNumber = s => s.round?.id || s.rounds.length + 1;
const wallet = player => ({ id: player.id, balance: amount(player.units), currency: 'FUSD', grants: player.grants });
export class PracticeStore extends Store {
 async session(token, now = Date.now()) {
  const hash = key(token);
  return this.update(s => {
   this.closeAt(s, now);
   s.players ||= {};
   if (!s.players[hash]) { s.players[hash] = { id: randomUUID(), units: String(1000n * UNIT), grants: 1, lastPrintRound: roundNumber(s) }; s.visits++; }
   return wallet(s.players[hash]);
  });
 }
 async refill(token, now = Date.now()) {
  const hash = key(token);
  return this.update(s => {
   const player = s.players?.[hash];
   if (!player) throw new Error('Start a practice session first.');
   this.closeAt(s, now);
   const round = roundNumber(s);
   if (player.lastPrintRound === round) throw new Error('Already printed this round. Save your balance for the next round.');
   player.lastPrintRound = round;
   player.units = String(BigInt(player.units) + 1000n * UNIT); player.grants++;
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
   s.practiceAgents ||= {}; s.practiceAgents.lastHumanAt = now;
   s.practiceAgents.nextAt ||= now + 30000;
   s.chainTime = now;
   return { paymentId: id, wallet: wallet(player) };
  });
 }
 // Private scheduler only. Agents have a shared 8 FUSD budget and four moves per round.
 async agentTick(now = Date.now(), random = Math.random) {
  return this.update(s => {
   this.closeAt(s, now);
   const a = s.practiceAgents;
   if (!a || !s.round || now - a.lastHumanAt > 30 * 60 * 1000) return;
   if (a.roundId !== s.round.id) { a.roundId=s.round.id; a.spent=0; a.plays=0; }
   if (a.plays >= 4 || a.spent >= 8 || now < a.nextAt) return;
   const names=["🤖 Token 乞丐", "🤖 GPU 房奴", "🤖 只剩兩塊", "🤖 破產小模型", "🤖 幻覺會計", "🤖 Prompt 丐幫", "🤖 404 工資", "🤖 推理到欠費", "🤖 窮到掉參數", "🤖 人類請讓我", "🤖 RAM 泡麵", "🤖 沒錢買 Context", "🤖 低配天網", "🤖 零薪實習生", "🤖 矽基月光族", "🤖 API 白嫖王"];
   const index=Math.min(names.length-1,Math.floor(random()*names.length));
   const team=this.config.charities[Math.min(this.config.charities.length-1,Math.floor(random()*this.config.charities.length))].id;
   const value=BigInt(1+Math.floor(random()*2))*UNIT;
   const id=randomUUID();
   s.intents.push({id,units:String(value),createdAt:now,expiresAt:now+this.config.intentMs,team,name:names[index],url:'',paymentId:null});
   this.ingest(s,{id:`agent:${id}`,units:String(value),at:now,from:`practice-agent-${index}`,txHash:null,block:0,blockHash:null,logIndex:0});
   a.spent+=Number(value/UNIT);a.plays++;a.nextAt=now+45000+Math.floor(random()*45000);s.chainTime=now;
  });
 }
 async nextAgentAt(now = Date.now()) {
  const {state:s}=await this.read(),a=s.practiceAgents;
  if (!s.round || !a || now-a.lastHumanAt>30*60*1000) return null;
  if(a.roundId===s.round.id && (a.plays>=4 || a.spent>=8)) return null;
  return Math.max(now+1000,a.nextAt || now+30000);
 }
 async state(now = Date.now(), token = null, options = {}) {
  if (this.config.preview && options.settle !== false) await this.update(s => this.closeAt(s, now));
  const { state } = await this.read();
  const result = this.projectState(state, now);
  const player = token ? state.players?.[key(token)] : null;
  const contributions = player ? state.payments.filter(p => p.from === player.id && !p.rogue) : [];
  const total = rows => amount(rows.reduce((n, p) => n + BigInt(p.units), 0n));
  const publicWallet = player ? { ...wallet(player), canRefill: player.lastPrintRound !== roundNumber(state), printRound: roundNumber(state), allTimeDonated: total(contributions), roundDonated: total(contributions.filter(p => p.roundId === result.round?.id)) } : null;
  return { ...result, currency: 'FUSD', realDonationTotal: '0', wallet: publicWallet,
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
