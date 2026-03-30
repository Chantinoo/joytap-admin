import type { WikiField } from '../config/wikiFieldSeed'
import { WIKI_META } from '../config/wikiFieldSeed'

/** 关联表格单列：省略 wikiKey 表示当前详情所属 Wiki 的字段 */
export interface LinkedTableColumnRef {
  wikiKey?: string
  fieldKey: string
}

/** MOCK 行 cells 的列键：跨 Wiki 时为 `目标wiki::fieldKey` */
export function linkedColumnStorageKey(homeWikiKey: string, ref: LinkedTableColumnRef): string {
  const remote = ref.wikiKey && ref.wikiKey !== homeWikiKey
  return remote ? `${ref.wikiKey}::${ref.fieldKey}` : ref.fieldKey
}

export function normalizeLinkedTableColumnRefs(section: {
  columnRefs?: LinkedTableColumnRef[]
  columnKeys?: string[]
}): LinkedTableColumnRef[] {
  if (section.columnRefs && section.columnRefs.length > 0) return section.columnRefs
  if (section.columnKeys && section.columnKeys.length > 0) {
    return section.columnKeys.map((fieldKey) => ({ fieldKey }))
  }
  return []
}

export function linkedSectionHasColumns(section: {
  columnRefs?: LinkedTableColumnRef[]
  columnKeys?: string[]
}): boolean {
  return normalizeLinkedTableColumnRefs(section).length > 0
}

export function toggleLinkedLocalColumn(
  refs: LinkedTableColumnRef[],
  fieldKey: string,
  checked: boolean,
): LinkedTableColumnRef[] {
  const isLocal = (r: LinkedTableColumnRef) => !r.wikiKey && r.fieldKey === fieldKey
  if (!checked) return refs.filter((r) => !isLocal(r))
  if (refs.some(isLocal)) return refs
  return [...refs, { fieldKey }]
}

/**
 * 关联表格「选字段」下拉：写入 columnRefs。
 * 目标 Wiki 与当前配置页相同时，记为 `{ fieldKey }`（与本 Wiki 勾选一致）；否则 `{ wikiKey, fieldKey }`。
 */
export function appendLinkedRemoteColumn(
  refs: LinkedTableColumnRef[],
  homeWikiKey: string,
  targetWikiKey: string,
  fieldKey: string,
): LinkedTableColumnRef[] {
  if (!targetWikiKey || !fieldKey) return refs
  const resolvedWiki = (r: LinkedTableColumnRef) => r.wikiKey ?? homeWikiKey
  const exists = refs.some((r) => resolvedWiki(r) === targetWikiKey && r.fieldKey === fieldKey)
  if (exists) return refs
  if (targetWikiKey === homeWikiKey) return [...refs, { fieldKey }]
  return [...refs, { wikiKey: targetWikiKey, fieldKey }]
}

export function removeLinkedRemoteColumn(
  refs: LinkedTableColumnRef[],
  targetWikiKey: string,
  fieldKey: string,
): LinkedTableColumnRef[] {
  return refs.filter((r) => !(r.wikiKey === targetWikiKey && r.fieldKey === fieldKey))
}

export function resolveLinkedColumnMeta(
  homeWikiKey: string,
  ref: LinkedTableColumnRef,
  fieldsByWiki: Record<string, WikiField[]>,
): { cellKey: string; label: string; type: string; field: WikiField | undefined } {
  const targetWiki =
    ref.wikiKey && ref.wikiKey !== homeWikiKey ? ref.wikiKey : homeWikiKey
  const list = fieldsByWiki[targetWiki] ?? []
  const field = list.find((x) => x.key === ref.fieldKey)
  const cellKey = linkedColumnStorageKey(homeWikiKey, ref)
  const baseLabel = field?.label ?? ref.fieldKey
  const remoteWikiLabel = WIKI_META[targetWiki]?.label ?? targetWiki
  /** 跨 Wiki 列统一为「分类名 / 字段名」，与本页本 Wiki 列区分 */
  const label =
    ref.wikiKey && ref.wikiKey !== homeWikiKey ? `${remoteWikiLabel} / ${baseLabel}` : baseLabel
  return { cellKey, label, type: field?.type ?? 'text', field }
}
