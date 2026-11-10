// Génère toutes les voix du jeu (audio/voix/*.mp3) à partir de js/data/phrases.js.
// Ne régénère que les phrases nouvelles ou modifiées. Voir README, section « Voix ».
//
// Prérequis (gratuits) : Python + Piper (pip install piper-tts), la voix fr_FR-upmc-medium,
// et ffmpeg. Chemins réglables par variables d'environnement :
//   COUCOU_PY      python du venv Piper   (défaut : %LOCALAPPDATA%\coucou-voix\Scripts\python.exe)
//   COUCOU_VOIX    dossier des modèles    (défaut : %LOCALAPPDATA%\coucou-voix\voix)
//   FFMPEG         exécutable ffmpeg      (défaut : ffmpeg)
// Option : --tout pour tout régénérer.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { PHRASES } from '../../js/data/phrases.js';

// Voix choisie : « Jessica » (fr_FR-upmc, locutrice 0), un peu plus lente et un peu plus aiguë.
const VOICE = { model: 'fr_FR-upmc-medium.onnx', speaker: 0, lengthScale: 1.12 };
const FILTER = 'asetrate=22050*1.07,aresample=44100,atempo=0.95';
const BITRATE = '56k';

const ROOT = resolve(import.meta.dirname, '..', '..');
const OUT = join(ROOT, 'audio', 'voix');
const base = join(process.env.LOCALAPPDATA || '', 'coucou-voix');
const PY = process.env.COUCOU_PY || join(base, 'Scripts', 'python.exe');
const MODELS = process.env.COUCOU_VOIX || join(base, 'voix');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const STAMP = join(OUT, 'textes.json');

mkdirSync(OUT, { recursive: true });
const done = existsSync(STAMP) && !process.argv.includes('--tout') ? JSON.parse(readFileSync(STAMP, 'utf8')) : {};
const todo = Object.fromEntries(Object.entries(PHRASES)
  .filter(([k, t]) => done[k] !== t || !existsSync(join(OUT, `${k}.mp3`))));

const count = Object.keys(todo).length;
console.log(`${count} phrase(s) à générer sur ${Object.keys(PHRASES).length}.`);

if (count) {
  const work = join(tmpdir(), `coucou-voix-${Date.now()}`);
  mkdirSync(work, { recursive: true });
  const list = join(work, 'phrases.json');
  writeFileSync(list, JSON.stringify(todo), 'utf8');
  execFileSync(PY, [join(import.meta.dirname, 'piper_lot.py'), join(MODELS, VOICE.model), String(VOICE.speaker), String(VOICE.lengthScale), list, work], { stdio: ['ignore', 'ignore', 'inherit'] });
  for (const key of Object.keys(todo)) {
    execFileSync(FFMPEG, ['-loglevel', 'error', '-y', '-i', join(work, `${key}.wav`), '-af', FILTER, '-ac', '1', '-b:a', BITRATE, join(OUT, `${key}.mp3`)]);
    done[key] = todo[key];
  }
  rmSync(work, { recursive: true, force: true });
}

// Supprime les voix de phrases retirées, puis écrit la liste lue par le service worker.
for (const f of readdirSync(OUT)) {
  if (f.endsWith('.mp3') && !(f.slice(0, -4) in PHRASES)) {
    rmSync(join(OUT, f));
    delete done[f.slice(0, -4)];
  }
}
writeFileSync(STAMP, JSON.stringify(done, null, 1), 'utf8');
const files = Object.keys(PHRASES).map((k) => `./audio/voix/${k}.mp3`);
writeFileSync(join(OUT, 'liste.js'), `// Généré par outils/voix/generer.mjs — ne pas modifier à la main.\nself.VOICE_FILES = ${JSON.stringify(files, null, 1)};\n`, 'utf8');
console.log('Voix prêtes dans audio/voix/.');
