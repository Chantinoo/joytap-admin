'use client'

import React, { useState, useRef } from 'react'
import { Table, Button, Tag, Space, Input, Select, Switch, Modal, Form, Tooltip, Popconfirm, message, Checkbox } from 'antd'
import { Plus, Search, Edit2, Trash2, Eye, GripVertical, Languages } from 'lucide-react'
import PageBreadcrumb from '../../components/PageBreadcrumb'
import FieldI18nModal, { type I18nLabels, LANGUAGES } from '../components/FieldI18nModal'
import ListStylePreview, { LIST_STYLES, type ListStyle } from '../components/ListStylePreview'

const { Option } = Select

type FieldType = 'text' | 'number' | 'image' | 'tag' | 'boolean' | 'select' | 'range'

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
}

interface Monster {
  id: number; name: string; icon: string; level: number; hp: number
  atk: number; def: number; exp: number; jexp: number
  element: string; race: string; size: string; location: string; visible: boolean
  [key: string]: unknown
}

const initialFields: WikiField[] = [
  { key: 'icon',     label: '图标',     i18n: { zh: '图标',     en: 'Icon',        ko: '아이콘',    ja: 'アイコン',   es: 'Ícono',       pt: 'Ícone'        }, type: 'image',  visible: true,  listDisplay: true,  sortable: false, filterable: false, required: true,  order: 1 },
  { key: 'id',       label: 'ID',       i18n: { zh: 'ID',       en: 'ID',          ko: 'ID',        ja: 'ID',         es: 'ID',          pt: 'ID'           }, type: 'number', visible: true,  listDisplay: true,  sortable: true,  filterable: false, required: true,  order: 2 },
  { key: 'name',     label: '名称',     i18n: { zh: '名称',     en: 'Name',        ko: '이름',      ja: '名前',       es: 'Nombre',      pt: 'Nome'         }, type: 'text',   visible: true,  listDisplay: true,  sortable: false, filterable: true,  required: true,  order: 3 },
  { key: 'level',    label: '等级',     i18n: { zh: '等级',     en: 'Level',       ko: '레벨',      ja: 'レベル',     es: 'Nivel',       pt: 'Nível'        }, type: 'number', visible: true,  listDisplay: true,  sortable: true,  filterable: true,  required: true,  order: 4 },
  { key: 'hp',       label: 'HP',       i18n: { zh: 'HP',       en: 'HP',          ko: 'HP',        ja: 'HP',         es: 'HP',          pt: 'HP'           }, type: 'number', visible: true,  listDisplay: true,  sortable: true,  filterable: false, required: true,  order: 5 },
  { key: 'atk',      label: '攻击',     i18n: { zh: '攻击',     en: 'ATK',         ko: '공격',      ja: '攻撃',       es: 'ATQ',         pt: 'ATQ'          }, type: 'range',  visible: true,  listDisplay: true,  sortable: true,  filterable: false, required: false, order: 6 },
  { key: 'def',      label: '防御',     i18n: { zh: '防御',     en: 'DEF',         ko: '방어',      ja: '防御',       es: 'DEF',         pt: 'DEF'          }, type: 'number', visible: true,  listDisplay: false, sortable: true,  filterable: false, required: false, order: 7 },
  { key: 'exp',      label: '基础经验', i18n: { zh: '基础经验', en: 'Base EXP',    ko: '기본 경험치', ja: '基本経験値', es: 'EXP Base',    pt: 'EXP Base'     }, type: 'number', visible: true,  listDisplay: true,  sortable: true,  filterable: false, required: false, order: 8 },
  { key: 'jexp',     label: '职业经验', i18n: { zh: '职业经验', en: 'Job EXP',     ko: '직업 경험치', ja: 'ジョブ経験値', es: 'EXP Clase',  pt: 'EXP Classe'   }, type: 'number', visible: true,  listDisplay: false, sortable: true,  filterable: false, required: false, order: 9 },
  { key: 'element',  label: '属性',     i18n: { zh: '属性',     en: 'Element',     ko: '속성',      ja: '属性',       es: 'Elemento',    pt: 'Elemento'     }, type: 'select', visible: true,  listDisplay: true,  sortable: false, filterable: true,  required: true,  order: 10 },
  { key: 'race',     label: '种族',     i18n: { zh: '种族',     en: 'Race',        ko: '종족',      ja: '種族',       es: 'Raza',        pt: 'Raça'         }, type: 'select', visible: true,  listDisplay: true,  sortable: false, filterable: true,  required: true,  order: 11 },
  { key: 'size',     label: '体型',     i18n: { zh: '体型',     en: 'Size',        ko: '크기',      ja: 'サイズ',     es: 'Tamaño',      pt: 'Tamanho'      }, type: 'select', visible: true,  listDisplay: false, sortable: false, filterable: true,  required: false, order: 12 },
  { key: 'location', label: '出没地点', i18n: { zh: '出没地点', en: 'Location',    ko: '출몰 지역', ja: '出没場所',   es: 'Ubicación',   pt: 'Localização'  }, type: 'tag',    visible: true,  listDisplay: true,  sortable: false, filterable: true,  required: false, order: 13 },
]

