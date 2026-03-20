'use client'

import React, { useState, useRef } from 'react'
import {
  Table, Button, Tag, Space, Input, Select, Modal, Form,
  Tooltip, Popconfirm, message, Checkbox, Drawer,
} from 'antd'
import { Plus, Edit2, Trash2, Languages } from 'lucide-react'
import PageBreadcrumb from '../../../components/PageBreadcrumb'
import FieldI18nModal, { type I18nLabels, LANGUAGES } from '../../components/FieldI18nModal'
import FieldI18nEditor from '../../components/FieldI18nEditor'
import ListStylePreview, { LIST_STYLES, type ListStyle } from '../../components/ListStylePreview'
import DetailStylePreview, { DETAIL_STYLES, type DetailStyle, type Detail1Config, type Detail2Config, type RichTableSection } from '../../components/DetailStylePreview'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type FieldType =
  | 'text'           // 文本
  | 'rich-text'      // 富文本
  | 'number'         // 数值
  | 'switch'         // 开关
  | 'single-image'   // 单图
  | 'image-group'    // 图片组
  | 'select'         // 单选
  | 'card-ref'       // 关联卡片
  | 'card-ref-multi' // 关联卡片（可倍数）

/** 单选字段下的枚举项（展示名以 i18n.zh 为主，与字段「显示名称」多语言一致） */
interface WikiSelectOption {
  id: string
  i18n: I18nLabels
}

function normalizeSelectOptions(raw: unknown): WikiSelectOption[] {
  if (!raw || !Array.isArray(raw)) return []
  return raw.map((item, i) => {
    if (typeof item === 'string') {
      return { id: `opt_mig_${i}_${encodeURIComponent(item).replace(/%/g, '')}`, i18n: { zh: item } }
    }
    const o = item as WikiSelectOption
    if (o?.id && o.i18n && typeof o.i18n === 'object') return o
    return { id: `opt_mig_${i}_${String(item)}`, i18n: { zh: String(item) } }
  })
}

function selectOptionLabel(opt: WikiSelectOption): string {
  return opt.i18n.zh?.trim() || LANGUAGES.map(l => opt.i18n[l.code]).find(Boolean) || '（未命名）'
}

interface WikiField {
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
  selectOptions?: WikiSelectOption[]  // 仅 type === 'select' 时使用
}

const fieldTypeColors: Record<FieldType, string> = {
  'text':           'blue',
  'rich-text':      'cyan',
  'number':         'green',
  'switch':         'lime',
  'single-image':   'purple',
  'image-group':    'magenta',
  'select':         'orange',
  'card-ref':       'geekblue',
  'card-ref-multi': 'volcano',
}

const fieldTypeLabels: Record<FieldType, string> = {
  'text':           '文本',
  'rich-text':      '富文本',
  'number':         '数值',
  'switch':         '开关',
  'single-image':   '单图',
  'image-group':    '图片组',
  'select':         '单选',
  'card-ref':       '关联卡片',
  'card-ref-multi': '关联卡片（可倍数）',
}

// ─────────────────────────────────────────────
// Wiki 分类元数据
// ─────────────────────────────────────────────
const WIKI_META: Record<string, { label: string }> = {
  items:    { label: '道具' },
  monsters: { label: '怪物' },
  cards:    { label: '卡片' },
  pets:     { label: '宠物' },
  boxes:    { label: '箱子' },
  arrows:   { label: '箭矢制作' },
  sets:     { label: '套装' },
  skills:   { label: '技能模拟' },
  npcs:     { label: 'NPC' },
  maps:     { label: '地图' },
}

