import type { WikiField } from '../config/wikiFieldSeed'
import { WIKI_META } from '../config/wikiFieldSeed'
import type { WikiRelationFieldDef } from '../config/wikiRelationDefinitions'

/** 关联表格（全局关联关系）固定首列：展示目标 Wiki 名称 */
export const LINKED_TABLE_TARGET_WIKI_FIELD_KEY = '__target_wiki__'

/** 虚拟列在 meta.type 中的取值（非 WikiField.type），UI 展示为「关联」 */
export const LINKED_TABLE_TARGET_WIKI_COLUMN_TYPE = 'linked-wiki-ref'
export const LINKED_TABLE_TARGET_WIKI_TYPE_LABEL = '关联'

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
  /** 与 append 一致：目标与当前 Wiki 相同时 ref 可能省略 wikiKey */
  homeWikiKey?: string,
): LinkedTableColumnRef[] {
  return refs.filter((r) => {
    const resolved = r.wikiKey ?? homeWikiKey
    return !(resolved === targetWikiKey && r.fieldKey === fieldKey)
  })
}

/** 全局关联关系下：首列固定为「目标 Wiki」，其余列顺序由勾选先后决定（仅存于 columnRefs 数组顺序中） */
export function enforceLinkedTableMandatoryTargetFirst(
  refs: LinkedTableColumnRef[],
  homeWikiKey: string,
  targetWikiKey: string,
): LinkedTableColumnRef[] {
  if (!targetWikiKey) {
    return refs.filter((r) => r.fieldKey !== LINKED_TABLE_TARGET_WIKI_FIELD_KEY)
  }
  const mandatory: LinkedTableColumnRef =
    targetWikiKey === homeWikiKey
      ? { fieldKey: LINKED_TABLE_TARGET_WIKI_FIELD_KEY }
      : { wikiKey: targetWikiKey, fieldKey: LINKED_TABLE_TARGET_WIKI_FIELD_KEY }
  const others = refs.filter((r) => r.fieldKey !== LINKED_TABLE_TARGET_WIKI_FIELD_KEY)
  return [mandatory, ...others]
}

export function appendLinkedRelationFieldColumn(
  refs: LinkedTableColumnRef[],
  homeWikiKey: string,
  targetWikiKey: string,
  fieldKey: string,
): LinkedTableColumnRef[] {
  if (!targetWikiKey || !fieldKey) return refs
  const normalized = enforceLinkedTableMandatoryTargetFirst(refs, homeWikiKey, targetWikiKey)
  const mandatory = normalized[0]!
  const tail = normalized.slice(1)
  const appended = appendLinkedRemoteColumn(tail, homeWikiKey, targetWikiKey, fieldKey)
  return [mandatory, ...appended]
}

export function removeLinkedRelationFieldColumn(
  refs: LinkedTableColumnRef[],
  homeWikiKey: string,
  targetWikiKey: string,
  fieldKey: string,
): LinkedTableColumnRef[] {
  if (fieldKey === LINKED_TABLE_TARGET_WIKI_FIELD_KEY) return refs
  if (!targetWikiKey) return removeLinkedRemoteColumn(refs, targetWikiKey, fieldKey, homeWikiKey)
  const normalized = enforceLinkedTableMandatoryTargetFirst(refs, homeWikiKey, targetWikiKey)
  const mandatory = normalized[0]!
  const tail = normalized.slice(1)
  const removed = removeLinkedRemoteColumn(tail, targetWikiKey, fieldKey, homeWikiKey)
  return [mandatory, ...removed]
}

export function isLinkedRelationMandatoryRef(
  ref: LinkedTableColumnRef,
  homeWikiKey: string,
  targetWikiKey: string,
): boolean {
  return (
    ref.fieldKey === LINKED_TABLE_TARGET_WIKI_FIELD_KEY &&
    (ref.wikiKey ?? homeWikiKey) === targetWikiKey
  )
}

/** 必选关联列是否固定在首列（灰置态） */
export function linkedRelationMandatoryColumnFirst(
  refs: LinkedTableColumnRef[],
  homeWikiKey: string,
  targetWikiKey: string,
): boolean {
  const first = refs[0]
  if (!first) return false
  return isLinkedRelationMandatoryRef(first, homeWikiKey, targetWikiKey)
}

function dedupeLinkedRelationMandatory(
  refs: LinkedTableColumnRef[],
  homeWikiKey: string,
  targetWikiKey: string,
): LinkedTableColumnRef[] {
  let kept = false
  return refs.filter((r) => {
    if (!isLinkedRelationMandatoryRef(r, homeWikiKey, targetWikiKey)) return true
    if (kept) return false
    kept = true
    return true
  })
}

function mandatoryRelationRef(homeWikiKey: string, targetWikiKey: string): LinkedTableColumnRef {
  return targetWikiKey === homeWikiKey
    ? { fieldKey: LINKED_TABLE_TARGET_WIKI_FIELD_KEY }
    : { wikiKey: targetWikiKey, fieldKey: LINKED_TABLE_TARGET_WIKI_FIELD_KEY }
}

/** 保证存在且仅有一条必选虚拟列；不改变其它列相对顺序 */
export function ensureLinkedRelationMandatoryPresent(
  refs: LinkedTableColumnRef[],
  homeWikiKey: string,
  targetWikiKey: string,
): LinkedTableColumnRef[] {
  if (!targetWikiKey) {
    return refs.filter((r) => r.fieldKey !== LINKED_TABLE_TARGET_WIKI_FIELD_KEY)
  }
  const deduped = dedupeLinkedRelationMandatory(refs, homeWikiKey, targetWikiKey)
  const has = deduped.some((r) => isLinkedRelationMandatoryRef(r, homeWikiKey, targetWikiKey))
  if (has) return deduped
  return [mandatoryRelationRef(homeWikiKey, targetWikiKey), ...deduped]
}

