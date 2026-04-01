import type { I18nLabels } from '../components/FieldI18nModal'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type FieldType =
  | 'text'
  | 'rich-text'
  | 'number'
  | 'switch'
  | 'single-image'
  | 'image-group'
  | 'select'
  | 'card-ref'
  | 'card-ref-multi'

/** 关联子表列类型 */
export type CardRefLinkFieldType = 'text' | 'number' | 'rich-text' | 'card-ref'

export interface CardRefLinkedFieldConfig {
  fieldKey: string
  label: string
  i18n?: I18nLabels
  type: CardRefLinkFieldType
}

/** 单选字段下的枚举项 */
export interface WikiSelectOption {
  id: string
  i18n: I18nLabels
}

export interface WikiField {
  key: string
  label: string
  i18n: I18nLabels
  type: FieldType
  visible: boolean
  listDisplay: boolean
  sortable: boolean
  filterable: boolean
  required: boolean
  order: number
  selectOptions?: WikiSelectOption[]
  cardRefWikiKey?: string
  cardRefLinkedFields?: CardRefLinkedFieldConfig[]
  /** 双向关联：源端（发起方）与对端 relationManagedByPairId 成对 */
  relationPairId?: string
  relationMirror?: {
    mirrorFieldKey: string
    mirrorLabel: string
    mirrorI18n?: I18nLabels
  }
  /** 由源端自动生成的对端字段 */
  relationManagedByPairId?: string
  relationSourceWikiKey?: string
  relationSourceFieldKey?: string
}

export function isCardRefFieldType(type: FieldType): boolean {
  return type === 'card-ref' || type === 'card-ref-multi'
}

/** 普通表格不允许选关联关系列：从 fieldKeys 中剔除 */
export function filterRichTableFieldKeys(fieldKeys: string[], fields: WikiField[]): string[] {
  const drop = new Set(fields.filter((f) => isCardRefFieldType(f.type)).map((f) => f.key))
  return fieldKeys.filter((k) => !drop.has(k))
}

/** 图3：升星消耗默认列 */
export const DEFAULT_CARD_REF_LINKED_FIELDS: CardRefLinkedFieldConfig[] = [
  { fieldKey: 'id', label: 'ID', i18n: { zh: 'ID', en: 'ID' }, type: 'number' },
  { fieldKey: 'star_level', label: '星级', i18n: { zh: '星级', en: 'Star Level' }, type: 'number' },
  { fieldKey: 'star_cost', label: '升星消耗', i18n: { zh: '升星消耗', en: 'Star Up Cost' }, type: 'card-ref' },
  { fieldKey: 'amount', label: '数量', i18n: { zh: '数量', en: 'Amount' }, type: 'number' },
  { fieldKey: 'attr', label: '属性', i18n: { zh: '属性', en: 'Attribute' }, type: 'text' },
]

/** 「掉落道具」关联子表默认列 */
export const DEFAULT_DROP_ITEM_CARD_REF_FIELDS: CardRefLinkedFieldConfig[] = [
  { fieldKey: 'id', label: 'ID', i18n: { zh: 'ID', en: 'ID' }, type: 'number' },
  {
    fieldKey: 'drop_item',
    label: '掉落道具',
    i18n: { zh: '掉落道具', en: 'Drop Item' },
    type: 'card-ref',
  },
]

/** 道具 → 怪物 Wiki：关联子表列（用于关联表格跨 Wiki 选列） */
export const DEFAULT_DEMO_MONSTER_CARD_REF_FIELDS: CardRefLinkedFieldConfig[] = [
  { fieldKey: 'id', label: 'ID', i18n: { zh: 'ID', en: 'ID' }, type: 'number' },
  { fieldKey: 'name', label: '名称', i18n: { zh: '名称', en: 'Name' }, type: 'text' },
  { fieldKey: 'level', label: '等级', i18n: { zh: '等级', en: 'Level' }, type: 'number' },
  { fieldKey: 'hp', label: 'HP', i18n: { zh: 'HP', en: 'HP' }, type: 'number' },
]

