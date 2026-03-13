'use client'

import React, { useState, useRef } from 'react'
import {
  Table, Button, Tag, Space, Input, Select, Modal, Form, Switch,
  Tooltip, Popconfirm, message, Checkbox, Tabs,
} from 'antd'
import { Plus, Edit2, Trash2, ExternalLink, GripVertical, Search, Languages } from 'lucide-react'
import { useRouter } from 'next/navigation'
import PageBreadcrumb from '../components/PageBreadcrumb'
import GameFilter from '../components/GameFilter'
import FieldI18nModal, { type I18nLabels, LANGUAGES } from './components/FieldI18nModal'
import ListStylePreview, { LIST_STYLES, type ListStyle } from './components/ListStylePreview'
import DetailStylePreview, { DETAIL_STYLES, type DetailStyle, type Detail1Config, type Detail2Config, type RichTableSection } from './components/DetailStylePreview'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface WikiNav {
  key: string
  label: string
  description: string
  enabled: boolean
  fieldCount: number
  order: number
}

type FieldType = 'text' | 'number' | 'image' | 'tag' | 'rich-table'

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

const fieldTypeColors: Record<FieldType, string> = {
  text: 'blue', number: 'green', image: 'purple', tag: 'orange', 'rich-table': 'geekblue',
}

// ─────────────────────────────────────────────
// Nav data
// ─────────────────────────────────────────────
const initialNavs: WikiNav[] = [
  { key: 'items',    label: '道具',     description: '武器、防具、消耗品、材料等游戏道具',   enabled: true,  fieldCount: 11, order: 1 },
  { key: 'monsters', label: '怪物',     description: '普通怪物、MVP、Mini Boss 等',         enabled: true,  fieldCount: 13, order: 2 },
  { key: 'cards',    label: '卡片',     description: '怪物掉落卡片及其效果',               enabled: true,  fieldCount: 8,  order: 3 },
  { key: 'pets',     label: '宠物',     description: '可捕获的宠物及其属性、亲密度等',     enabled: true,  fieldCount: 9,  order: 4 },
  { key: 'boxes',    label: '箱子',     description: '宝箱、礼包等可开启的容器类道具',     enabled: true,  fieldCount: 6,  order: 5 },
  { key: 'arrows',   label: '箭矢制作', description: '弓箭手系列箭矢的制作配方',           enabled: true,  fieldCount: 7,  order: 6 },
  { key: 'sets',     label: '套装',     description: '装备套装组合及套装效果',             enabled: true,  fieldCount: 8,  order: 7 },
  { key: 'skills',   label: '技能模拟', description: '各职业技能树与技能效果模拟',         enabled: false, fieldCount: 12, order: 8 },
  { key: 'npcs',     label: 'NPC',      description: '游戏内 NPC 位置、功能与对话',        enabled: true,  fieldCount: 7,  order: 9 },
  { key: 'maps',     label: '地图',     description: '游戏地图信息、怪物分布与传送点',     enabled: true,  fieldCount: 10, order: 10 },
]

