import { writeFileSync, readFileSync } from 'fs'
import { chaptersPart1 } from '../src/data/chaptersPart1.js'
import { chaptersPart2 } from '../src/data/chaptersPart2.js'
import { chaptersPart3 } from '../src/data/chaptersPart3.js'
import { chaptersPart4 } from '../src/data/chaptersPart4.js'
import { finalQuiz } from '../src/data/finalQuiz.js'

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleQuestion(q, seed, targetPos) {
  if (!q?.options?.length || q.correctIndex == null) return q
  const correct = q.options[q.correctIndex]
  const rng = mulberry32(seed)
  const others = q.options.filter((_, i) => i !== q.correctIndex)
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[others[i], others[j]] = [others[j], others[i]]
  }
  const target = ((targetPos % q.options.length) + q.options.length) % q.options.length
  const opts = [...others]
  opts.splice(target, 0, correct)
  return { ...q, options: opts, correctIndex: target }
}

function shuffleList(list, baseSeed) {
  return list.map((q, i) => shuffleQuestion(q, baseSeed + i * 17 + 3, i))
}

function shuffleChapters(chapters, base) {
  let globalI = 0
  return chapters.map((ch, ci) => {
    if (!ch.questions?.length) return ch
    return {
      ...ch,
      questions: ch.questions.map((q, i) =>
        shuffleQuestion(q, base + ci * 100 + i * 17 + 3, globalI++),
      ),
    }
  })
}

function esc(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function formatQuestions(questions) {
  if (!questions.length) return '    questions: [],\n'
  const lines = ['    questions: [']
  for (const q of questions) {
    lines.push('      {')
    lines.push(`        question: '${esc(q.question)}',`)
    const opts = q.options.map((o) => `'${esc(o)}'`)
    const joined = opts.join(', ')
    if (joined.length > 70) {
      lines.push('        options: [')
      for (const o of opts) lines.push(`          ${o},`)
      lines.push('        ],')
    } else {
      lines.push(`        options: [${joined}],`)
    }
    lines.push(`        correctIndex: ${q.correctIndex},`)
    lines.push('      },')
  }
  lines.push('    ],')
  return `${lines.join('\n')}\n`
}

function replaceQuestionsInFile(path, chapters) {
  let src = readFileSync(path, 'utf8')
  for (const ch of chapters) {
    if (!Array.isArray(ch.questions)) continue
    const idRe = new RegExp(`id: ${ch.id}\\b`)
    const idMatch = idRe.exec(src)
    if (!idMatch) {
      console.error('id not found', ch.id, path)
      continue
    }
    const from = idMatch.index
    const qStart = src.indexOf('questions:', from)
    if (qStart < 0 || qStart - from > 8000) {
      console.error('questions not found near id', ch.id)
      continue
    }
    const bracket = src.indexOf('[', qStart)
    let depth = 0
    let end = -1
    for (let i = bracket; i < src.length; i++) {
      if (src[i] === '[') depth++
      else if (src[i] === ']') {
        depth--
        if (depth === 0) {
          end = i + 1
          break
        }
      }
    }
    let replaceEnd = end
    if (src[replaceEnd] === ',') replaceEnd++
    while (src[replaceEnd] === '\r' || src[replaceEnd] === '\n') replaceEnd++

    const formatted = formatQuestions(ch.questions)
    src = src.slice(0, qStart) + formatted + src.slice(replaceEnd)
  }
  writeFileSync(path, src)
  return chapters.reduce((n, ch) => n + (ch.questions?.length || 0), 0)
}

function dist(chapters) {
  const c = [0, 0, 0, 0]
  for (const ch of chapters) {
    for (const q of ch.questions || []) c[q.correctIndex]++
  }
  return c
}

const p1 = shuffleChapters(chaptersPart1, 1000)
const p2 = shuffleChapters(chaptersPart2, 2000)
const p3 = shuffleChapters(chaptersPart3, 3000)
const p4 = shuffleChapters(chaptersPart4, 4000)
const fq = shuffleList(finalQuiz, 5000)

const n1 = replaceQuestionsInFile('./src/data/chaptersPart1.js', p1)
const n2 = replaceQuestionsInFile('./src/data/chaptersPart2.js', p2)
const n3 = replaceQuestionsInFile('./src/data/chaptersPart3.js', p3)
const n4 = replaceQuestionsInFile('./src/data/chaptersPart4.js', p4)

{
  const lines = ['export const finalQuiz = [']
  for (const q of fq) {
    lines.push('  {')
    lines.push(`    question: '${esc(q.question)}',`)
    lines.push('    options: [')
    for (const o of q.options) lines.push(`      '${esc(o)}',`)
    lines.push('    ],')
    lines.push(`    correctIndex: ${q.correctIndex},`)
    lines.push('  },')
  }
  lines.push(']')
  writeFileSync('./src/data/finalQuiz.js', `${lines.join('\n')}\n`)
}

console.log('part1', n1, dist(p1))
console.log('part2', n2, dist(p2))
console.log('part3', n3, dist(p3))
console.log('part4', n4, dist(p4))
const fc = [0, 0, 0, 0]
fq.forEach((q) => fc[q.correctIndex]++)
console.log('final', fq.length, fc)
