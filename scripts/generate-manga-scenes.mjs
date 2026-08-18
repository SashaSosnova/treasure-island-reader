/**
 * Лёгкие манга-кадры по главам «Острова сокровищ».
 * Запуск: npm run scenes
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '../public/scenes')

const defs = `
  <defs>
    <pattern id="tone" width="4" height="4" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.7" fill="#111"/>
    </pattern>
    <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
      <line x1="0" y1="0" x2="0" y2="6" stroke="#111" stroke-width="1"/>
    </pattern>
  </defs>`

function panel(inner, sfx = '', bubbleTxt = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" role="img">
${defs}
  <rect x="6" y="6" width="308" height="188" fill="#fff" stroke="#111" stroke-width="4"/>
  <rect x="10" y="10" width="300" height="180" fill="#f4f1ea" stroke="#111" stroke-width="1.5"/>
  <rect x="12" y="12" width="296" height="100" fill="#d7e6f0"/>
  <rect x="12" y="12" width="296" height="100" fill="url(#tone)" opacity="0.12"/>
  <rect x="12" y="112" width="296" height="76" fill="#efe6d4"/>
  <path d="M12 112 Q90 104 160 112 T308 112" fill="none" stroke="#111" stroke-width="2"/>
${inner}
${sfx}
${bubbleTxt}
</svg>
`
}

function sfx(text, x, y) {
  return `<text x="${x}" y="${y}" font-size="13" font-family="Trebuchet MS, sans-serif" font-weight="700" fill="#111">${text}</text>`
}

function bubble(text, x, y, w = 90) {
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="28" rx="10" fill="#fff" stroke="#111" stroke-width="2"/>
    <text x="${x + 8}" y="${y + 18}" font-size="11" font-family="Trebuchet MS, sans-serif" font-weight="700">${text}</text>
  </g>`
}

function jim(x, y, mood = 'sly') {
  const mouth =
    mood === 'scared'
      ? `<ellipse cx="24" cy="24" rx="3" ry="4" fill="#111"/>`
      : mood === 'happy'
        ? `<path d="M18 23 Q24 28 30 23" fill="none" stroke="#111" stroke-width="1.6"/>`
        : `<path d="M18 23 Q24 27 30 23" fill="none" stroke="#111" stroke-width="1.6"/>`
  return `<g transform="translate(${x},${y})">
    <path d="M10 28 h28 l4 34 h-36z" fill="#fff" stroke="#111" stroke-width="2"/>
    <path d="M12 62 v18 M32 62 v18" stroke="#111" stroke-width="3" stroke-linecap="round"/>
    <circle cx="24" cy="16" r="14" fill="#fff" stroke="#111" stroke-width="2.2"/>
    <path d="M10 16 Q11 6 24 5 Q37 6 38 16" fill="#111"/>
    <ellipse cx="19" cy="16" rx="3" ry="4" fill="#111"/>
    <ellipse cx="29" cy="16" rx="3" ry="4" fill="#111"/>
    ${mouth}
  </g>`
}

function silver(x, y) {
  return `<g transform="translate(${x},${y})">
    <path d="M12 26 h30 l3 36 h-36z" fill="#fff" stroke="#111" stroke-width="2"/>
    <path d="M18 62 v16" stroke="#111" stroke-width="3"/>
    <path d="M36 62 l16 18" stroke="#111" stroke-width="3"/>
    <circle cx="8" cy="78" r="6" fill="none" stroke="#111" stroke-width="2.4"/>
    <circle cx="28" cy="14" r="14" fill="#fff" stroke="#111" stroke-width="2"/>
    <path d="M16 10 Q28 0 42 12" fill="#111"/>
    <rect x="40" y="8" width="10" height="6" fill="#111"/>
    <circle cx="23" cy="14" r="2.4" fill="#111"/>
    <circle cx="33" cy="14" r="2.4" fill="#111"/>
    <path d="M22 22 Q28 26 34 22" fill="none" stroke="#111" stroke-width="1.6"/>
  </g>`
}

function pirate(x, y) {
  return `<g transform="translate(${x},${y})">
    <path d="M10 28 h26 l3 32 h-32z" fill="#fff" stroke="#111" stroke-width="2"/>
    <path d="M14 60 v16 M30 60 v16" stroke="#111" stroke-width="3"/>
    <circle cx="22" cy="16" r="13" fill="#fff" stroke="#111" stroke-width="2"/>
    <path d="M10 12 Q22 2 34 12" fill="#111"/>
    <rect x="10" y="12" width="24" height="6" fill="#111"/>
    <circle cx="18" cy="18" r="2.2" fill="#111"/>
    <circle cx="28" cy="18" r="2.2" fill="#111"/>
  </g>`
}

function inn() {
  return `<g>
    <rect x="24" y="40" width="90" height="72" fill="#fff" stroke="#111" stroke-width="2.4"/>
    <path d="M18 42 L69 18 L120 42" fill="#f4f1ea" stroke="#111" stroke-width="2.4"/>
    <rect x="58" y="72" width="22" height="40" fill="#efe6d4" stroke="#111" stroke-width="2"/>
    <rect x="34" y="52" width="18" height="16" fill="#d7e6f0" stroke="#111" stroke-width="1.6"/>
  </g>`
}

function ship(x = 170, y = 28) {
  return `<g transform="translate(${x},${y})">
    <path d="M8 70 Q70 92 132 70 L120 58 L20 58 Z" fill="#fff" stroke="#111" stroke-width="2.4"/>
    <path d="M66 18 v40" stroke="#111" stroke-width="3"/>
    <path d="M66 20 L110 52 L66 52 Z" fill="#fff" stroke="#111" stroke-width="2"/>
    <path d="M66 28 L28 52 L66 52 Z" fill="#fff" stroke="#111" stroke-width="2"/>
  </g>`
}

function chest(x, y) {
  return `<g transform="translate(${x},${y})">
    <rect x="0" y="14" width="54" height="28" rx="4" fill="#fff" stroke="#111" stroke-width="2.4"/>
    <path d="M0 14 Q27 -6 54 14" fill="#efe6d4" stroke="#111" stroke-width="2.4"/>
    <rect x="22" y="20" width="10" height="10" fill="#111"/>
  </g>`
}

function parrot(x, y) {
  return `<g transform="translate(${x},${y})">
    <ellipse cx="18" cy="22" rx="14" ry="18" fill="#fff" stroke="#111" stroke-width="2"/>
    <circle cx="26" cy="12" r="8" fill="#fff" stroke="#111" stroke-width="2"/>
    <path d="M32 12 l10 4 l-10 4" fill="#111"/>
    <circle cx="28" cy="10" r="1.6" fill="#111"/>
    <path d="M10 36 q-10 10 2 14" fill="none" stroke="#111" stroke-width="2"/>
  </g>`
}

function barrel(x, y) {
  return `<g transform="translate(${x},${y})">
    <ellipse cx="28" cy="10" rx="28" ry="10" fill="#fff" stroke="#111" stroke-width="2"/>
    <path d="M0 10 v40 Q28 62 56 50 v-40" fill="#efe6d4" stroke="#111" stroke-width="2"/>
    <ellipse cx="28" cy="10" rx="18" ry="6" fill="#d7e6f0" stroke="#111" stroke-width="1.4"/>
  </g>`
}

function stockade(x = 40, y = 36) {
  return `<g transform="translate(${x},${y})">
    ${[0, 18, 36, 54, 72, 90, 108, 126]
      .map(
        (n) =>
          `<rect x="${n}" y="8" width="14" height="70" fill="#fff" stroke="#111" stroke-width="2"/><path d="M${n} 8 l7 -10 l7 10" fill="#efe6d4" stroke="#111" stroke-width="2"/>`,
      )
      .join('')}
  </g>`
}

function island() {
  return `<g>
    <ellipse cx="70" cy="88" rx="50" ry="16" fill="#efe6d4" stroke="#111" stroke-width="2"/>
    <path d="M70 88 v-46" stroke="#111" stroke-width="3"/>
    <path d="M70 48 Q40 58 38 72 Q70 60 70 48 Q100 58 102 72 Q70 60 70 48" fill="#fff" stroke="#111" stroke-width="2"/>
  </g>`
}

function mapSheet(x, y) {
  return `<g transform="translate(${x},${y})">
    <rect x="0" y="0" width="70" height="48" fill="#fff" stroke="#111" stroke-width="2" transform="rotate(-8 0 0)"/>
    <path d="M12 18 q18 10 36 -4" fill="none" stroke="#111" stroke-width="2"/>
    <circle cx="40" cy="28" r="4" fill="#111"/>
  </g>`
}

const scenes = {
  1: panel(`${inn()}${jim(150, 48)}${pirate(220, 40)}`, sfx('РОМ!', 230, 36)),
  2: panel(`${inn()}${pirate(150, 38)}${pirate(220, 42)}`, sfx('КЛАЦ!', 240, 32)),
  3: panel(`${jim(70, 50, 'scared')}${pirate(180, 40)}${bubble('МЕТКА', 210, 22, 70)}`),
  4: panel(`${chest(70, 58)}${jim(150, 40)}${bubble('ПАКЕТ!', 220, 24, 78)}`),
  5: panel(`${inn()}${pirate(150, 48)}${sfx('ЦОК-ЦОК', 210, 40)}`),
  6: panel(`${mapSheet(50, 40)}${jim(150, 42, 'happy')}${bubble('ОСТРОВ', 220, 22, 80)}`),
  7: panel(`${ship(40)}${jim(200, 48)}`, sfx('В ПОРТ!', 230, 36)),
  8: panel(`${silver(40, 38)}${jim(140, 48)}${parrot(230, 28)}`, '', bubble('КОК', 48, 18, 50)),
  9: panel(`${ship(20)}${pirate(200, 44)}`, sfx('ПОРОХ', 230, 34)),
  10: panel(`${ship(20)}${parrot(200, 30)}${silver(230, 48)}`, '', bubble('ПИАСТРЫ!', 200, 14, 96)),
  11: panel(`${barrel(40, 48)}${jim(130, 38)}${silver(210, 40)}`, sfx('...!', 170, 30)),
  12: panel(`${jim(40, 48)}${pirate(120, 40)}${ship(180)}`, sfx('СОВЕТ', 40, 36)),
  13: panel(`${island()}${ship(160)}${jim(230, 48)}`, sfx('БЕРЕГ', 230, 36)),
  14: panel(`${silver(40, 38)}${pirate(160, 48)}${jim(240, 40, 'scared')}`, sfx('УДАР', 170, 32)),
  15: panel(`${island()}${pirate(150, 48)}${jim(230, 42)}`, '', bubble('СЫР?', 150, 18, 60)),
  16: panel(`${ship(20)}${stockade(160, 28)}`, sfx('УХОДИМ', 40, 34)),
  17: panel(`${ship(10)}${jim(200, 50)}`, sfx('ПЛИ!', 230, 36)),
  18: panel(`${stockade(20, 28)}${jim(200, 48, 'happy')}`, sfx('ДЖИМ!', 220, 36)),
  19: panel(`${stockade(20, 28)}${jim(200, 46)}`, sfx('ВАХТА', 220, 34)),
  20: panel(`${stockade(10, 30)}${silver(200, 40)}`, '', bubble('СДАВАЙСЯ', 200, 16, 100)),
  21: panel(`${stockade(10, 30)}${pirate(200, 42)}${pirate(240, 48)}`, sfx('АТАКА!', 210, 32)),
  22: panel(`${island()}${jim(180, 50)}`, sfx('ЧЕЛНОК', 210, 36)),
  23: panel(`${ship(20)}${jim(210, 52, 'scared')}`, sfx('ОТЛИВ', 220, 34)),
  24: panel(`${ship(10)}${pirate(200, 44)}${jim(240, 48)}`, sfx('ДВОЕ', 220, 32)),
  25: panel(`${ship(10)}${jim(210, 44, 'happy')}`, sfx('ФЛАГ ↓', 220, 34)),
  26: panel(`${ship(10)}${pirate(190, 40)}${jim(240, 46, 'scared')}`, sfx('НОЖ!', 210, 32)),
  27: panel(`${stockade(10, 30)}${parrot(210, 28)}${jim(240, 48, 'scared')}`, '', bubble('ПИАСТРЫ!', 190, 14, 100)),
  28: panel(`${silver(40, 38)}${jim(150, 48, 'scared')}${pirate(230, 42)}`, sfx('ПЛЕН', 230, 32)),
  29: panel(`${silver(80, 40)}${pirate(200, 44)}`, '', bubble('МЕТКА', 200, 18, 70)),
  30: panel(`${jim(70, 46)}${pirate(190, 40)}`, '', bubble('СЛОВО', 40, 20, 70)),
  31: panel(`${island()}${pirate(180, 46)}${jim(240, 48, 'scared')}`, sfx('СКЕЛЕТ', 200, 34)),
  32: panel(`${island()}${pirate(170, 48)}`, sfx('УУУУ', 200, 36), bubble('ПЕСНЯ', 200, 18, 70)),
  33: panel(`${chest(50, 70)}${silver(140, 40)}${jim(230, 46)}`, sfx('ПУСТО!', 50, 36)),
  34: panel(`${ship(20)}${silver(200, 42)}${chest(250, 70)}`, sfx('ПОБЕГ', 210, 32)),
  35: panel(`${mapSheet(40, 42)}${ship(140)}${jim(240, 46, 'happy')}`, sfx('ИТОГ', 40, 34)),
}

fs.mkdirSync(outDir, { recursive: true })
for (const [id, svg] of Object.entries(scenes)) {
  const file = path.join(outDir, `ch-${String(id).padStart(2, '0')}.svg`)
  fs.writeFileSync(file, svg)
  console.log('wrote', path.basename(file))
}

for (const extra of fs.readdirSync(outDir)) {
  if (extra.startsWith('ch-') && extra.endsWith('.svg')) {
    const num = Number(extra.slice(3, 5))
    if (!Number.isFinite(num) || !scenes[num]) {
      fs.unlinkSync(path.join(outDir, extra))
      console.log('removed', extra)
    }
  }
}