export const fieldTypeColors: Record<FieldType, string> = {
  text: 'blue',
  'rich-text': 'cyan',
  number: 'green',
  switch: 'lime',
  'single-image': 'purple',
  'image-group': 'magenta',
  select: 'orange',
  'card-ref': 'geekblue',
  'card-ref-multi': 'volcano',
}

export const fieldTypeLabels: Record<FieldType, string> = {
  text: '文本',
  'rich-text': '富文本',
  number: '数值',
  switch: '开关',
  'single-image': '单图',
  'image-group': '图片组',
  select: '单选',
  'card-ref': '关联关系',
  'card-ref-multi': '关联关系（可多条）',
}

/** 子表列类型展示标签 */
export const CARD_REF_LINK_TYPE_LABELS: Record<CardRefLinkFieldType, string> = {
  text: '文本',
  number: '数值',
  'rich-text': '富文本',
  'card-ref': '关联关系',
}

export const CARD_REF_LINK_TYPE_OPTIONS = (
  Object.entries(CARD_REF_LINK_TYPE_LABELS) as [CardRefLinkFieldType, string][]
).map(([value, label]) => ({ value, label }))

export const CARD_REF_SUBCOL_TAG: Record<CardRefLinkFieldType, string> = {
  text: 'blue',
  number: 'green',
  'rich-text': 'cyan',
  'card-ref': 'geekblue',
}

export const WIKI_META: Record<string, { label: string }> = {
  items: { label: '道具' },
  monsters: { label: '怪物' },
  cards: { label: '卡片' },
  pets: { label: '宠物' },
  boxes: { label: '箱子' },
  arrows: { label: '箭矢制作' },
  sets: { label: '套装' },
  skills: { label: '技能模拟' },
  npcs: { label: 'NPC' },
  maps: { label: '地图' },
}

export const WIKI_CATEGORY_KEYS = [
  'items',
  'monsters',
  'cards',
  'pets',
  'boxes',
  'arrows',
  'sets',
  'skills',
  'npcs',
  'maps',
] as const

export const WIKI_RELATION_OPTIONS = WIKI_CATEGORY_KEYS.filter((k) => WIKI_META[k]).map((k) => ({
  value: k,
  label: `${WIKI_META[k].label}（${k}）`,
}))

