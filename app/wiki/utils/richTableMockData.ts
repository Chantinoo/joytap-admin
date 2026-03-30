/** MOCK：普通表格模块在子页中维护的行数据 */
export interface RichTableMockRow {
  key: string
  hidden: boolean
  /** 列 fieldKey → 展示文案（MOCK） */
  cells: Record<string, string>
}

export function emptyCellsForFieldKeys(fieldKeys: string[]): Record<string, string> {
  const cells: Record<string, string> = {}
  for (const k of fieldKeys) cells[k] = ''
  return cells
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
      tail === 'id'
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
