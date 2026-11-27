// Gobble Dash — the hand-in program (Node 22, standard library only).
//
// The entry is plain static files: game/ is the playable turkey escape game
// (index.html plus its ES modules, no network request) and screenshots/ holds
// four real renders of the game in a browser. This program hands the entry
// in: it copies game/ and screenshots/ from beside this file into the output
// directory and writes dossier.json there, using the vendored make.fun
// library to build the dossier the judge reads.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Inside the grader the program runs twice and both runs must write the
// same bytes, so it copies files and nothing else (no timestamps, no
// randomness, no network).

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(source, target) {
  if (!existsSync(source)) return;
  rmSync(target, { recursive: true, force: true });
  cpSync(source, target, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyTree(join(repoRoot, 'game'), join(outputDir, 'game'));
copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));

// The scorer's own caps, so a local run refuses an entry the scorer would
// refuse: at most 4 screenshots, none over 256 KiB; game/ at most 993 files
// and 48 MiB in all, no path over 1000 bytes; the dossier text at most
// 160 KiB. game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
