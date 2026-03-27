/** 关联表格子列（与 Wiki 字段配置里的 cardRefLinkedFields 项一致） */
export interface LinkedSubColumn {
  fieldKey: string
  type: string
}

/** 必显列：ID（fieldKey 为 id）+ 所有「关联卡片」子列；顺序为定义表中的先后，且 id 永远第一 */
export function getMandatoryLinkedColumnKeys(subCols: LinkedSubColumn[]): string[] {
  const keys: string[] = []
  if (subCols.some((c) => c.fieldKey === 'id')) keys.push('id')
  for (const c of subCols) {
    if (c.type === 'card-ref' && !keys.includes(c.fieldKey)) keys.push(c.fieldKey)
  }
  return keys
}

export function isMandatoryLinkedSubColumn(col: LinkedSubColumn): boolean {
  return col.fieldKey === 'id' || col.type === 'card-ref'
}

/** 强制前缀为必显列，其余可选列保持用户勾选顺序 */
export function normalizeLinkedColumnKeys(columnKeys: string[], subCols: LinkedSubColumn[]): string[] {
  const mandatory = getMandatoryLinkedColumnKeys(subCols)
  const mSet = new Set(mandatory)
  const valid = new Set(subCols.map((c) => c.fieldKey))
  const optionalOrdered = columnKeys.filter((k) => valid.has(k) && !mSet.has(k))
  return [...mandatory, ...optionalOrdered]
}

/** 配置面板勾选列表：ID 与「关联卡片」子列默认排在最前两行（及多个关联卡片时紧随其后），其余按原定义顺序 */
export function sortLinkedSubColsForDisplay<T extends LinkedSubColumn>(subCols: T[]): T[] {
  const mandatoryKeys = getMandatoryLinkedColumnKeys(subCols)
  const mSet = new Set(mandatoryKeys)
  const mandatoryCols = mandatoryKeys
    .map((k) => subCols.find((c) => c.fieldKey === k))
    .filter((c): c is T => c != null)
  const rest = subCols.filter((c) => !mSet.has(c.fieldKey))
  return [...mandatoryCols, ...rest]
}
