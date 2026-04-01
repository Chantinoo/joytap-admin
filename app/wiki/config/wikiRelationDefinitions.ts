import type { I18nLabels } from '../components/FieldI18nModal'
import { LANGUAGES } from '../components/fieldI18nConstants'
import { WIKI_CATEGORY_KEYS, WIKI_META } from './wikiFieldSeed'

/** 关联关系里「下拉」选项：含实例存储用 value 与各语言展示名 */
export interface WikiRelationSelectOption {
  value: string
  /** 默认展示名，通常与简体中文一致（兼容无 labelI18n 的旧数据） */
  label: string
  labelI18n?: I18nLabels
}

export function relationSelectOptionDisplayLabel(o: WikiRelationSelectOption): string {
  const i18n = o.labelI18n
  const zh = i18n?.zh?.trim()
  if (zh) return zh
  for (const l of LANGUAGES) {
    const t = i18n?.[l.code]?.trim()
    if (t) return t
  }
  const lab = (o.label || '').trim()
  if (lab) return lab
  return o.value || '（未命名）'
}

/** 与 Wiki 分类 key 一致，作为 schema_id 选项值（MOCK） */
export type WikiSchemaId = (typeof WIKI_CATEGORY_KEYS)[number]

/** 关联关系可扩展字段：仅文本 / 数值 / 下拉 */
export type WikiRelationFieldType = 'text' | 'number' | 'select'

export interface WikiRelationFieldDef {
  key: string
  label: string
  labelI18n?: I18nLabels
  type: WikiRelationFieldType
  selectOptions?: WikiRelationSelectOption[]
}

/** 全局关联关系定义 */
export interface WikiRelationDefinition {
  key: string
  nameI18n: I18nLabels
  sourceSchemaId: WikiSchemaId
  targetSchemaId: WikiSchemaId
  /**
   * 本关联下全部可扩展字段：在 Wiki 详情配置里用户勾选哪些列进表格；
   * 「关联数据」页按实例维护这些字段的值（MOCK）。
   */
  fields: WikiRelationFieldDef[]
}

/** MOCK：某关联关系下多条实例的字段值 */
export interface WikiRelationInstanceRow {
  id: string
  relationKey: string
  sourceCardId?: string
  targetCardId?: string
  /** 与 WikiRelationFieldDef.key 对应 */
  extraValues: Record<string, string | number | boolean>
}

export const SCHEMA_ID_SELECT_OPTIONS = WIKI_CATEGORY_KEYS.filter((k) => WIKI_META[k]).map((k) => ({
  value: k,
  label: `${WIKI_META[k]!.label}（${k}）`,
}))

/** 编辑关联关系弹窗：字段类型（仅三种） */
export const WIKI_RELATION_FIELD_TYPE_OPTIONS: { value: WikiRelationFieldType; label: string }[] = [
  { value: 'text', label: '文本（text）' },
  { value: 'number', label: '数值（number）' },
  { value: 'select', label: '下拉（select）' },
]

/** 列表展示与下拉语义一致：`分类名 / key` */
export function formatWikiSchemaIdCell(schemaId: string): string {
  const label = WIKI_META[schemaId]?.label
  return label ? `${label} / ${schemaId}` : schemaId
}

const RELATIONS_SEED: WikiRelationDefinition[] = [
  {
    key: 'drop_from',
    nameI18n: {
      zh: '掉落来源',
      en: 'Drop sources',
      'zh-tw': '掉落來源',
    },
    sourceSchemaId: 'items',
    targetSchemaId: 'monsters',
    fields: [
      { key: 'id', label: 'ID', labelI18n: { zh: 'ID', en: 'ID' }, type: 'number' },
      { key: 'name', label: '名称', labelI18n: { zh: '名称', en: 'Name' }, type: 'text' },
      { key: 'level', label: '等级', labelI18n: { zh: '等级', en: 'Level' }, type: 'number' },
      { key: 'hp', label: 'HP', labelI18n: { zh: 'HP', en: 'HP' }, type: 'number' },
      {
        key: 'drop_weight',
        label: '掉落权重',
        labelI18n: { zh: '掉落权重', en: 'Drop weight' },
        type: 'number',
      },
      {
        key: 'mvp_only',
        label: '仅 MVP',
        labelI18n: { zh: '仅 MVP', en: 'MVP only' },
        type: 'select',
        selectOptions: [
          { label: '否', value: 'false' },
          { label: '是', value: 'true' },
        ],
      },
      {
        key: 'region_note',
        label: '区域备注',
        labelI18n: { zh: '区域备注', en: 'Region note' },
        type: 'text',
      },
      {
        key: 'loot_tier',
        label: '掉落档位',
        labelI18n: { zh: '掉落档位', en: 'Loot tier' },
        type: 'select',
        selectOptions: [
          { label: '普通', value: 'normal' },
          { label: '稀有', value: 'rare' },
          { label: '传说', value: 'legendary' },
        ],
      },
    ],
  },
  {
    key: 'drop_item',
    nameI18n: { zh: '掉落道具', en: 'Dropped items', 'zh-tw': '掉落道具' },
    sourceSchemaId: 'monsters',
    targetSchemaId: 'items',
    fields: [
      { key: 'id', label: 'ID', labelI18n: { zh: 'ID', en: 'ID' }, type: 'number' },
      {
        key: 'drop_item',
        label: '掉落道具',
        labelI18n: { zh: '掉落道具', en: 'Drop Item' },
        type: 'text',
      },
      { key: 'min_qty', label: '最小数量', type: 'number' },
      {
        key: 'stealable',
        label: '可偷取',
        type: 'select',
        selectOptions: [
          { label: '否', value: 'false' },
          { label: '是', value: 'true' },
        ],
      },
    ],
  },
  {
    key: 'npc_sell_item',
    nameI18n: { zh: 'NPC出售道具', en: 'NPC sold items', 'zh-tw': 'NPC出售道具' },
    sourceSchemaId: 'npcs',
    targetSchemaId: 'items',
    fields: [
      { key: 'id', label: 'ID', labelI18n: { zh: 'ID', en: 'ID' }, type: 'number' },
      { key: 'name', label: '名称', labelI18n: { zh: '名称', en: 'Name' }, type: 'text' },
      { key: 'type', label: '类型', labelI18n: { zh: '类型', en: 'Type' }, type: 'text' },
      { key: 'price', label: '售价', type: 'number' },
      { key: 'stock', label: '库存', type: 'number' },
    ],
  },
]

