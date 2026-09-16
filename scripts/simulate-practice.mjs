// Finite, explicitly labelled LOCAL-ONLY players. Never seed public leaderboards.
import { setTimeout as delay } from 'node:timers/promises';
const origin='http://localhost:4932';
const players=[['SIM · 貓咪印鈔機','dogs'],['SIM · Token 乞丐','kids'],['SIM · 碳基韭菜','trees'],['SIM · Liquid GPT','water'],['SIM · 404 慈善家','internet']];
const call=async(path,cookie,body)=>{const r=await fetch(origin+'/arc/api/practice/'+path,{method:body?'POST':'GET',headers:{...(cookie?{cookie}:{}),...(body?{origin,'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});if(!r.ok)throw Error(`${path}: ${r.status}`);return {data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
const initial=(await call('state')).data;if(initial.mode!=='practice'||initial.currency!=='FUSD')throw Error('Requires local FUSD practice');
for(const p of players)p.push((await call('session',null,{})).cookie);
for(let i=0;i<15;i++){
 const [name,team,cookie]=players[i%players.length];
 const amount=String([7,13,21,8,34,5,55,3,17,9,12,6,28,11,4][i]);
 await call('donate',cookie,{name,team,amount,url:'https://example.com/simulated-player',requestId:crypto.randomUUID()});
 console.log(`${new Date().toISOString()} ${name}: ${amount} FUSD → ${team} (${i+1}/15)`);
 if(i<14)await delay(20000);
}
console.log('Simulation finished; no more automatic plays.');