// ─────────────────────────────────────────────
// Field data per nav key
// ─────────────────────────────────────────────
const FIELDS_BY_NAV: Record<string, WikiField[]> = {
  items: [
    { key: 'icon',        label: '图标',     i18n: { zh: '图标',     en: 'Icon'        }, type: 'image',  visible: true,  listDisplay: true,  sortable: false, filterable: false, required: true,  order: 1 },
    { key: 'id',          label: 'ID',       i18n: { zh: 'ID',       en: 'ID'          }, type: 'number', visible: true,  listDisplay: true,  sortable: true,  filterable: false, required: true,  order: 2 },
    { key: 'name',        label: '名称',     i18n: { zh: '名称',     en: 'Name'        }, type: 'text',   visible: true,  listDisplay: true,  sortable: false, filterable: true,  required: true,  order: 3 },
    { key: 'type',        label: '类型',     i18n: { zh: '类型',     en: 'Type'        }, type: 'tag',    visible: true,  listDisplay: true,  sortable: false, filterable: true,  required: true,  order: 4 },
    { key: 'atk',         label: '攻击力',   i18n: { zh: '攻击力',   en: 'ATK'         }, type: 'number', visible: true,  listDisplay: false, sortable: true,  filterable: false, required: false, order: 5 },
    { key: 'def',         label: '防御力',   i18n: { zh: '防御力',   en: 'DEF'         }, type: 'number', visible: true,  listDisplay: false, sortable: true,  filterable: false, required: false, order: 6 },
    { key: 'job',         label: '职业限制', i18n: { zh: '职业限制', en: 'Job Limit'   }, type: 'tag',    visible: true,  listDisplay: false, sortable: false, filterable: true,  required: false, order: 7 },
    { key: 'description', label: '描述',     i18n: { zh: '描述',     en: 'Description' }, type: 'text',       visible: false, listDisplay: false, sortable: false, filterable: false, required: false, order: 8 },
    { key: 'set_parts',   label: '套装组成', i18n: { zh: '套装组成', en: 'Set Parts'    }, type: 'rich-table', visible: true,  listDisplay: true,  sortable: false, filterable: false, required: false, order: 9 },
  ],
  monsters: [
    { key: 'icon',     label: '图标',   i18n: { zh: '图标',   en: 'Icon'    }, type: 'image',  visible: true,  listDisplay: true,  sortable: false, filterable: false, required: true,  order: 1 },
    { key: 'id',       label: 'ID',     i18n: { zh: 'ID',     en: 'ID'      }, type: 'number', visible: true,  listDisplay: true,  sortable: true,  filterable: false, required: true,  order: 2 },
    { key: 'name',     label: '名称',   i18n: { zh: '名称',   en: 'Name'    }, type: 'text',   visible: true,  listDisplay: true,  sortable: false, filterable: true,  required: true,  order: 3 },
    { key: 'level',    label: '等级',   i18n: { zh: '等级',   en: 'Level'   }, type: 'number', visible: true,  listDisplay: true,  sortable: true,  filterable: false, required: true,  order: 4 },
    { key: 'hp',       label: 'HP',     i18n: { zh: 'HP',     en: 'HP'      }, type: 'number', visible: true,  listDisplay: true,  sortable: true,  filterable: false, required: false, order: 5 },
    { key: 'atk',      label: '攻击',   i18n: { zh: '攻击',   en: 'ATK'     }, type: 'number', visible: true,  listDisplay: false, sortable: false, filterable: false, required: false, order: 6 },
    { key: 'def',      label: '防御',   i18n: { zh: '防御',   en: 'DEF'     }, type: 'number', visible: true,  listDisplay: false, sortable: true,  filterable: false, required: false, order: 7 },
    { key: 'exp',      label: '基础经验', i18n: { zh: '基础经验', en: 'Base EXP' }, type: 'number', visible: true, listDisplay: true, sortable: true, filterable: false, required: false, order: 8 },
    { key: 'jexp',     label: '职业经验', i18n: { zh: '职业经验', en: 'Job EXP'  }, type: 'number', visible: true, listDisplay: true, sortable: true, filterable: false, required: false, order: 9 },
    { key: 'element',  label: '属性',   i18n: { zh: '属性',   en: 'Element' }, type: 'tag',    visible: true,  listDisplay: true,  sortable: false, filterable: true,  required: false, order: 10 },
    { key: 'race',     label: '种族',   i18n: { zh: '种族',   en: 'Race'    }, type: 'tag',    visible: true,  listDisplay: true,  sortable: false, filterable: true,  required: false, order: 11 },
    { key: 'size',     label: '体型',   i18n: { zh: '体型',   en: 'Size'    }, type: 'tag',    visible: true,  listDisplay: false, sortable: false, filterable: true,  required: false, order: 12 },
    { key: 'location', label: '出没地点', i18n: { zh: '出没地点', en: 'Location' }, type: 'text', visible: true, listDisplay: false, sortable: false, filterable: false, required: false, order: 13 },
  ],
}

