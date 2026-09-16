import QRCode from 'qrcode';
import { readFile, writeFile } from 'node:fs/promises';
import { DONATION_ADDRESS } from '../blocklets/fomo4good/.web/components/fomo-game/render.js';
const svg = await QRCode.toString(DONATION_ADDRESS,{type:'svg',errorCorrectionLevel:'M',margin:4,width:224});
await writeFile('blocklets/fomo4good/content/media/arc-donation-address.svg', svg);
// Self-contained QR works in native live rendering as well as static exports.
const path = 'blocklets/fomo4good/.web/components/fomo-game/render.js';
const source = await readFile(path,'utf8');
await writeFile(path, source.replace(/src="[^"]*" width="224" height="224" alt="Prepared Arc donation address QR code"/, `src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" width="224" height="224" alt="Prepared Arc donation address QR code"`));
console.log('Generated raw-address QR. No chain ID or payment request encoded.');