/** 过滤非法列、去重必选列、补足必选列（不强制首列，保留点亮后的顺序） */
export function sanitizeLinkedRelationColumnRefs(
  refs: LinkedTableColumnRef[],
  homeWikiKey: string,
  targetWikiKey: string,
): LinkedTableColumnRef[] {
  if (!targetWikiKey) {
    return refs.filter((r) => r.fieldKey !== LINKED_TABLE_TARGET_WIKI_FIELD_KEY)
  }
  const filtered = refs.filter((ref) => (ref.wikiKey ?? homeWikiKey) === targetWikiKey)
  return ensureLinkedRelationMandatoryPresent(filtered, homeWikiKey, targetWikiKey)
}

/** 点亮：必选列移到当前列表末尾，其余列相对顺序不变 */
export function moveLinkedRelationMandatoryToEnd(
  refs: LinkedTableColumnRef[],
  homeWikiKey: string,
  targetWikiKey: string,
): LinkedTableColumnRef[] {
  const withM = ensureLinkedRelationMandatoryPresent(
    dedupeLinkedRelationMandatory([...refs], homeWikiKey, targetWikiKey),
    homeWikiKey,
    targetWikiKey,
  )
  const mandatory = withM.find((r) => isLinkedRelationMandatoryRef(r, homeWikiKey, targetWikiKey))!
  const others = withM.filter((r) => !isLinkedRelationMandatoryRef(r, homeWikiKey, targetWikiKey))
  return [...others, mandatory]
}

/**
 * 点亮态下追加可选列：插在整表末尾（与灰置态「必选后追加」区分）
 */
export function appendLinkedRelationFieldColumnAtEnd(
  refs: LinkedTableColumnRef[],
  homeWikiKey: string,
  targetWikiKey: string,
  fieldKey: string,
): LinkedTableColumnRef[] {
  if (!targetWikiKey || !fieldKey) return refs
  const base =
    refs.length > 0
      ? ensureLinkedRelationMandatoryPresent(
          dedupeLinkedRelationMandatory([...refs], homeWikiKey, targetWikiKey),
          homeWikiKey,
          targetWikiKey,
        )
      : enforceLinkedTableMandatoryTargetFirst([], homeWikiKey, targetWikiKey)
  const resolved = (r: LinkedTableColumnRef) => r.wikiKey ?? homeWikiKey
  if (base.some((r) => resolved(r) === targetWikiKey && r.fieldKey === fieldKey)) return base
  const newRef =
    targetWikiKey === homeWikiKey ? { fieldKey } : { wikiKey: targetWikiKey, fieldKey }
  return [...base, newRef]
}

/** 点亮态下移除可选列，不改变其余列顺序 */
export function removeLinkedRelationOptionalColumn(
  refs: LinkedTableColumnRef[],
  homeWikiKey: string,
  targetWikiKey: string,
  fieldKey: string,
): LinkedTableColumnRef[] {
  if (fieldKey === LINKED_TABLE_TARGET_WIKI_FIELD_KEY) return refs
  return removeLinkedRemoteColumn(refs, targetWikiKey, fieldKey, homeWikiKey)
}

export function resolveLinkedColumnMeta(
  homeWikiKey: string,
  ref: LinkedTableColumnRef,
  fieldsByWiki: Record<string, WikiField[]>,
  opts?: {
    /** 关联关系中的可扩展字段（当目标 Wiki 字段表无对应 key 时仍显示标签/类型） */
    relationFields?: WikiRelationFieldDef[]
    targetWikiKey?: string
    /** 全局关联关系的展示名：虚拟列 __target_wiki__ 的列标题（如「掉落来源」） */
    relationDisplayLabel?: string
  },
): { cellKey: string; label: string; type: string; field: WikiField | undefined } {
  if (ref.fieldKey === LINKED_TABLE_TARGET_WIKI_FIELD_KEY) {
    const cellKey = linkedColumnStorageKey(homeWikiKey, ref)
    const label = opts?.relationDisplayLabel?.trim() || '目标 Wiki'
    return {
      cellKey,
      label,
      type: LINKED_TABLE_TARGET_WIKI_COLUMN_TYPE,
      field: undefined,
    }
  }
  const targetWiki =
    ref.wikiKey && ref.wikiKey !== homeWikiKey ? ref.wikiKey : homeWikiKey
  const list = fieldsByWiki[targetWiki] ?? []
  let field = list.find((x) => x.key === ref.fieldKey)
  const cellKey = linkedColumnStorageKey(homeWikiKey, ref)
  let baseLabel = field?.label ?? ref.fieldKey
  let typeStr = field?.type ?? 'text'
  if (!field && opts?.relationFields?.length && opts.targetWikiKey === targetWiki) {
    const df = opts.relationFields.find((d) => d.key === ref.fieldKey)
    if (df) {
      baseLabel = df.labelI18n?.zh?.trim() || df.label
      typeStr = df.type
    }
  }
  const remoteWikiLabel = WIKI_META[targetWiki]?.label ?? targetWiki
  /** 跨 Wiki 列统一为「分类名 / 字段名」，与本页本 Wiki 列区分 */
  const label =
    ref.wikiKey && ref.wikiKey !== homeWikiKey ? `${remoteWikiLabel} / ${baseLabel}` : baseLabel
  return { cellKey, label, type: typeStr, field }
}
