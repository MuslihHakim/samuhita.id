import { promises as fs } from 'fs';
import path from 'path';
import JSZip from 'jszip';
async function addDir(zip, baseDir, rel='') { const entries = await fs.readdir(path.join(baseDir, rel), { withFileTypes: true }); for (const e of entries) { const p = path.join(rel, e.name); if (e.isDirectory()) await addDir(zip, baseDir, p); else { const data = await fs.readFile(path.join(baseDir, p)); zip.file(p.split(path.sep).join('/'), data); } } }
(async () => { const base = process.argv[2]; const out = process.argv[3]; const zip = new JSZip(); await addDir(zip, base, ''); const buf = await zip.generateAsync({ type: 'nodebuffer' }); await fs.writeFile(out, buf); console.log('Wrote', out, 'size', buf.length); })();