// ─────────────────────────────────────────────
// 字段数据（按分类 key）
// ─────────────────────────────────────────────
const FIELDS_BY_KEY: Record<string, WikiField[]> = {
  items: [
    { key: 'icon',        label: '图标',     i18n: { zh: '图标',     en: 'Icon'        }, type: 'single-image', visible: true,  listDisplay: true,  sortable: false, filterable: false, required: true,  order: 1 },
    { key: 'id',          label: 'ID',       i18n: { zh: 'ID',       en: 'ID'          }, type: 'number',       visible: true,  listDisplay: true,  sortable: true,  filterable: false, required: true,  order: 2 },
    { key: 'name',        label: '名称',     i18n: { zh: '名称',     en: 'Name'        }, type: 'text',         visible: true,  listDisplay: true,  sortable: false, filterable: true,  required: true,  order: 3 },
    { key: 'type',        label: '类型',     i18n: { zh: '类型',     en: 'Type'        }, type: 'select',       visible: true,  listDisplay: true,  sortable: false, filterable: true,  required: true,  order: 4 },
    { key: 'atk',         label: '攻击力',   i18n: { zh: '攻击力',   en: 'ATK'         }, type: 'number',       visible: true,  listDisplay: false, sortable: true,  filterable: false, required: false, order: 5 },
    { key: 'def',         label: '防御力',   i18n: { zh: '防御力',   en: 'DEF'         }, type: 'number',       visible: true,  listDisplay: false, sortable: true,  filterable: false, required: false, order: 6 },
    { key: 'job',         label: '职业限制', i18n: { zh: '职业限制', en: 'Job Limit'   }, type: 'select',       visible: true,  listDisplay: false, sortable: false, filterable: true,  required: false, order: 7 },
    { key: 'description', label: '描述',     i18n: { zh: '描述',     en: 'Description' }, type: 'rich-text',    visible: false, listDisplay: false, sortable: false, filterable: false, required: false, order: 8 },
    { key: 'set_parts',   label: '套装组成', i18n: { zh: '套装组成', en: 'Set Parts'   }, type: 'card-ref',     visible: true,  listDisplay: true,  sortable: false, filterable: false, required: false, order: 9 },
  ],
  monsters: [
    { key: 'icon',     label: '图标',     i18n: { zh: '图标',     en: 'Icon'     }, type: 'single-image', visible: true,  listDisplay: true,  sortable: false, filterable: false, required: true,  order: 1 },
    { key: 'id',       label: 'ID',       i18n: { zh: 'ID',       en: 'ID'       }, type: 'number',       visible: true,  listDisplay: true,  sortable: true,  filterable: false, required: true,  order: 2 },
    { key: 'name',     label: '名称',     i18n: { zh: '名称',     en: 'Name'     }, type: 'text',         visible: true,  listDisplay: true,  sortable: false, filterable: true,  required: true,  order: 3 },
    { key: 'level',    label: '等级',     i18n: { zh: '等级',     en: 'Level'    }, type: 'number',       visible: true,  listDisplay: true,  sortable: true,  filterable: false, required: true,  order: 4 },
    { key: 'hp',       label: 'HP',       i18n: { zh: 'HP',       en: 'HP'       }, type: 'number',       visible: true,  listDisplay: true,  sortable: true,  filterable: false, required: false, order: 5 },
    { key: 'atk',      label: '攻击',     i18n: { zh: '攻击',     en: 'ATK'      }, type: 'number',       visible: true,  listDisplay: false, sortable: false, filterable: false, required: false, order: 6 },
    { key: 'def',      label: '防御',     i18n: { zh: '防御',     en: 'DEF'      }, type: 'number',       visible: true,  listDisplay: false, sortable: true,  filterable: false, required: false, order: 7 },
    { key: 'exp',      label: '基础经验', i18n: { zh: '基础经验', en: 'Base EXP' }, type: 'number',       visible: true,  listDisplay: true,  sortable: true,  filterable: false, required: false, order: 8 },
    { key: 'jexp',     label: '职业经验', i18n: { zh: '职业经验', en: 'Job EXP'  }, type: 'number',       visible: true,  listDisplay: true,  sortable: true,  filterable: false, required: false, order: 9 },
    { key: 'element',  label: '属性',     i18n: { zh: '属性',     en: 'Element'  }, type: 'select',       visible: true,  listDisplay: true,  sortable: false, filterable: true,  required: false, order: 10 },
    { key: 'race',     label: '种族',     i18n: { zh: '种族',     en: 'Race'     }, type: 'select',       visible: true,  listDisplay: true,  sortable: false, filterable: true,  required: false, order: 11 },
    { key: 'size',     label: '体型',     i18n: { zh: '体型',     en: 'Size'     }, type: 'select',       visible: true,  listDisplay: false, sortable: false, filterable: true,  required: false, order: 12 },
    { key: 'location', label: '出没地点', i18n: { zh: '出没地点', en: 'Location' }, type: 'text',         visible: true,  listDisplay: false, sortable: false, filterable: false, required: false, order: 13 },
  ],
}

const DEFAULT_FIELDS: WikiField[] = []