const mockMonsters: Monster[] = [
  { id: 1002, name: '波利',     icon: '🐾', level: 1,  hp: 50,    atk: 7,   def: 0,  exp: 2,    jexp: 1,    element: '无属性', race: '植物', size: '小型', location: '新手村',       visible: true },
  { id: 1031, name: '蜂王',     icon: '🐝', level: 5,  hp: 195,   atk: 22,  def: 0,  exp: 72,   jexp: 46,   element: '风属性', race: '昆虫', size: '小型', location: '普隆德拉',     visible: true },
  { id: 1113, name: '骷髅',     icon: '💀', level: 15, hp: 490,   atk: 55,  def: 5,  exp: 198,  jexp: 126,  element: '暗属性', race: '不死', size: '中型', location: '普隆德拉墓地', visible: true },
  { id: 1115, name: '骷髅战士', icon: '💀', level: 21, hp: 1200,  atk: 95,  def: 15, exp: 450,  jexp: 288,  element: '暗属性', race: '不死', size: '中型', location: '普隆德拉墓地', visible: true },
  { id: 1038, name: '蜥蜴战士', icon: '🦎', level: 30, hp: 2200,  atk: 130, def: 20, exp: 900,  jexp: 576,  element: '火属性', race: '蜥蜴', size: '中型', location: '沙漠',         visible: true },
  { id: 1150, name: '奥克',     icon: '👹', level: 40, hp: 3800,  atk: 200, def: 30, exp: 1800, jexp: 1152, element: '无属性', race: '兽人', size: '大型', location: '奥克村',       visible: true },
  { id: 1096, name: '蜘蛛',     icon: '🕷️', level: 18, hp: 720,   atk: 75,  def: 5,  exp: 320,  jexp: 204,  element: '毒属性', race: '昆虫', size: '小型', location: '蜘蛛巢穴',     visible: true },
  { id: 1190, name: '冰霜精灵', icon: '❄️', level: 55, hp: 7200,  atk: 320, def: 45, exp: 4200, jexp: 2688, element: '水属性', race: '精灵', size: '中型', location: '冰雪地带',     visible: false },
  { id: 1272, name: '暗影骑士', icon: '🗡️', level: 70, hp: 15000, atk: 580, def: 80, exp: 9800, jexp: 6272, element: '暗属性', race: '恶魔', size: '大型', location: '暗影城堡',     visible: true },
  { id: 1046, name: '史莱姆',   icon: '🟢', level: 3,  hp: 120,   atk: 12,  def: 0,  exp: 18,   jexp: 11,   element: '水属性', race: '变形', size: '小型', location: '普隆德拉周边', visible: true },
]