const FIELDS_SEED: Record<string, WikiField[]> = {
  items: [
    {
      key: 'icon',
      label: '图标',
      i18n: { zh: '图标', en: 'Icon' },
      type: 'single-image',
      visible: true,
      listDisplay: true,
      sortable: false,
      filterable: false,
      required: true,
      order: 1,
    },
    {
      key: 'id',
      label: 'ID',
      i18n: { zh: 'ID', en: 'ID' },
      type: 'number',
      visible: true,
      listDisplay: true,
      sortable: true,
      filterable: false,
      required: true,
      order: 2,
    },
    {
      key: 'name',
      label: '名称',
      i18n: { zh: '名称', en: 'Name' },
      type: 'text',
      visible: true,
      listDisplay: true,
      sortable: false,
      filterable: true,
      required: true,
      order: 3,
    },
    {
      key: 'type',
      label: '类型',
      i18n: { zh: '类型', en: 'Type' },
      type: 'select',
      visible: true,
      listDisplay: true,
      sortable: false,
      filterable: true,
      required: true,
      order: 4,
    },
    {
      key: 'atk',
      label: '攻击力',
      i18n: { zh: '攻击力', en: 'ATK' },
      type: 'number',
      visible: true,
      listDisplay: false,
      sortable: true,
      filterable: false,
      required: false,
      order: 5,
    },
    {
      key: 'def',
      label: '防御力',
      i18n: { zh: '防御力', en: 'DEF' },
      type: 'number',
      visible: true,
      listDisplay: false,
      sortable: true,
      filterable: false,
      required: false,
      order: 6,
    },
    {
      key: 'job',
      label: '职业限制',
      i18n: { zh: '职业限制', en: 'Job Limit' },
      type: 'select',
      visible: true,
      listDisplay: false,
      sortable: false,
      filterable: true,
      required: false,
      order: 7,
    },
    {
      key: 'description',
      label: '描述',
      i18n: { zh: '描述', en: 'Description' },
      type: 'rich-text',
      visible: false,
      listDisplay: false,
      sortable: false,
      filterable: false,
      required: false,
      order: 8,
    },
  ],
  monsters: [
    {
      key: 'icon',
      label: '图标',
      i18n: { zh: '图标', en: 'Icon' },
      type: 'single-image',
      visible: true,
      listDisplay: true,
      sortable: false,
      filterable: false,
      required: true,
      order: 1,
    },
    {
      key: 'id',
      label: 'ID',
      i18n: { zh: 'ID', en: 'ID' },
      type: 'number',
      visible: true,
      listDisplay: true,
      sortable: true,
      filterable: false,
      required: true,
      order: 2,
    },
    {
      key: 'name',
      label: '名称',
      i18n: { zh: '名称', en: 'Name' },
      type: 'text',
      visible: true,
      listDisplay: true,
      sortable: false,
      filterable: true,
      required: true,
      order: 3,
    },
    {
      key: 'level',
      label: '等级',
      i18n: { zh: '等级', en: 'Level' },
      type: 'number',
      visible: true,
      listDisplay: true,
      sortable: true,
      filterable: false,
      required: true,
      order: 4,
    },
    {
      key: 'hp',
      label: 'HP',
      i18n: { zh: 'HP', en: 'HP' },
      type: 'number',
      visible: true,
      listDisplay: true,
      sortable: true,
      filterable: false,
      required: false,
      order: 5,
    },
    {
      key: 'atk',
      label: '攻击',
      i18n: { zh: '攻击', en: 'ATK' },
      type: 'number',
      visible: true,
      listDisplay: false,
      sortable: false,
      filterable: false,
      required: false,
      order: 6,
    },
    {
      key: 'def',
      label: '防御',
      i18n: { zh: '防御', en: 'DEF' },
      type: 'number',
      visible: true,
      listDisplay: false,
      sortable: true,
      filterable: false,
      required: false,
      order: 7,
    },
    {
      key: 'exp',
      label: '基础经验',
      i18n: { zh: '基础经验', en: 'Base EXP' },
      type: 'number',
      visible: true,
      listDisplay: true,
      sortable: true,
      filterable: false,
      required: false,
      order: 8,
    },
    {
      key: 'jexp',
      label: '职业经验',
      i18n: { zh: '职业经验', en: 'Job EXP' },
      type: 'number',
      visible: true,
      listDisplay: true,
      sortable: true,
      filterable: false,
      required: false,
      order: 9,
    },
    {
      key: 'element',
      label: '属性',
      i18n: { zh: '属性', en: 'Element' },
      type: 'select',
      visible: true,
      listDisplay: true,
      sortable: false,
      filterable: true,
      required: false,
      order: 10,
    },
    {
      key: 'race',
      label: '种族',
      i18n: { zh: '种族', en: 'Race' },
      type: 'select',
      visible: true,
      listDisplay: true,
      sortable: false,
      filterable: true,
      required: false,
      order: 11,
    },
    {
      key: 'size',
      label: '体型',
      i18n: { zh: '体型', en: 'Size' },
      type: 'select',
      visible: true,
      listDisplay: false,
      sortable: false,
      filterable: true,
      required: false,
      order: 12,
    },
    {
      key: 'location',
      label: '出没地点',
      i18n: { zh: '出没地点', en: 'Location' },
      type: 'text',
      visible: true,
      listDisplay: false,
      sortable: false,
      filterable: false,
      required: false,
      order: 13,
    },
  ],
}

/** 深拷贝种子行（避免用 structuredClone：部分 Node/边缘环境不可用导致整页 500） */
function cloneWikiFieldRows(rows: WikiField[]): WikiField[] {
  return JSON.parse(JSON.stringify(rows)) as WikiField[]
}

/** 所有分类 key 的初始字段表（未在种子中出现的分类为空数组） */
export function buildInitialWikiFieldsMap(): Record<string, WikiField[]> {
  const out: Record<string, WikiField[]> = {}
  for (const k of WIKI_CATEGORY_KEYS) {
    const rows = FIELDS_SEED[k]
    out[k] = rows ? cloneWikiFieldRows(rows) : []
  }
  return out
}