// Default empty fields for navs without specific config
const DEFAULT_FIELDS: WikiField[] = []

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export default function WikiManagePage() {
  const router = useRouter()
  const [messageApi, contextHolder] = message.useMessage()

  // ── Tab ──────────────────────────────────────
  const [mainTab, setMainTab] = useState<'nav' | 'list'>('nav')

  // ── 导航管理 state ────────────────────────────
  const [navs, setNavs] = useState<WikiNav[]>(initialNavs)
  const [navModalOpen, setNavModalOpen] = useState(false)
  const [editingNav, setEditingNav] = useState<WikiNav | null>(null)
  const [navForm] = Form.useForm()

  const navDragIndex = useRef<number | null>(null)
  const navDragOverIndex = useRef<number | null>(null)

  const sortedNavs = [...navs].sort((a, b) => a.order - b.order)

  const openAddNavModal = () => {
    setEditingNav(null)
    navForm.resetFields()
    navForm.setFieldsValue({ enabled: true })
    setNavModalOpen(true)
  }

  const openEditNavModal = (record: WikiNav) => {
    setEditingNav(record)
    navForm.setFieldsValue(record)
    setNavModalOpen(true)
  }

  const handleNavSave = () => {
    navForm.validateFields().then(values => {
      if (editingNav) {
        setNavs(prev => prev.map(n => n.key === editingNav.key ? { ...n, ...values } : n))
        messageApi.success('导航已更新')
      } else {
        const keyExists = navs.some(n => n.key === values.key)
        if (keyExists) { messageApi.error('导航 Key 已存在'); return }
        const maxOrder = Math.max(...navs.map(n => n.order), 0)
        setNavs(prev => [...prev, { ...values, order: maxOrder + 1, fieldCount: 0 }])
        messageApi.success('导航已新增')
      }
      setNavModalOpen(false)
    })
  }

  const handleNavDelete = (key: string) => {
    setNavs(prev => prev.filter(n => n.key !== key))
    messageApi.success('导航已删除')
  }

  const handleNavToggleEnabled = (key: string, enabled: boolean) => {
    setNavs(prev => prev.map(n => n.key === key ? { ...n, enabled } : n))
  }

  const handleNavDragStart = (index: number) => { navDragIndex.current = index }
  const handleNavDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); navDragOverIndex.current = index }
  const handleNavDrop = () => {
    if (navDragIndex.current === null || navDragOverIndex.current === null) return
    if (navDragIndex.current === navDragOverIndex.current) return
    const reordered = [...sortedNavs]
    const [moved] = reordered.splice(navDragIndex.current, 1)
    reordered.splice(navDragOverIndex.current, 0, moved)
    setNavs(reordered.map((n, i) => ({ ...n, order: i + 1 })))
    navDragIndex.current = null
    navDragOverIndex.current = null
  }

  // ── 列表管理 state ────────────────────────────
  const [selectedNavKey, setSelectedNavKey] = useState<string>('items')
  const [fieldsMap, setFieldsMap] = useState<Record<string, WikiField[]>>(FIELDS_BY_NAV)

  const currentFields = fieldsMap[selectedNavKey] ?? DEFAULT_FIELDS
  const setCurrentFields = (updater: (prev: WikiField[]) => WikiField[]) => {
    setFieldsMap(prev => ({ ...prev, [selectedNavKey]: updater(prev[selectedNavKey] ?? DEFAULT_FIELDS) }))
  }

  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<WikiField | null>(null)
  const [fieldForm] = Form.useForm()

  const [i18nModalOpen, setI18nModalOpen] = useState(false)
  const [i18nTarget, setI18nTarget] = useState<WikiField | null>(null)

  const [selectedStyle, setSelectedStyle] = useState<ListStyle>('card-list')
  const [listFieldKeys, setListFieldKeys] = useState<string[]>([])

  const [selectedDetailStyle, setSelectedDetailStyle] = useState<DetailStyle>('detail-1')
  const [detail1Config, setDetail1Config] = useState<Detail1Config>({
    mainTitle: '基本信息',
    mainFieldKeys: [],
    richTableSections: [],
    sideTitle: '道具信息',
    sideFieldKeys: [],
  })
  const [detail2Config, setDetail2Config] = useState<Detail2Config>({
    mainFieldKeys: [],
    sideTitle: '道具信息',
    sideFieldKeys: [],
  })

  const addRichTableSection = () => {
    const id = `section_${Date.now()}`
    setDetail1Config(prev => ({
      ...prev,
      richTableSections: [...prev.richTableSections, { id, title: '新区域', fieldKeys: [] }],
    }))
  }

  const removeRichTableSection = (id: string) => {
    setDetail1Config(prev => ({
      ...prev,
      richTableSections: prev.richTableSections.filter(s => s.id !== id),
    }))
  }

  const updateRichTableSection = (id: string, updates: Partial<RichTableSection>) => {
    setDetail1Config(prev => ({
      ...prev,
      richTableSections: prev.richTableSections.map(s => s.id === id ? { ...s, ...updates } : s),
    }))
  }

  const fieldDragIndex = useRef<number | null>(null)
  const fieldDragOverIndex = useRef<number | null>(null)

  const sortedFields = [...currentFields].sort((a, b) => a.order - b.order)
  const currentStyleConfig = LIST_STYLES.find(s => s.id === selectedStyle)!
  const allowedFieldKeys = sortedFields
    .filter(f => f.visible && currentStyleConfig.allowedTypes.includes(f.type))
    .map(f => f.key)
  const validListFieldKeys = listFieldKeys.filter(k => allowedFieldKeys.includes(k))

  const openAddFieldModal = () => {
    setEditingField(null)
    fieldForm.resetFields()
    fieldForm.setFieldsValue({ visible: true, listDisplay: true, sortable: false, filterable: false, required: false, type: 'text' })
    setFieldModalOpen(true)
  }

  const openEditFieldModal = (record: WikiField) => {
    setEditingField(record)
    fieldForm.setFieldsValue(record)
    setFieldModalOpen(true)
  }

  const handleFieldSave = () => {
    fieldForm.validateFields().then(values => {
      if (editingField) {
        setCurrentFields(prev => prev.map(f => f.key === editingField.key ? { ...f, ...values } : f))
        messageApi.success('字段已更新')
      } else {
        if (currentFields.some(f => f.key === values.key)) { messageApi.error('字段 Key 已存在'); return }
        const maxOrder = Math.max(...currentFields.map(f => f.order), 0)
        setCurrentFields(prev => [...prev, { ...values, i18n: { zh: values.label }, order: maxOrder + 1 }])
        messageApi.success('字段已新增')
      }
      setFieldModalOpen(false)
    })
  }

  const handleDeleteField = (key: string) => {
    setCurrentFields(prev => prev.filter(f => f.key !== key))
    setListFieldKeys(prev => prev.filter(k => k !== key))
    messageApi.success('字段已删除')
  }

  const openI18nModal = (record: WikiField) => {
    setI18nTarget(record)
    setI18nModalOpen(true)
  }

  const handleI18nSave = (i18n: I18nLabels) => {
    if (!i18nTarget) return
    setCurrentFields(prev => prev.map(f => f.key === i18nTarget.key ? { ...f, i18n, label: i18n.zh || f.label } : f))
    setI18nModalOpen(false)
    messageApi.success('多语言配置已保存')
  }

  const handleFieldDragStart = (index: number) => { fieldDragIndex.current = index }
  const handleFieldDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); fieldDragOverIndex.current = index }
  const handleFieldDrop = () => {
    if (fieldDragIndex.current === null || fieldDragOverIndex.current === null || fieldDragIndex.current === fieldDragOverIndex.current) return
    const reordered = [...sortedFields]
    const [moved] = reordered.splice(fieldDragIndex.current, 1)
    reordered.splice(fieldDragOverIndex.current, 0, moved)
    setCurrentFields(() => reordered.map((f, i) => ({ ...f, order: i + 1 })))
    fieldDragIndex.current = null; fieldDragOverIndex.current = null
  }

  // ── 导航管理表格列 ─────────────────────────────
  const navColumns = [
    {
      title: '', key: 'drag', width: 36,
      render: (_: unknown, __: WikiNav, index: number) => (
        <div draggable onDragStart={() => handleNavDragStart(index)} onDragOver={e => handleNavDragOver(e, index)} onDrop={handleNavDrop}
          style={{ cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GripVertical size={14} style={{ color: '#9CA3AF' }} />
        </div>
      ),
    },
    {
      title: '导航名称', dataIndex: 'label', key: 'label', width: 160,
      render: (v: string, record: WikiNav) => (
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{v}</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>key: {record.key}</div>
        </div>
      ),
    },
    {
      title: '说明', dataIndex: 'description', key: 'description', width: 360,
      render: (v: string) => <span style={{ fontSize: 13, color: '#6B7280' }}>{v}</span>,
    },
    {
      title: '字段数', dataIndex: 'fieldCount', key: 'fieldCount', width: 72, align: 'center' as const,
      render: (v: number) => <Tag color="blue">{v} 个</Tag>,
    },
    {
      title: '前台启用', dataIndex: 'enabled', key: 'enabled', width: 80, align: 'center' as const,
      render: (val: boolean, record: WikiNav) => (
        <Switch size="small" checked={val} onChange={checked => handleNavToggleEnabled(record.key, checked)} />
      ),
    },
    {
      title: '操作', key: 'action', width: 180,
      render: (_: unknown, record: WikiNav) => (
        <Space size={4}>
          <Tooltip title="进入管理">
            <Button size="small" type="link" icon={<ExternalLink size={13} />} onClick={() => router.push(`/wiki/${record.key}`)}>
              管理
            </Button>
          </Tooltip>
          <Button size="small" type="text" icon={<Edit2 size={13} />} onClick={() => openEditNavModal(record)}>编辑</Button>
          <Popconfirm title="确认删除该导航？" description="删除后前台将不再展示此导航页面。"
            onConfirm={() => handleNavDelete(record.key)} okText="删除" cancelText="取消" okButtonProps={{ danger: true }}>
            <Button size="small" type="text" danger icon={<Trash2 size={13} />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // ── 字段配置表格列 ─────────────────────────────
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
    { title: '类型', dataIndex: 'type', key: 'type', render: (v: FieldType) => <Tag color={fieldTypeColors[v]}>{v}</Tag> },
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

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {contextHolder}
      <PageBreadcrumb items={[{ label: 'Wiki 管理' }]} />

      <GameFilter />

      {/* 主 Tab */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <Tabs
          activeKey={mainTab}
          onChange={k => setMainTab(k as 'nav' | 'list')}
          style={{ padding: '0 20px' }}
          items={[
            { key: 'nav', label: '导航管理' },
            { key: 'list', label: '列表管理' },
          ]}
        />

        {/* ══ 导航管理 ══ */}
        {mainTab === 'nav' && (
          <div>
            {/* 页头 */}
            <div style={{ padding: '0 20px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
                管理前台 Wiki 的导航项，每个导航对应一个独立的 Wiki 页面（如道具、怪物、卡片等）
              </p>
              <Button type="primary" icon={<Plus size={14} />} style={{ borderRadius: 6 }} onClick={openAddNavModal}>
                新增导航
              </Button>
            </div>

            {/* 统计卡片 */}
            <div style={{ padding: '16px 20px', display: 'flex', gap: 16, borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ flex: 1, padding: '12px 16px', background: '#F0F9FF', borderRadius: 8, border: '1px solid #BAE6FD' }}>
                <div style={{ fontSize: 12, color: '#0369A1' }}>总导航数</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#0C4A6E', marginTop: 4 }}>{navs.length}</div>
              </div>
              <div style={{ flex: 1, padding: '12px 16px', background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: 12, color: '#15803D' }}>已启用</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#14532D', marginTop: 4 }}>{navs.filter(n => n.enabled).length}</div>
              </div>
              <div style={{ flex: 1, padding: '12px 16px', background: '#FFF7ED', borderRadius: 8, border: '1px solid #FED7AA' }}>
                <div style={{ fontSize: 12, color: '#C2410C' }}>未启用</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#7C2D12', marginTop: 4 }}>{navs.filter(n => !n.enabled).length}</div>
              </div>
            </div>

            {/* 提示 */}
            <div style={{ padding: '12px 20px 0' }}>
              <div style={{ padding: '10px 14px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 6, fontSize: 13, color: '#92400E' }}>
                💡 拖拽左侧 <GripVertical size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> 图标可调整导航在前台的显示顺序。点击「管理」进入该导航的字段与数据管理。
              </div>
            </div>

            {/* 表格 */}
            <div style={{ padding: '16px 20px' }}>
              <Table
                dataSource={sortedNavs}
                columns={navColumns}
                rowKey="key"
                size="small"
                pagination={false}
                onRow={(_, index) => ({
                  draggable: true,
                  onDragStart: () => handleNavDragStart(index!),
                  onDragOver: (e: React.DragEvent) => handleNavDragOver(e, index!),
                  onDrop: handleNavDrop,
                  style: { cursor: 'default' },
                })}
              />
            </div>
          </div>
        )}

        {/* ══ 列表管理 ══ */}
        {mainTab === 'list' && (
          <div style={{ padding: '0 20px 24px' }}>
            {/* 导航选择器 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: 13, color: '#374151', flexShrink: 0 }}>当前导航：</span>
              <Select
                value={selectedNavKey}
                onChange={key => { setSelectedNavKey(key); setListFieldKeys([]) }}
                style={{ width: 200 }}
                size="middle"
              >
                {sortedNavs.map(n => (
                  <Select.Option key={n.key} value={n.key}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13 }}>{n.label}</span>
                      {!n.enabled && <Tag color="default" style={{ fontSize: 11, padding: '0 4px' }}>未启用</Tag>}
                    </span>
                  </Select.Option>
                ))}
              </Select>
              <Button type="primary" icon={<Plus size={14} />} style={{ borderRadius: 6 }} onClick={openAddFieldModal}>
                新增字段
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* 模块一：字段配置 */}
              <div>
                <div style={{ marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>字段配置</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    配置前台页面展示的字段及其属性。点击名称旁的
                    <Languages size={13} style={{ color: '#1677FF', flexShrink: 0, verticalAlign: 'middle' }} />
                    图标可配置多语言，支持 AI 一键翻译。
                  </p>
                </div>
                {sortedFields.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '32px 0', border: '1px dashed #E5E7EB', borderRadius: 8 }}>
                    该导航暂无字段配置，点击「新增字段」开始添加
                  </div>
                ) : (
                  <Table
                    dataSource={sortedFields}
                    columns={fieldColumns}
                    rowKey="key"
                    size="small"
                    pagination={false}
                  />
                )}
              </div>

              {/* 分割线 */}
              <div style={{ borderTop: '1px solid #E5E7EB' }} />

              {/* 模块二：列表样式 */}
              <div>
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>列表样式</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
                    选择前台列表页的展示样式，不同样式支持的字段数量和类型不同。
                  </p>
                </div>

                {/* 第一行：4种样式横向排列 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
                  {LIST_STYLES.map(s => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedStyle(s.id)
                        const valid = listFieldKeys.filter(k => {
                          const f = currentFields.find(ff => ff.key === k)
                          return f && s.allowedTypes.includes(f.type)
                        }).slice(0, s.maxFields)
                        setListFieldKeys(valid)
                      }}
                      style={{
                        padding: '12px 14px',
                        border: `2px solid ${selectedStyle === s.id ? '#1677FF' : '#E5E7EB'}`,
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: selectedStyle === s.id ? '#EFF6FF' : '#fff',
                        transition: 'all 0.15s',
                        position: 'relative',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 20, flexShrink: 0 }}>{s.icon}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>{s.label}</div>
                          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3, lineHeight: 1.4 }}>{s.description}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                        {s.requireImage
                          ? `图片必选 + 最多 ${s.maxTextFields ?? (s.maxFields - 1)} 个文本/数字`
                          : `最多 ${s.maxFields} 个字段`}
                      </div>
                      {selectedStyle === s.id && (
                        <Tag color="blue" style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, padding: '0 4px' }}>已选</Tag>
                      )}
                    </div>
                  ))}
                </div>

                {/* 第二行：左侧字段勾选 + 右侧预览 */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  {/* 左侧：字段勾选 */}
                  <div style={{ width: 260, flexShrink: 0, border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA', padding: '12px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 10 }}>
                      选择展示字段
                      <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 6 }}>
                        ({validListFieldKeys.length}/{currentStyleConfig.maxFields})
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
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
                        // For requireImage styles: only 1 image allowed; text/number capped at maxTextFields
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
                            <Tag color={fieldTypeColors[f.type as FieldType]} style={{ fontSize: 11, padding: '0 4px' }}>{f.type}</Tag>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* 右侧：前端预览 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 10 }}>
                      前端预览
                      <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>仅供参考</Tag>
                    </div>
                    <div style={{ padding: 16, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, minHeight: 120 }}>
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

              {/* 分割线 */}
              <div style={{ borderTop: '1px solid #E5E7EB' }} />

              {/* 模块三：详情样式 */}
              <div>
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>详情样式</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
                    选择前台详情页的展示样式，配置主区域与侧边栏显示的字段。
                  </p>
                </div>

                {/* 样式选择：2种横向排列 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
                  {DETAIL_STYLES.map(s => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedDetailStyle(s.id)}
                      style={{
                        padding: '12px 14px',
                        border: `2px solid ${selectedDetailStyle === s.id ? '#1677FF' : '#E5E7EB'}`,
                        borderRadius: 8,
                        cursor: 'pointer',
                        background: selectedDetailStyle === s.id ? '#EFF6FF' : '#fff',
                        transition: 'all 0.15s',
                        position: 'relative',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ fontSize: 20, flexShrink: 0 }}>{s.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{s.label}</div>
                          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3, lineHeight: 1.4 }}>{s.description}</div>
                        </div>
                      </div>
                      {selectedDetailStyle === s.id && (
                        <Tag color="blue" style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, padding: '0 4px' }}>已选</Tag>
                      )}
                    </div>
                  ))}
                </div>

                {/* 字段配置 + 预览 */}
                {selectedDetailStyle === 'detail-1' ? (
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    {/* 左侧：3个模块配置 */}
                    <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* 模块一：主区域字段 */}
                      <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA', padding: '12px 14px' }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                          ① 主区域字段
                        </div>
                        <Input
                          size="small"
                          value={detail1Config.mainTitle}
                          onChange={e => setDetail1Config(prev => ({ ...prev, mainTitle: e.target.value }))}
                          placeholder="区域标题"
                          style={{ marginBottom: 8 }}
                          prefix={<span style={{ color: '#9CA3AF', fontSize: 11 }}>标题</span>}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {sortedFields.filter(f => f.visible).map(f => {
                            const allowed = ['image', 'text', 'number'].includes(f.type)
                            const checked = detail1Config.mainFieldKeys.includes(f.key)
                            const usedElsewhere = detail1Config.sideFieldKeys.includes(f.key)
                            return (
                              <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Checkbox
                                  checked={checked}
                                  disabled={!allowed || usedElsewhere}
                                  onChange={e => {
                                    setDetail1Config(prev => ({
                                      ...prev,
                                      mainFieldKeys: e.target.checked
                                        ? [...prev.mainFieldKeys, f.key]
                                        : prev.mainFieldKeys.filter(k => k !== f.key),
                                    }))
                                  }}
                                />
                                <span style={{ fontSize: 12, color: allowed && !usedElsewhere ? '#374151' : '#9CA3AF' }}>{f.label}</span>
                                <Tag color={fieldTypeColors[f.type as FieldType]} style={{ fontSize: 10, padding: '0 3px' }}>{f.type}</Tag>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* 模块二：富媒体表格区域 */}
                      <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA', padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>② 富媒体表格区域</span>
                          <Button size="small" type="dashed" icon={<Plus size={12} />} onClick={addRichTableSection}>
                            添加区域
                          </Button>
                        </div>
                        {detail1Config.richTableSections.length === 0 ? (
                          <div style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
                            暂无区域，点击「添加区域」
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {detail1Config.richTableSections.map(section => (
                              <div key={section.id} style={{ border: '1px solid #E5E7EB', borderRadius: 6, padding: '8px 10px', background: '#fff' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                  <Input
                                    size="small"
                                    value={section.title}
                                    onChange={e => updateRichTableSection(section.id, { title: e.target.value })}
                                    style={{ flex: 1 }}
                                    prefix={<span style={{ color: '#9CA3AF', fontSize: 10 }}>标题</span>}
                                  />
                                  <Button size="small" type="text" danger icon={<Trash2 size={12} />}
                                    onClick={() => removeRichTableSection(section.id)} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  {sortedFields.filter(f => f.visible && ['text', 'number', 'image', 'rich-table'].includes(f.type)).map(f => {
                                    const checked = section.fieldKeys.includes(f.key)
                                    return (
                                      <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Checkbox
                                          checked={checked}
                                          onChange={e => {
                                            updateRichTableSection(section.id, {
                                              fieldKeys: e.target.checked
                                                ? [...section.fieldKeys, f.key]
                                                : section.fieldKeys.filter(k => k !== f.key),
                                            })
                                          }}
                                        />
                                        <span style={{ fontSize: 12, color: '#374151' }}>{f.label}</span>
                                        <Tag color={fieldTypeColors[f.type as FieldType]} style={{ fontSize: 10, padding: '0 3px' }}>{f.type}</Tag>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 模块三：侧边栏字段 */}
                      <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA', padding: '12px 14px' }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                          ③ 侧边栏字段
                        </div>
                        <Input
                          size="small"
                          value={detail1Config.sideTitle}
                          onChange={e => setDetail1Config(prev => ({ ...prev, sideTitle: e.target.value }))}
                          placeholder="侧边栏标题"
                          style={{ marginBottom: 8 }}
                          prefix={<span style={{ color: '#9CA3AF', fontSize: 11 }}>标题</span>}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {sortedFields.filter(f => f.visible).map(f => {
                            const allowed = ['text', 'number', 'tag'].includes(f.type)
                            const checked = detail1Config.sideFieldKeys.includes(f.key)
                            const usedInMain = detail1Config.mainFieldKeys.includes(f.key)
                            return (
                              <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Checkbox
                                  checked={checked}
                                  disabled={!allowed || usedInMain}
                                  onChange={e => {
                                    setDetail1Config(prev => ({
                                      ...prev,
                                      sideFieldKeys: e.target.checked
                                        ? [...prev.sideFieldKeys, f.key]
                                        : prev.sideFieldKeys.filter(k => k !== f.key),
                                    }))
                                  }}
                                />
                                <span style={{ fontSize: 12, color: allowed && !usedInMain ? '#374151' : '#9CA3AF' }}>{f.label}</span>
                                <Tag color={fieldTypeColors[f.type as FieldType]} style={{ fontSize: 10, padding: '0 3px' }}>{f.type}</Tag>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* 右侧：预览 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 10 }}>
                        前端预览
                        <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>仅供参考</Tag>
                      </div>
                      <div style={{ padding: 16, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, minHeight: 120 }}>
                        {detail1Config.mainFieldKeys.length === 0 && detail1Config.sideFieldKeys.length === 0 && detail1Config.richTableSections.length === 0 ? (
                          <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '24px 0' }}>
                            请在左侧配置字段
                          </div>
                        ) : (
                          <DetailStylePreview
                            style="detail-1"
                            fields={sortedFields}
                            detail1Config={detail1Config}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 详情样式 2 */
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* 主区域字段 */}
                      <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA', padding: '12px 14px' }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                          主区域字段
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {sortedFields.filter(f => f.visible).map(f => {
                            const allowed = ['image', 'text', 'number', 'tag'].includes(f.type)
                            const checked = detail2Config.mainFieldKeys.includes(f.key)
                            const usedInSide = detail2Config.sideFieldKeys.includes(f.key)
                            return (
                              <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Checkbox
                                  checked={checked}
                                  disabled={!allowed || usedInSide}
                                  onChange={e => {
                                    setDetail2Config(prev => ({
                                      ...prev,
                                      mainFieldKeys: e.target.checked
                                        ? [...prev.mainFieldKeys, f.key]
                                        : prev.mainFieldKeys.filter(k => k !== f.key),
                                    }))
                                  }}
                                />
                                <span style={{ fontSize: 12, color: allowed && !usedInSide ? '#374151' : '#9CA3AF' }}>{f.label}</span>
                                <Tag color={fieldTypeColors[f.type as FieldType]} style={{ fontSize: 10, padding: '0 3px' }}>{f.type}</Tag>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* 侧边栏字段 */}
                      <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA', padding: '12px 14px' }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                          侧边栏字段
                        </div>
                        <Input
                          size="small"
                          value={detail2Config.sideTitle}
                          onChange={e => setDetail2Config(prev => ({ ...prev, sideTitle: e.target.value }))}
                          placeholder="侧边栏标题"
                          style={{ marginBottom: 8 }}
                          prefix={<span style={{ color: '#9CA3AF', fontSize: 11 }}>标题</span>}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {sortedFields.filter(f => f.visible).map(f => {
                            const allowed = ['text', 'number', 'tag'].includes(f.type)
                            const checked = detail2Config.sideFieldKeys.includes(f.key)
                            const usedInMain = detail2Config.mainFieldKeys.includes(f.key)
                            return (
                              <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Checkbox
                                  checked={checked}
                                  disabled={!allowed || usedInMain}
                                  onChange={e => {
                                    setDetail2Config(prev => ({
                                      ...prev,
                                      sideFieldKeys: e.target.checked
                                        ? [...prev.sideFieldKeys, f.key]
                                        : prev.sideFieldKeys.filter(k => k !== f.key),
                                    }))
                                  }}
                                />
                                <span style={{ fontSize: 12, color: allowed && !usedInMain ? '#374151' : '#9CA3AF' }}>{f.label}</span>
                                <Tag color={fieldTypeColors[f.type as FieldType]} style={{ fontSize: 10, padding: '0 3px' }}>{f.type}</Tag>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* 右侧：预览 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 10 }}>
                        前端预览
                        <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>仅供参考</Tag>
                      </div>
                      <div style={{ padding: 16, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, minHeight: 120 }}>
                        {detail2Config.mainFieldKeys.length === 0 && detail2Config.sideFieldKeys.length === 0 ? (
                          <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '24px 0' }}>
                            请在左侧配置字段
                          </div>
                        ) : (
                          <DetailStylePreview
                            style="detail-2"
                            fields={sortedFields}
                            detail2Config={detail2Config}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 新增 / 编辑导航弹窗 */}
      <Modal
        title={editingNav ? '编辑导航' : '新增导航'}
        open={navModalOpen}
        onOk={handleNavSave}
        onCancel={() => setNavModalOpen(false)}
        okText="保存"
        cancelText="取消"
        width={480}
      >
        <Form form={navForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="key"
            label="导航 Key（英文标识）"
            rules={[
              { required: true, message: '请输入导航 Key' },
              { pattern: /^[a-zA-Z_][a-zA-Z0-9_-]*$/, message: '只能包含字母、数字、下划线和连字符' },
            ]}
          >
            <Input placeholder="如：cards、pets" disabled={!!editingNav} />
          </Form.Item>
          <Form.Item name="label" label="导航名称" rules={[{ required: true, message: '请输入导航名称' }]}>
            <Input placeholder="如：卡片、宠物" />
          </Form.Item>
          <Form.Item name="description" label="导航说明">
            <Input.TextArea placeholder="简要描述该导航包含的内容" rows={2} />
          </Form.Item>
          <Form.Item name="enabled" label="前台启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

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
        <Form form={fieldForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="key" label="字段 Key"
            rules={[
              { required: true, message: '请输入字段 Key' },
              { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '只能包含字母、数字和下划线' },
            ]}
          >
            <Input placeholder="如：attack_speed" disabled={!!editingField} />
          </Form.Item>
          <Form.Item name="label" label="显示名称（中文）" rules={[{ required: true, message: '请输入显示名称' }]}>
            <Input placeholder="如：攻击速度" />
          </Form.Item>
          <Form.Item name="type" label="字段类型" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="text">text — 文本</Select.Option>
              <Select.Option value="number">number — 数字</Select.Option>
              <Select.Option value="image">image — 图片/图标</Select.Option>
              <Select.Option value="tag">tag — 标签</Select.Option>
              <Select.Option value="rich-table">rich-table — 富媒体表</Select.Option>
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