const INSTANCE_ROWS_SEED: WikiRelationInstanceRow[] = [
  {
    id: 'inst_1',
    relationKey: 'drop_from',
    sourceCardId: '1001',
    targetCardId: '2003',
    extraValues: {
      drop_weight: 12,
      mvp_only: 'false',
      region_note: '妙勒尼山脉',
      loot_tier: 'rare',
    },
  },
  {
    id: 'inst_2',
    relationKey: 'drop_from',
    sourceCardId: '1001',
    targetCardId: '2007',
    extraValues: {
      drop_weight: 3,
      mvp_only: 'true',
      region_note: '古城',
      loot_tier: 'legendary',
    },
  },
  {
    id: 'inst_3',
    relationKey: 'drop_item',
    sourceCardId: '3001',
    targetCardId: '1001',
    extraValues: { min_qty: 1, stealable: 'true' },
  },
  {
    id: 'inst_4',
    relationKey: 'npc_sell_item',
    sourceCardId: '4001',
    targetCardId: '1002',
    extraValues: { price: 1200, stock: 99 },
  },
]

function cloneRelations(rows: WikiRelationDefinition[]): WikiRelationDefinition[] {
  return JSON.parse(JSON.stringify(rows)) as WikiRelationDefinition[]
}

function cloneInstances(rows: WikiRelationInstanceRow[]): WikiRelationInstanceRow[] {
  return JSON.parse(JSON.stringify(rows)) as WikiRelationInstanceRow[]
}

export function buildInitialWikiRelations(): WikiRelationDefinition[] {
  return cloneRelations(RELATIONS_SEED)
}

export function buildInitialRelationInstanceRows(): WikiRelationInstanceRow[] {
  return cloneInstances(INSTANCE_ROWS_SEED)
}

export function relationDisplayName(r: WikiRelationDefinition): string {
  return (r.nameI18n.zh ?? r.key).trim() || r.key
}

export function relationsForSourceSchema(
  list: WikiRelationDefinition[],
  sourceSchemaId: string,
): WikiRelationDefinition[] {
  return list.filter((r) => r.sourceSchemaId === sourceSchemaId)
}

/** 当前 Wiki 出现在源或目标任一侧的关联（用于详情关联表格下拉等） */
export function relationsInvolvingWiki(
  list: WikiRelationDefinition[],
  wikiKey: string,
): WikiRelationDefinition[] {
  return list.filter(
    (r) => r.sourceSchemaId === wikiKey || r.targetSchemaId === wikiKey,
  )
}

export function selectOptionsToLines(opts: WikiRelationSelectOption[] | undefined): string {
  if (!opts?.length) return ''
  return opts.map((o) => `${relationSelectOptionDisplayLabel(o)}|${o.value}`).join('\n')
}

export function parseSelectOptionsLines(raw: string | undefined): WikiRelationSelectOption[] | undefined {
  if (!raw?.trim()) return undefined
  const out: WikiRelationSelectOption[] = []
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t) continue
    const i = t.indexOf('|')
    if (i <= 0) continue
    const lab = t.slice(0, i).trim()
    const val = t.slice(i + 1).trim()
    if (lab && val) out.push({ label: lab, value: val, labelI18n: { zh: lab } })
  }
  return out.length ? out : undefined
}