export default function WikiConfigPageClient({ wikiKey }: { wikiKey: string }) {
  const meta = WIKI_META[wikiKey]
  const wikiLabel = meta?.label ?? wikiKey

  const [messageApi, contextHolder] = message.useMessage()
  const [fields, setFields] = useState<WikiField[]>(FIELDS_BY_KEY[wikiKey] ?? DEFAULT_FIELDS)
  const sortedFields = [...fields].sort((a, b) => a.order - b.order)

  // ── 字段弹窗 ──────────────────────────────────
  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<WikiField | null>(null)
  const [fieldForm] = Form.useForm()
  const watchedType = Form.useWatch('type', fieldForm)
  // 单选选项列表（弹窗内独立管理，不走 Form）
  const [selectOptions, setSelectOptions] = useState<WikiSelectOption[]>([])
  const [optionInput, setOptionInput] = useState('')

  const openAddFieldModal = () => {
    setEditingField(null)
    fieldForm.resetFields()
    fieldForm.setFieldsValue({ type: 'text' })
    setSelectOptions([])
    setOptionInput('')
    setFieldModalOpen(true)
  }
  const openEditFieldModal = (record: WikiField) => {
    setEditingField(record)
    fieldForm.setFieldsValue(record)
    setSelectOptions(normalizeSelectOptions(record.selectOptions))
    setOptionInput('')
    setFieldModalOpen(true)
  }
  const handleFieldSave = () => {
    fieldForm.validateFields().then(values => {
      const defaults = { visible: true, listDisplay: true, sortable: false, filterable: false }
      const extra = values.type === 'select' ? { selectOptions } : {}
      if (editingField) {
        setFields(prev => prev.map(f => f.key === editingField.key ? { ...f, ...values, required: editingField.required, ...extra } : f))
        messageApi.success('字段已更新')
      } else {
        if (fields.some(f => f.key === values.key)) { messageApi.error('字段 Key 已存在'); return }
        const maxOrder = Math.max(...fields.map(f => f.order), 0)
        setFields(prev => [...prev, { ...defaults, ...values, required: false, ...extra, i18n: { zh: values.label }, order: maxOrder + 1 }])
        messageApi.success('字段已新增')
      }
      setFieldModalOpen(false)
    })
  }

  const addSelectOption = () => {
    const val = optionInput.trim()
    if (!val) return
    if (selectOptions.some(o => (o.i18n.zh || '').trim() === val)) { messageApi.warning('选项已存在'); return }
    const id = `opt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    setSelectOptions(prev => [...prev, { id, i18n: { zh: val } }])
    setOptionInput('')
  }

  // ── 单选项多语言：侧滑抽屉编辑 ──
  const [optionDrawerId, setOptionDrawerId] = useState<string | null>(null)

  const patchSelectOptionI18n = (optionId: string, i18n: I18nLabels) => {
    setSelectOptions(prev => prev.map(o => (o.id === optionId ? { ...o, i18n } : o)))
  }

  const handleDeleteField = (key: string) => {
    setFields(prev => prev.filter(f => f.key !== key))
    setListFieldKeys(prev => prev.filter(k => k !== key))
    messageApi.success('字段已删除')
  }

  // ── 多语言弹窗 ────────────────────────────────
  const [i18nModalOpen, setI18nModalOpen] = useState(false)
  const [i18nTarget, setI18nTarget] = useState<WikiField | null>(null)
  const openI18nModal = (record: WikiField) => { setI18nTarget(record); setI18nModalOpen(true) }
  const handleI18nSave = (i18n: I18nLabels) => {
    if (!i18nTarget) return
    setFields(prev => prev.map(f => f.key === i18nTarget.key ? { ...f, i18n, label: i18n.zh || f.label } : f))
    setI18nModalOpen(false)
    messageApi.success('多语言配置已保存')
  }

  // ── 拖拽排序 ──────────────────────────────────
  const fieldDragIndex = useRef<number | null>(null)
  const fieldDragOverIndex = useRef<number | null>(null)
  const handleFieldDragStart = (index: number) => { fieldDragIndex.current = index }
  const handleFieldDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); fieldDragOverIndex.current = index }
  const handleFieldDrop = () => {
    if (fieldDragIndex.current === null || fieldDragOverIndex.current === null || fieldDragIndex.current === fieldDragOverIndex.current) return
    const reordered = [...sortedFields]
    const [moved] = reordered.splice(fieldDragIndex.current, 1)
    reordered.splice(fieldDragOverIndex.current, 0, moved)
    setFields(() => reordered.map((f, i) => ({ ...f, order: i + 1 })))
    fieldDragIndex.current = null; fieldDragOverIndex.current = null
  }

  // ── 列表样式 ──────────────────────────────────
  const [selectedStyle, setSelectedStyle] = useState<ListStyle>('card-list')
  const [listFieldKeys, setListFieldKeys] = useState<string[]>([])
  const currentStyleConfig = LIST_STYLES.find(s => s.id === selectedStyle)!
  const allowedFieldKeys = sortedFields.filter(f => f.visible && currentStyleConfig.allowedTypes.includes(f.type)).map(f => f.key)
  const validListFieldKeys = listFieldKeys.filter(k => allowedFieldKeys.includes(k))

  // ── 详情样式 ──────────────────────────────────
  const [selectedDetailStyle, setSelectedDetailStyle] = useState<DetailStyle>('detail-1')
  const [detail1Config, setDetail1Config] = useState<Detail1Config>({ mainTitle: '基本信息', mainFieldKeys: [], richTableSections: [], sideTitle: '道具信息', sideFieldKeys: [] })
  const [detail2Config, setDetail2Config] = useState<Detail2Config>({ mainFieldKeys: [], sideTitle: '道具信息', sideFieldKeys: [] })

  const addRichTableSection = () => {
    setDetail1Config(prev => ({ ...prev, richTableSections: [...prev.richTableSections, { id: `section_${Date.now()}`, title: '新区域', fieldKeys: [] }] }))
  }
  const removeRichTableSection = (id: string) => {
    setDetail1Config(prev => ({ ...prev, richTableSections: prev.richTableSections.filter(s => s.id !== id) }))
  }
  const updateRichTableSection = (id: string, updates: Partial<RichTableSection>) => {
    setDetail1Config(prev => ({ ...prev, richTableSections: prev.richTableSections.map(s => s.id === id ? { ...s, ...updates } : s) }))
  }

  // ── 字段表格列 ────────────────────────────────
  const fieldColumns = [
    {
      title: '字段 Key', dataIndex: 'key', key: 'key',
      render: (v: string) => <code style={{ fontSize: 12, background: '#F3F4F6', padding: '2px 6px', borderRadius: 4, color: '#374151' }}>{v}</code>,
    },
    {
      title: '显示名称', dataIndex: 'label', key: 'label',
      render: (v: string, record: WikiField) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13 }}>{v}</span>
          <Tooltip title="配置多语言">
            <Button size="small" type="text" icon={<Languages size={12} />} style={{ color: '#1677FF', padding: '0 4px', height: 20 }} onClick={() => openI18nModal(record)} />
          </Tooltip>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {LANGUAGES.filter(l => record.i18n?.[l.code]).map(l => (
              <Tooltip key={l.code} title={`${l.label}: ${record.i18n?.[l.code]}`}>
                <span style={{ fontSize: 11, color: '#6B7280', background: '#F3F4F6', padding: '1px 5px', borderRadius: 3, cursor: 'default', lineHeight: '18px' }}>{l.code}</span>
              </Tooltip>
            ))}
          </div>
        </div>
      ),
    },
    { title: '类型', dataIndex: 'type', key: 'type', render: (v: FieldType) => <Tag color={fieldTypeColors[v]}>{fieldTypeLabels[v] ?? v}</Tag> },
    {
      title: '操作', key: 'action',
      render: (_: unknown, record: WikiField) => (
        <Space size={4}>
          <Button size="small" type="text" icon={<Edit2 size={13} />} onClick={() => openEditFieldModal(record)}>编辑</Button>
          <Popconfirm title="确认删除该字段？" description="删除后前台将不再展示此字段数据。"
            onConfirm={() => handleDeleteField(record.key)} okText="删除" cancelText="取消" okButtonProps={{ danger: true }}>
            <Button size="small" type="text" danger icon={<Trash2 size={13} />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {contextHolder}
      <PageBreadcrumb items={[{ label: 'Wiki 管理', href: '/wiki' }, { label: `${wikiLabel} 配置` }]} />

      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── 字段配置 ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>字段配置</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  配置前台页面展示的字段及其属性。点击名称旁的
                  <Languages size={13} style={{ color: '#1677FF', flexShrink: 0, verticalAlign: 'middle' }} />
                  图标可配置多语言，支持 AI 一键翻译。
                </p>
              </div>
              <Button type="primary" icon={<Plus size={14} />} style={{ borderRadius: 6, flexShrink: 0 }} onClick={openAddFieldModal}>
                新增字段
              </Button>
            </div>
            {sortedFields.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '32px 0', border: '1px dashed #E5E7EB', borderRadius: 8 }}>
                暂无字段配置，点击「新增字段」开始添加
              </div>
            ) : (
              <Table
                dataSource={sortedFields}
                columns={fieldColumns}
                rowKey="key"
                size="small"
                pagination={false}
                onRow={(_, index) => ({
                  draggable: true,
                  onDragStart: () => handleFieldDragStart(index!),
                  onDragOver: (e: React.DragEvent) => handleFieldDragOver(e, index!),
                  onDrop: handleFieldDrop,
                })}
              />
            )}
          </div>

          <div style={{ borderTop: '1px solid #E5E7EB' }} />

          {/* ── 列表样式 ── */}
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>列表样式</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>选择前台列表页的展示样式，不同样式支持的字段数量和类型不同。</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
              {LIST_STYLES.map(s => (
                <div key={s.id} onClick={() => {
                  setSelectedStyle(s.id)
                  let valid = listFieldKeys.filter(k => { const f = fields.find(ff => ff.key === k); return f && s.allowedTypes.includes(f.type) }).slice(0, s.maxFields)
                  if (s.requireImage) {
                    const firstImg = sortedFields.find(f => f.visible && f.type === 'single-image')
                    if (firstImg && !valid.includes(firstImg.key)) valid = [firstImg.key, ...valid].slice(0, s.maxFields)
                  }
                  setListFieldKeys(valid)
                }} style={{ padding: '12px 14px', border: `2px solid ${selectedStyle === s.id ? '#1677FF' : '#E5E7EB'}`, borderRadius: 8, cursor: 'pointer', background: selectedStyle === s.id ? '#EFF6FF' : '#fff', transition: 'all 0.15s', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{s.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3, lineHeight: 1.4 }}>{s.description}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                    {s.requireImage ? `图片必选 + 最多 ${s.maxTextFields ?? (s.maxFields - 1)} 个文本/数字` : `最多 ${s.maxFields} 个字段`}
                  </div>
                  {selectedStyle === s.id && <Tag color="blue" style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, padding: '0 4px' }}>已选</Tag>}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 260, flexShrink: 0, border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA', padding: '12px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 10 }}>
                  选择展示字段 <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 6 }}>({validListFieldKeys.length}/{currentStyleConfig.maxFields})</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {sortedFields.filter(f => f.visible).map(f => {
                    const allowed = currentStyleConfig.allowedTypes.includes(f.type)
                    const checked = validListFieldKeys.includes(f.key)
                    const isImage = f.type === 'single-image'
                    const checkedImageKeys = validListFieldKeys.filter(k => { const ff = sortedFields.find(x => x.key === k); return ff?.type === 'single-image' })
                    const checkedTextKeys = validListFieldKeys.filter(k => { const ff = sortedFields.find(x => x.key === k); return ff && ff.type !== 'single-image' })
                    const firstImageField = sortedFields.find(ff => ff.visible && ff.type === 'single-image')
                    const isLockedImage = currentStyleConfig.requireImage && isImage && firstImageField?.key === f.key
                    let disabled = !allowed
                    if (isLockedImage) { disabled = true }
                    else if (!disabled && !checked) {
                      if (currentStyleConfig.requireImage) {
                        if (isImage && checkedImageKeys.length >= 1) disabled = true
                        if (!isImage && checkedTextKeys.length >= (currentStyleConfig.maxTextFields ?? (currentStyleConfig.maxFields - 1))) disabled = true
                      } else { if (validListFieldKeys.length >= currentStyleConfig.maxFields) disabled = true }
                    }
                    return (
                      <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Checkbox checked={checked} disabled={disabled} onChange={e => { if (e.target.checked) setListFieldKeys(prev => [...prev, f.key]); else setListFieldKeys(prev => prev.filter(k => k !== f.key)) }} />
                        <span style={{ fontSize: 13, color: allowed ? '#374151' : '#9CA3AF' }}>{f.label}</span>
                        <Tag color={fieldTypeColors[f.type as FieldType]} style={{ fontSize: 11, padding: '0 4px' }}>{fieldTypeLabels[f.type as FieldType] ?? f.type}</Tag>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 10 }}>前端预览 <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>仅供参考</Tag></div>
                <div style={{ padding: 16, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, minHeight: 120 }}>
                  {validListFieldKeys.length === 0
                    ? <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '24px 0' }}>请在左侧勾选至少一个字段</div>
                    : <ListStylePreview style={selectedStyle} fields={sortedFields} selectedFieldKeys={validListFieldKeys} />}
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #E5E7EB' }} />

          {/* ── 详情样式 ── */}
          <div>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>详情样式</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>选择前台详情页的展示样式，配置主区域与侧边栏显示的字段。</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
              {DETAIL_STYLES.map(s => (
                <div key={s.id} onClick={() => setSelectedDetailStyle(s.id)} style={{ padding: '12px 14px', border: `2px solid ${selectedDetailStyle === s.id ? '#1677FF' : '#E5E7EB'}`, borderRadius: 8, cursor: 'pointer', background: selectedDetailStyle === s.id ? '#EFF6FF' : '#fff', transition: 'all 0.15s', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3, lineHeight: 1.4 }}>{s.description}</div>
                    </div>
                  </div>
                  {selectedDetailStyle === s.id && <Tag color="blue" style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, padding: '0 4px' }}>已选</Tag>}
                </div>
              ))}
            </div>

            {selectedDetailStyle === 'detail-1' ? (
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA', padding: '12px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>① 主区域字段</div>
                    <div style={{ marginBottom: 8, padding: '4px 8px', background: '#F3F4F6', borderRadius: 4, fontSize: 12, color: '#6B7280' }}>
                      <span style={{ color: '#9CA3AF', fontSize: 11, marginRight: 6 }}>标题</span><span style={{ color: '#374151', fontWeight: 500 }}>名称</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {sortedFields.filter(f => f.visible).map(f => {
                        const allowed = ['single-image', 'text', 'rich-text', 'number'].includes(f.type)
                        const checked = detail1Config.mainFieldKeys.includes(f.key)
                        const usedElsewhere = detail1Config.sideFieldKeys.includes(f.key)
                        return (
                          <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Checkbox checked={checked} disabled={!allowed || usedElsewhere} onChange={e => setDetail1Config(prev => ({ ...prev, mainFieldKeys: e.target.checked ? [...prev.mainFieldKeys, f.key] : prev.mainFieldKeys.filter(k => k !== f.key) }))} />
                            <span style={{ fontSize: 12, color: allowed && !usedElsewhere ? '#374151' : '#9CA3AF' }}>{f.label}</span>
                            <Tag color={fieldTypeColors[f.type as FieldType]} style={{ fontSize: 10, padding: '0 3px' }}>{fieldTypeLabels[f.type as FieldType] ?? f.type}</Tag>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>② 富媒体表格区域</span>
                      <Button size="small" type="dashed" icon={<Plus size={12} />} onClick={addRichTableSection}>添加区域</Button>
                    </div>
                    {detail1Config.richTableSections.length === 0
                      ? <div style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>暂无区域，点击「添加区域」</div>
                      : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {detail1Config.richTableSections.map(section => (
                            <div key={section.id} style={{ border: '1px solid #E5E7EB', borderRadius: 6, padding: '8px 10px', background: '#fff' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                <Input size="small" value={section.title} onChange={e => updateRichTableSection(section.id, { title: e.target.value })} style={{ flex: 1 }} prefix={<span style={{ color: '#9CA3AF', fontSize: 10 }}>标题</span>} />
                                <Button size="small" type="text" danger icon={<Trash2 size={12} />} onClick={() => removeRichTableSection(section.id)} />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {sortedFields.filter(f => f.visible && ['text', 'rich-text', 'number', 'single-image', 'image-group', 'card-ref', 'card-ref-multi'].includes(f.type)).map(f => {
                                  const checked = section.fieldKeys.includes(f.key)
                                  return (
                                    <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <Checkbox checked={checked} onChange={e => updateRichTableSection(section.id, { fieldKeys: e.target.checked ? [...section.fieldKeys, f.key] : section.fieldKeys.filter(k => k !== f.key) })} />
                                      <span style={{ fontSize: 12, color: '#374151' }}>{f.label}</span>
                                      <Tag color={fieldTypeColors[f.type as FieldType]} style={{ fontSize: 10, padding: '0 3px' }}>{fieldTypeLabels[f.type as FieldType] ?? f.type}</Tag>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>}
                  </div>
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA', padding: '12px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>③ 侧边栏字段</div>
                    <Input size="small" value={detail1Config.sideTitle} onChange={e => setDetail1Config(prev => ({ ...prev, sideTitle: e.target.value }))} placeholder="侧边栏标题" style={{ marginBottom: 8 }} prefix={<span style={{ color: '#9CA3AF', fontSize: 11 }}>标题</span>} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {sortedFields.filter(f => f.visible).map(f => {
                        const allowed = ['text', 'number', 'select', 'switch'].includes(f.type)
                        const checked = detail1Config.sideFieldKeys.includes(f.key)
                        const usedInMain = detail1Config.mainFieldKeys.includes(f.key)
                        return (
                          <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Checkbox checked={checked} disabled={!allowed || usedInMain} onChange={e => setDetail1Config(prev => ({ ...prev, sideFieldKeys: e.target.checked ? [...prev.sideFieldKeys, f.key] : prev.sideFieldKeys.filter(k => k !== f.key) }))} />
                            <span style={{ fontSize: 12, color: allowed && !usedInMain ? '#374151' : '#9CA3AF' }}>{f.label}</span>
                            <Tag color={fieldTypeColors[f.type as FieldType]} style={{ fontSize: 10, padding: '0 3px' }}>{fieldTypeLabels[f.type as FieldType] ?? f.type}</Tag>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 10 }}>前端预览 <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>仅供参考</Tag></div>
                  <div style={{ padding: 16, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, minHeight: 120 }}>
                    {detail1Config.mainFieldKeys.length === 0 && detail1Config.sideFieldKeys.length === 0 && detail1Config.richTableSections.length === 0
                      ? <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '24px 0' }}>请在左侧配置字段</div>
                      : <DetailStylePreview style="detail-1" fields={sortedFields} detail1Config={detail1Config} />}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA', padding: '12px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>主区域字段</div>
                    <div style={{ marginBottom: 8, padding: '4px 8px', background: '#F3F4F6', borderRadius: 4, fontSize: 12, color: '#6B7280' }}>
                      <span style={{ color: '#9CA3AF', fontSize: 11, marginRight: 6 }}>标题</span><span style={{ color: '#374151', fontWeight: 500 }}>名称</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {sortedFields.filter(f => f.visible).map(f => {
                        const allowed = ['single-image', 'text', 'rich-text', 'number', 'select'].includes(f.type)
                        const checked = detail2Config.mainFieldKeys.includes(f.key)
                        const usedInSide = detail2Config.sideFieldKeys.includes(f.key)
                        return (
                          <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Checkbox checked={checked} disabled={!allowed || usedInSide} onChange={e => setDetail2Config(prev => ({ ...prev, mainFieldKeys: e.target.checked ? [...prev.mainFieldKeys, f.key] : prev.mainFieldKeys.filter(k => k !== f.key) }))} />
                            <span style={{ fontSize: 12, color: allowed && !usedInSide ? '#374151' : '#9CA3AF' }}>{f.label}</span>
                            <Tag color={fieldTypeColors[f.type as FieldType]} style={{ fontSize: 10, padding: '0 3px' }}>{fieldTypeLabels[f.type as FieldType] ?? f.type}</Tag>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA', padding: '12px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>侧边栏字段</div>
                    <Input size="small" value={detail2Config.sideTitle} onChange={e => setDetail2Config(prev => ({ ...prev, sideTitle: e.target.value }))} placeholder="侧边栏标题" style={{ marginBottom: 8 }} prefix={<span style={{ color: '#9CA3AF', fontSize: 11 }}>标题</span>} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {sortedFields.filter(f => f.visible).map(f => {
                        const allowed = ['text', 'number', 'select', 'switch'].includes(f.type)
                        const checked = detail2Config.sideFieldKeys.includes(f.key)
                        const usedInMain = detail2Config.mainFieldKeys.includes(f.key)
                        return (
                          <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Checkbox checked={checked} disabled={!allowed || usedInMain} onChange={e => setDetail2Config(prev => ({ ...prev, sideFieldKeys: e.target.checked ? [...prev.sideFieldKeys, f.key] : prev.sideFieldKeys.filter(k => k !== f.key) }))} />
                            <span style={{ fontSize: 12, color: allowed && !usedInMain ? '#374151' : '#9CA3AF' }}>{f.label}</span>
                            <Tag color={fieldTypeColors[f.type as FieldType]} style={{ fontSize: 10, padding: '0 3px' }}>{fieldTypeLabels[f.type as FieldType] ?? f.type}</Tag>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 10 }}>前端预览 <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>仅供参考</Tag></div>
                  <div style={{ padding: 16, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, minHeight: 120 }}>
                    {detail2Config.mainFieldKeys.length === 0 && detail2Config.sideFieldKeys.length === 0
                      ? <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '24px 0' }}>请在左侧配置字段</div>
                      : <DetailStylePreview style="detail-2" fields={sortedFields} detail2Config={detail2Config} />}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 新增 / 编辑字段 */}
      <Modal
        title={editingField ? '编辑字段' : '新增字段'}
        open={fieldModalOpen}
        onCancel={() => setFieldModalOpen(false)}
        width={640}
        footer={(
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setFieldModalOpen(false)}>取消</Button>
            <Button type="primary" onClick={() => handleFieldSave()}>保存</Button>
          </div>
        )}
        destroyOnClose
      >
        <Form form={fieldForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="key" label="字段 Key" rules={[{ required: true, message: '请输入字段 Key' }, { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '只能包含字母、数字和下划线' }]}>
            <Input placeholder="如：attack_power" disabled={!!editingField} />
          </Form.Item>
          <Form.Item name="label" label="显示名称" rules={[{ required: true, message: '请输入显示名称' }]}>
            <Input placeholder="如：攻击力" />
          </Form.Item>
          <Form.Item name="type" label="字段类型" rules={[{ required: true }]}>
            <Select options={(Object.entries(fieldTypeLabels) as [FieldType, string][]).map(([value, label]) => ({ value, label: `${label}（${value}）` }))} />
          </Form.Item>

          {/* 单选选项编辑区（仅 type === 'select' 时展示） */}
          {watchedType === 'select' && (
            <Form.Item label="选项列表" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* 已添加选项 */}
                {selectOptions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 10px', background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: 6 }}>
                    {selectOptions.map(opt => (
                      <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, color: '#374151', flex: '1 1 auto', minWidth: 48 }}>{selectOptionLabel(opt)}</span>
                        <Tooltip title="侧滑抽屉配置多语言">
                          <Button
                            size="small"
                            type="text"
                            icon={<Languages size={12} />}
                            style={{ color: '#1677FF', padding: '0 4px', height: 20, flexShrink: 0 }}
                            onClick={() => setOptionDrawerId(opt.id)}
                          />
                        </Tooltip>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: '0 1 auto' }}>
                          {LANGUAGES.filter(l => opt.i18n?.[l.code]?.trim()).map(l => (
                            <Tooltip key={l.code} title={`${l.label}: ${opt.i18n[l.code]}`}>
                              <span style={{ fontSize: 11, color: '#6B7280', background: '#F3F4F6', padding: '1px 5px', borderRadius: 3, cursor: 'default', lineHeight: '18px' }}>{l.code}</span>
                            </Tooltip>
                          ))}
                        </div>
                        <Button
                          type="text" size="small" danger
                          icon={<Trash2 size={13} />}
                          style={{ padding: '0 4px', flexShrink: 0, marginLeft: 'auto' }}
                          onClick={() => setSelectOptions(prev => prev.filter(o => o.id !== opt.id))}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* 输入新选项：Input + Button 同行，避免 Search 的 enterButton 图标换行 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Input
                    value={optionInput}
                    onChange={e => setOptionInput(e.target.value)}
                    onPressEnter={addSelectOption}
                    placeholder="输入选项名称，按回车添加"
                    size="middle"
                    style={{ flex: 1, minWidth: 0 }}
                  />
                  <Button
                    type="primary"
                    size="middle"
                    icon={<Plus size={14} />}
                    onClick={addSelectOption}
                    style={{ borderRadius: 6, flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    添加
                  </Button>
                </div>
                {selectOptions.length === 0 && (
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>暂无选项，输入后按回车或点击「添加」</div>
                )}
              </div>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* 单选项多语言：侧滑抽屉 */}
      {(() => {
        const opt = optionDrawerId ? selectOptions.find(o => o.id === optionDrawerId) : null
        if (!opt) return null
        return (
          <Drawer
            title={`选项多语言 · ${selectOptionLabel(opt)}`}
            open
            onClose={() => setOptionDrawerId(null)}
            width={400}
            destroyOnClose
            styles={{ body: { paddingTop: 8 } }}
          >
            <FieldI18nEditor
              i18n={opt.i18n}
              fieldLabel={selectOptionLabel(opt)}
              onSave={(i) => { patchSelectOptionI18n(opt.id, i); setOptionDrawerId(null); messageApi.success('已保存') }}
              onCancel={() => setOptionDrawerId(null)}
            />
          </Drawer>
        )
      })()}

      {/* 多语言弹窗（字段） */}
      {i18nTarget && (
        <FieldI18nModal
          open={i18nModalOpen}
          fieldKey={i18nTarget.key}
          fieldLabel={i18nTarget.label}
          i18n={i18nTarget.i18n}
          onSave={handleI18nSave}
          onCancel={() => setI18nModalOpen(false)}
        />
      )}
    </div>
  )
}
