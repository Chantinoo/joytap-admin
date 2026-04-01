import type { I18nLabels, LangCode } from '../components/fieldI18nConstants'
import { LINKED_TABLE_TARGET_WIKI_FIELD_KEY } from './linkedTableColumns'

/** MOCK：普通表格模块在子页中维护的行数据 */
export interface RichTableMockRow {
  key: string
  hidden: boolean
  /** 列 fieldKey → 展示文案（MOCK）；文本列通常与 cellI18n.zh 同步 */
  cells: Record<string, string>
  /** 文本类列的多语言（列 key 与 cells 一致） */
  cellI18n?: Record<string, I18nLabels>
}

export function emptyCellsForFieldKeys(fieldKeys: string[]): Record<string, string> {
  const cells: Record<string, string> = {}
  for (const k of fieldKeys) cells[k] = ''
  return cells
}

/** 详情预览等：文本列优先简体中文，否则 cells */
export function richTableCellDisplayValue(
  row: RichTableMockRow,
  cellKey: string,
  preferLang: LangCode = 'zh',
): string {
  const i18n = row.cellI18n?.[cellKey]
  const fromLang = i18n?.[preferLang]?.trim()
  if (fromLang) return fromLang
  const zh = i18n?.zh?.trim()
  if (zh) return zh
  for (const v of Object.values(i18n ?? {})) {
    const t = v?.trim()
    if (t) return t
  }
  return (row.cells[cellKey] ?? '').trim()
}

/** 搜索：合并 cells 与 cellI18n 全部文案 */
export function richTableCellSearchText(row: RichTableMockRow, cellKey: string): string {
  const parts: string[] = []
  const c = row.cells[cellKey]
  if (c) parts.push(c)
  const i18n = row.cellI18n?.[cellKey]
  if (i18n) for (const v of Object.values(i18n)) if (v?.trim()) parts.push(v.trim())
  return parts.join('\n').toLowerCase()
}

function fieldKeyTail(cellKey: string): string {
  const i = cellKey.lastIndexOf('::')
  return i >= 0 ? cellKey.slice(i + 2) : cellKey
}

export function buildInitialRichMockRows(fieldKeys: string[]): RichTableMockRow[] {
  if (fieldKeys.length === 0) return []
  const cells: Record<string, string> = {}
  for (const k of fieldKeys) {
    const tail = fieldKeyTail(k)
    cells[k] =
      tail === LINKED_TABLE_TARGET_WIKI_FIELD_KEY
        ? ''
        : tail === 'id'
          ? '4179'
          : tail === 'name'
            ? '示例名称'
            : tail === 'atk' || tail === 'def'
              ? '47'
              : tail === 'drop_rate'
                ? '0.11%'
                : '—'
  }
  return [{ key: `rich_${Date.now()}`, hidden: false, cells }]
}
