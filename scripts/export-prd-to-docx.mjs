/**
 * 将 PRD Markdown 导出为 Word (.docx)
 * 运行: node scripts/export-prd-to-docx.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  BorderStyle,
} from 'docx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const mdPath = path.join(rootDir, 'docs/PRD-分区管理与集合页管理.md')
const outPath = path.join(rootDir, 'docs/PRD-分区管理与集合页管理.docx')

const md = fs.readFileSync(mdPath, 'utf-8')
const lines = md.split(/\r?\n/)

const children = []
let i = 0
let inCodeBlock = false
let codeLines = []

function flushCodeBlock() {
  if (codeLines.length === 0) return
  const code = codeLines.join('\n')
  codeLines = []
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: code, font: 'Consolas', size: 20 }),
      ],
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' } },
      spacing: { after: 200 },
    })
  )
}

while (i < lines.length) {
  const line = lines[i]
  const trimmed = line.trimEnd()

  if (trimmed.startsWith('```')) {
    if (inCodeBlock) {
      flushCodeBlock()
      inCodeBlock = false
    } else {
      inCodeBlock = true
    }
    i++
    continue
  }

  if (inCodeBlock) {
    codeLines.push(line)
    i++
    continue
  }

  if (trimmed === '') {
    i++
    continue
  }

  if (trimmed.startsWith('# ')) {
    const text = trimmed.slice(2).trim()
    children.push(new Paragraph({ text, heading: HeadingLevel.TITLE, spacing: { after: 240 } }))
    i++
    continue
  }

  if (trimmed.startsWith('## ')) {
    const text = trimmed.slice(3).trim()
    children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 160 } }))
    i++
    continue
  }

  if (trimmed.startsWith('### ')) {
    const text = trimmed.slice(4).trim()
    children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }))
    i++
    continue
  }

  if (trimmed.startsWith('> ')) {
    const text = trimmed.slice(2).trim()
    children.push(new Paragraph({ text, spacing: { after: 120 }, indent: { left: 360 } }))
    i++
    continue
  }

  if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
    const rows = []
    while (i < lines.length && lines[i].trim().startsWith('|')) {
      const rowLine = lines[i]
      const cells = rowLine.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map((c) => c.trim())
      const isSeparator = cells.every((c) => /^[-:\s]+$/.test(c))
      if (!isSeparator && cells.some(Boolean)) {
        rows.push(
          new TableRow({
            children: cells.map(
              (cell) =>
                new TableCell({
                  children: [new Paragraph({ text: cell || ' ', spacing: { after: 80 } })],
                })
            ),
          })
        )
      }
      i++
    }
    if (rows.length > 0) {
      children.push(
        new Table({
          rows,
          width: { size: 100, type: 'PERCENTAGE' },
        })
      )
      continue
    }
  }

  children.push(new Paragraph({ text: trimmed, spacing: { after: 120 } }))
  i++
}

if (inCodeBlock) flushCodeBlock()

const doc = new Document({
  sections: [
    {
      properties: {},
      children,
    },
  ],
})

const buffer = await Packer.toBuffer(doc)
fs.writeFileSync(outPath, buffer)
console.log('已导出:', outPath)