const fieldTypeColors: Record<string, string> = {
  text: 'blue', number: 'green', image: 'purple', tag: 'orange', boolean: 'cyan', select: 'magenta', range: 'volcano',
}

const elementColors: Record<string, string> = {
  '无属性': 'default', '火属性': 'red', '水属性': 'blue', '风属性': 'cyan',
  '地属性': 'brown', '毒属性': 'purple', '暗属性': 'volcano', '圣属性': 'gold',
}

export default function WikiMonstersPage() {
  const [fields, setFields] = useState<WikiField[]>(initialFields)
  const [activeTab, setActiveTab] = useState<'data' | 'fields'>('data')
  const [searchText, setSearchText] = useState('')
  const [elementFilter, setElementFilter] = useState<string>('all')
  const [raceFilter, setRaceFilter] = useState<string>('all')

  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<WikiField | null>(null)
  const [form] = Form.useForm()

  const [i18nModalOpen, setI18nModalOpen] = useState(false)
  const [i18nTarget, setI18nTarget] = useState<WikiField | null>(null)

  const [selectedStyle, setSelectedStyle] = useState<ListStyle>('card-list')
  const [listFieldKeys, setListFieldKeys] = useState<string[]>(
    initialFields.filter(f => f.listDisplay).map(f => f.key)
  )

  const dragIndex = useRef<number | null>(null)
  const dragOverIndex = useRef<number | null>(null)
  const [messageApi, contextHolder] = message.useMessage()

  const sortedFields = [...fields].sort((a, b) => a.order - b.order)
  const filteredMonsters = mockMonsters.filter(m => {
    const matchSearch = m.name.includes(searchText) || String(m.id).includes(searchText)
    const matchElement = elementFilter === 'all' || m.element === elementFilter
    const matchRace = raceFilter === 'all' || m.race === raceFilter
    return matchSearch && matchElement && matchRace
  })
  const visibleFields = sortedFields.filter(f => f.visible)

  const currentStyleConfig = LIST_STYLES.find(s => s.id === selectedStyle)!
  const allowedFieldKeys = sortedFields
    .filter(f => f.visible && currentStyleConfig.allowedTypes.includes(f.type))
    .map(f => f.key)
  const validListFieldKeys = listFieldKeys.filter(k => allowedFieldKeys.includes(k))

  // ── 字段操作 ──────────────────────────────────────────────
  const openAddModal = () => {
    setEditingField(null)
    form.resetFields()
    form.setFieldsValue({ visible: true, listDisplay: true, sortable: false, filterable: false, required: false, type: 'text' })
    setFieldModalOpen(true)
  }

  const openEditModal = (record: WikiField) => {
    setEditingField(record)
    form.setFieldsValue(record)
    setFieldModalOpen(true)
  }

  const handleFieldSave = () => {
    form.validateFields().then(values => {
      if (editingField) {
        setFields(prev => prev.map(f => f.key === editingField.key ? { ...f, ...values } : f))
        messageApi.success('字段已更新')
      } else {
        if (fields.some(f => f.key === values.key)) { messageApi.error('字段 Key 已存在'); return }
        const maxOrder = Math.max(...fields.map(f => f.order), 0)
        setFields(prev => [...prev, { ...values, i18n: { zh: values.label }, order: maxOrder + 1 }])
        messageApi.success('字段已新增')
      }
      setFieldModalOpen(false)
    })
  }

  const handleDeleteField = (key: string) => {
    setFields(prev => prev.filter(f => f.key !== key))
    setListFieldKeys(prev => prev.filter(k => k !== key))
    messageApi.success('字段已删除')
  }

  const openI18nModal = (record: WikiField) => {
    setI18nTarget(record)
    setI18nModalOpen(true)
  }

  const handleI18nSave = (i18n: I18nLabels) => {
    if (!i18nTarget) return
    setFields(prev => prev.map(f => f.key === i18nTarget.key ? { ...f, i18n, label: i18n.zh || f.label } : f))
    setI18nModalOpen(false)
    messageApi.success('多语言配置已保存')
  }

  // ── 拖拽排序 ──────────────────────────────────────────────
  const handleDragStart = (index: number) => { dragIndex.current = index }
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); dragOverIndex.current = index }
  const handleDrop = () => {
    if (dragIndex.current === null || dragOverIndex.current === null || dragIndex.current === dragOverIndex.current) return
    const reordered = [...sortedFields]
    const [moved] = reordered.splice(dragIndex.current, 1)
    reordered.splice(dragOverIndex.current, 0, moved)
    setFields(reordered.map((f, i) => ({ ...f, order: i + 1 })))
    dragIndex.current = null; dragOverIndex.current = null
  }

  // ── 数据表格列 ────────────────────────────────────────────
  const dataColumns = [
    ...visibleFields.map(field => ({
      title: field.label,
      dataIndex: field.key,
      key: field.key,
      sorter: field.sortable ? true : undefined,
      render: (val: unknown) => {
        if (field.type === 'image') return <span style={{ fontSize: 20 }}>{val as string}</span>
        if (field.key === 'element') return <Tag color={elementColors[val as string] ?? 'default'}>{val as string}</Tag>
        if (field.type === 'tag') return <Tag>{val as string}</Tag>
        if (field.type === 'select') return <Tag>{val as string}</Tag>
        return <span style={{ fontSize: 13 }}>{String(val ?? '—')}</span>
      },
    })),
    { title: '前台显示', dataIndex: 'visible', key: 'visible', render: (val: boolean) => <Tag color={val ? 'green' : 'default'}>{val ? '显示' : '隐藏'}</Tag> },
    { title: '操作', key: 'action', render: () => (
      <Space size={4}>
        <Tooltip title="查看"><Button size="small" type="text" icon={<Eye size={13} />} /></Tooltip>
        <Tooltip title="编辑"><Button size="small" type="text" icon={<Edit2 size={13} />} /></Tooltip>
        <Tooltip title="删除"><Button size="small" type="text" danger icon={<Trash2 size={13} />} /></Tooltip>
      </Space>
    )},
  ]

  // ── 字段配置表格列 ────────────────────────────────────────
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
            <Button size="small" type="text" icon={<Languages size={12} />} style={{ color: '#1677FF', padding: '0 4px', height: 20 }}
              onClick={() => openI18nModal(record)} />
          </Tooltip>
          <div style={{ display: 'flex', gap: 2 }}>
            {LANGUAGES.filter(l => record.i18n?.[l.code]).map(l => (
              <Tooltip key={l.code} title={`${l.label}: ${record.i18n?.[l.code]}`}>
                <span style={{ fontSize: 12, cursor: 'default' }}>{l.flag}</span>
              </Tooltip>
            ))}
          </div>
        </div>
      ),
    },
    { title: '类型', dataIndex: 'type', key: 'type', render: (v: string) => <Tag color={fieldTypeColors[v]}>{v}</Tag> },
    {
      title: '操作', key: 'action',
      render: (_: unknown, record: WikiField) => (
        <Space size={4}>
          <Button size="small" type="text" icon={<Edit2 size={13} />} onClick={() => openEditModal(record)}>编辑</Button>
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
      <PageBreadcrumb items={[{ label: 'Wiki 管理', href: '/wiki' }, { label: '怪物管理' }]} />

      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        {/* 页头 */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>怪物管理</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>管理前台 Wiki 怪物页面的数据与字段配置</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button style={{ borderRadius: 6 }} onClick={() => setActiveTab(activeTab === 'data' ? 'fields' : 'data')}>
              {activeTab === 'data' ? '⚙️ 字段配置' : '📋 数据列表'}
            </Button>
            {activeTab === 'data'
              ? <Button type="primary" icon={<Plus size={14} />} style={{ borderRadius: 6 }}>新增怪物</Button>
              : <Button type="primary" icon={<Plus size={14} />} style={{ borderRadius: 6 }} onClick={openAddModal}>新增字段</Button>
            }
          </div>
        </div>

        {/* ── 数据列表 ── */}
        {activeTab === 'data' && (
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <Input placeholder="搜索怪物名称或 ID" prefix={<Search size={14} style={{ color: '#9CA3AF' }} />}
                value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 220, borderRadius: 6 }} />
              <Select value={elementFilter} onChange={setElementFilter} style={{ width: 120 }}>
                <Option value="all">全部属性</Option>
                {['无属性','火属性','水属性','风属性','地属性','毒属性','暗属性','圣属性'].map(v => <Option key={v} value={v}>{v}</Option>)}
              </Select>
              <Select value={raceFilter} onChange={setRaceFilter} style={{ width: 120 }}>
                <Option value="all">全部种族</Option>
                {['植物','昆虫','不死','蜥蜴','兽人','精灵','恶魔','变形'].map(v => <Option key={v} value={v}>{v}</Option>)}
              </Select>
              <div style={{ marginLeft: 'auto', fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center' }}>共 {filteredMonsters.length} 条</div>
            </div>
            <Table dataSource={filteredMonsters} columns={dataColumns} rowKey="id" size="small"
              pagination={{ pageSize: 10, showSizeChanger: false }} scroll={{ x: 'max-content' }} />
          </div>
        )}

        {/* ── 字段配置 ── */}
        {activeTab === 'fields' && (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* 模块一：字段列表 */}
            <div>
              <div style={{ marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>字段配置</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  配置前台页面展示的字段及其属性。点击名称旁的
                  <Languages size={13} style={{ color: '#1677FF', flexShrink: 0, verticalAlign: 'middle' }} />
                  图标可配置多语言，支持 AI 一键翻译。
                </p>
              </div>
              <Table dataSource={sortedFields} columns={fieldColumns} rowKey="key" size="small" pagination={false} />
            </div>

            <div style={{ borderTop: '1px solid #E5E7EB' }} />

            {/* 模块二：列表样式 */}
            <div>
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>列表样式</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
                  选择前台列表页的展示样式，不同样式支持的字段数量和类型不同。
                </p>
              </div>

              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {/* 左侧：样式选择 + 字段勾选 */}
                <div style={{ width: 320, flexShrink: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {LIST_STYLES.map(s => (
                      <div key={s.id} onClick={() => {
                        setSelectedStyle(s.id)
                        const valid = listFieldKeys.filter(k => {
                          const f = fields.find(ff => ff.key === k)
                          return f && s.allowedTypes.includes(f.type)
                        }).slice(0, s.maxFields)
                        setListFieldKeys(valid)
                      }} style={{
                        padding: '10px 14px',
                        border: `2px solid ${selectedStyle === s.id ? '#1677FF' : '#E5E7EB'}`,
                        borderRadius: 8, cursor: 'pointer',
                        background: selectedStyle === s.id ? '#EFF6FF' : '#fff',
                        transition: 'all 0.15s',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{s.icon}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{s.label}</div>
                            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{s.description}</div>
                          </div>
                          {selectedStyle === s.id && <Tag color="blue" style={{ marginLeft: 'auto', fontSize: 11 }}>已选</Tag>}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 12, color: '#9CA3AF' }}>
                          {s.requireImage
                            ? `图片必选 + 最多 ${s.maxTextFields ?? (s.maxFields - 1)} 个文本/数字`
                            : `最多 ${s.maxFields} 个字段`}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 字段勾选 */}
                  <div style={{ padding: '12px 14px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                      选择展示字段
                      <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 6 }}>
                        ({validListFieldKeys.length}/{currentStyleConfig.maxFields})
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {sortedFields.filter(f => f.visible).map(f => {
                        const allowed = currentStyleConfig.allowedTypes.includes(f.type)
                        const checked = validListFieldKeys.includes(f.key)
                        const isImage = f.type === 'image'
                        const checkedImageKeys = validListFieldKeys.filter(k => {
                          const ff = sortedFields.find(x => x.key === k)
                          return ff?.type === 'image'
                        })
                        const checkedTextKeys = validListFieldKeys.filter(k => {
                          const ff = sortedFields.find(x => x.key === k)
                          return ff && ff.type !== 'image'
                        })
                        let disabled = !allowed
                        if (!disabled && !checked) {
                          if (currentStyleConfig.requireImage) {
                            if (isImage && checkedImageKeys.length >= 1) disabled = true
                            if (!isImage && checkedTextKeys.length >= (currentStyleConfig.maxTextFields ?? (currentStyleConfig.maxFields - 1))) disabled = true
                          } else {
                            if (validListFieldKeys.length >= currentStyleConfig.maxFields) disabled = true
                          }
                        }
                        return (
                          <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Checkbox
                              checked={checked}
                              disabled={disabled}
                              onChange={e => {
                                if (e.target.checked) {
                                  setListFieldKeys(prev => [...prev, f.key])
                                } else {
                                  setListFieldKeys(prev => prev.filter(k => k !== f.key))
                                }
                              }}
                            />
                            <span style={{ fontSize: 13, color: allowed ? '#374151' : '#9CA3AF' }}>{f.label}</span>
                            <Tag color={fieldTypeColors[f.type]} style={{ fontSize: 11, padding: '0 4px' }}>{f.type}</Tag>
                            {!allowed && <span style={{ fontSize: 11, color: '#9CA3AF' }}>不支持此样式</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* 右侧：前端预览 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 10 }}>
                    前端预览
                    <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>仅供参考</Tag>
                  </div>
                  <div style={{ padding: 16, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8 }}>
                    {validListFieldKeys.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '24px 0' }}>
                        请在左侧勾选至少一个字段
                      </div>
                    ) : (
                      <ListStylePreview
                        style={selectedStyle}
                        fields={sortedFields}
                        selectedFieldKeys={validListFieldKeys}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 新增 / 编辑字段弹窗 */}
      <Modal
        title={editingField ? '编辑字段' : '新增字段'}
        open={fieldModalOpen}
        onOk={handleFieldSave}
        onCancel={() => setFieldModalOpen(false)}
        okText="保存"
        cancelText="取消"
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="key" label="字段 Key"
            rules={[
              { required: true, message: '请输入字段 Key' },
              { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '只能包含字母、数字和下划线' },
            ]}
          >
            <Input placeholder="如：drop_rate" disabled={!!editingField} />
          </Form.Item>
          <Form.Item name="label" label="显示名称（中文）" rules={[{ required: true, message: '请输入显示名称' }]}>
            <Input placeholder="如：掉落率" />
          </Form.Item>
          <Form.Item name="type" label="字段类型" rules={[{ required: true }]}>
            <Select>
              <Option value="text">text — 文本</Option>
              <Option value="number">number — 数字</Option>
              <Option value="image">image — 图片/图标</Option>
              <Option value="tag">tag — 标签</Option>
              <Option value="rich-table">rich-table — 富媒体表</Option>
            </Select>
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <Form.Item name="visible" label="前台显示" valuePropName="checked"><Switch /></Form.Item>
            <Form.Item name="listDisplay" label="列表展示" valuePropName="checked"><Switch /></Form.Item>
            <Form.Item name="sortable" label="可排序" valuePropName="checked"><Switch /></Form.Item>
            <Form.Item name="filterable" label="可筛选" valuePropName="checked"><Switch /></Form.Item>
            <Form.Item name="required" label="必填" valuePropName="checked">
              <Switch disabled={!!editingField && editingField.required} />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* 多语言配置弹窗 */}
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
