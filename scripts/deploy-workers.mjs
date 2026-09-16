// Deployment adapter only: Wrangler owns provisioning/deployment; ARC owns data migrations.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { arcHome } from './runtime.mjs';
const target = process.env.FOMO_DEPLOY_ENV;
if (!['staging', 'production'].includes(target)) throw new Error('Explicit deployment environment required');
const owner = process.env.FOMO_OWNER_DID;
if (!owner?.startsWith('did:') || /practice-owner|local|fixture/i.test(owner)) throw new Error('Real deployment owner DID required');
for (const key of ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID']) if (!process.env[key]) throw new Error(`Missing ${key}`);
const host = target === 'staging' ? 'fomo4good.afsd.io' : 'fomo4good.com';
const origin = `https://${host}`;
const prefix = `fomo4good-${target}`;
const wrangler = resolve(arcHome, 'runtimes/cloudflare/node_modules/.bin/wrangler');
const run = (...args) => execFileSync(wrangler, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const dbName = `${prefix}-space-index`, bucket = `${prefix}-space`;
const databases = () => JSON.parse(run('d1', 'list', '--json'));
let database = databases().find(d => d.name === dbName);
if (!database) {
  run('d1', 'create', dbName, '--update-config=false');
  database = databases().find(d => d.name === dbName);
}
if (!database?.uuid) throw new Error('D1 provisioning did not return the named database');
try { run('r2', 'bucket', 'info', bucket, '--json'); }
catch (error) {
  const detail = String(error.stderr || '');
  if (!/404|does not exist|not found|10006/i.test(detail)) throw new Error('Unable to inspect R2 bucket permissions');
  run('r2', 'bucket', 'create', bucket);
}
const provider = JSON.parse(readFileSync('worker/wrangler.jsonc', 'utf8'));
provider.name = `${prefix}-provider`;
provider.account_id = process.env.CLOUDFLARE_ACCOUNT_ID;
if (target === 'staging') {
	if (process.env.FOMO_ACCEPT_REAL && process.env.FOMO_ACCEPT_REAL !== '1' && process.env.FOMO_ACCEPT_REAL !== 'true')
		throw new Error('Staging collection uses FOMO_ACCEPT_REAL=1');
	const campaign = JSON.parse(readFileSync(new URL('../config/staging-campaign.json', import.meta.url), 'utf8'));
	provider.vars = {
		FOMO_MODE: 'testnet',
		FOMO_ACCEPT_REAL: '1',
		FOMO_ORIGIN: origin,
		FOMO_OWNER_DID: owner,
		FOMO_INSTANCE_DID: campaign.instanceDid,
		FOMO_PRACTICE_INSTANCE_DID: campaign.practiceInstanceDid,
		FOMO_RECIPIENT: campaign.recipient,
		FOMO_RPC_URL: campaign.rpcUrl,
		FOMO_START_BLOCK: String(campaign.startBlock),
		FOMO_STARTS_AT: campaign.startsAt,
		FOMO_ENDS_AT: campaign.endsAt,
	};
} else {
	if (process.env.FOMO_ACCEPT_REAL === '1' || process.env.FOMO_ACCEPT_REAL === 'true')
		throw new Error('Refusing to enable real collection on production');
	provider.vars = {
		FOMO_MODE: 'practice',
		FOMO_ORIGIN: origin,
		FOMO_OWNER_DID: owner,
		FOMO_INSTANCE_DID: `did:blocklet:${prefix}`,
	};
}
provider.r2_buckets[0].bucket_name = bucket;
Object.assign(provider.d1_databases[0], { database_name: dbName, database_id: database.uuid });
const gateway = JSON.parse(readFileSync('worker/gateway.wrangler.jsonc', 'utf8'));
gateway.name = `${prefix}-gateway`;
gateway.account_id = provider.account_id;
gateway.vars.FOMO_ORIGIN = origin;
gateway.services[0].service = provider.name;
gateway.routes = [{ pattern: `${host}/arc/api/*`, zone_name: target === 'staging' ? 'afsd.io' : 'fomo4good.com' }];
gateway.ratelimits[0].namespace_id = target === 'staging' ? '49311' : '49312';
// Configs live beside their templates so relative bundle/migration paths stay correct.
const providerPath = 'worker/.deploy-provider.json', gatewayPath = 'worker/.deploy-gateway.json';
writeFileSync(providerPath, JSON.stringify(provider, null, 2));
writeFileSync(gatewayPath, JSON.stringify(gateway, null, 2));
console.log(
	target === 'staging'
		? `Deploying Arc testnet collection API to ${origin}; page routes remain on ARC.`
		: `Deploying practice API to ${origin}; real collection stays closed. Page routes remain on ARC.`,
);
run('d1', 'migrations', 'apply', 'FOMO_INDEX', '--config', providerPath, '--remote');
console.log(run('deploy', '--config', providerPath));
console.log(run('deploy', '--config', gatewayPath));
