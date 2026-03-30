'use client'

import React, { useState, Suspense } from 'react'
import {
  Table, Button, Tag, Space, Input, Modal, Form, Switch,
  Tooltip, Popconfirm, message,
} from 'antd'
import { Plus, Edit2, Trash2, ExternalLink, Database, Languages } from 'lucide-react'
import { useRouter } from 'next/navigation'
import PageBreadcrumb from '../components/PageBreadcrumb'
import ForumSelectRequired from '../components/ForumSelectRequired'
import FieldI18nModal, { type I18nLabels, LANGUAGES } from './components/FieldI18nModal'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface WikiNav {
  key: string
  label: string
  /** 名称多语言，与字段配置中的 i18n 结构一致；展示主文案以 zh 为准，与 label 同步 */
  labelI18n: I18nLabels
  link: string
  enabled: boolean
  fieldCount: number
  order: number
}


// ─────────────────────────────────────────────
// Nav data
// ─────────────────────────────────────────────
const initialNavs: WikiNav[] = [
  { key: 'items',    label: '道具',     labelI18n: { zh: '道具',     en: 'Items',          'zh-tw': '道具' },     link: '/wiki/items',    enabled: true,  fieldCount: 11, order: 1 },
  { key: 'monsters', label: '怪物',     labelI18n: { zh: '怪物',     en: 'Monsters',       'zh-tw': '怪物' },     link: '/wiki/monsters', enabled: true,  fieldCount: 13, order: 2 },
  { key: 'cards',    label: '卡片',     labelI18n: { zh: '卡片',     en: 'Cards',          'zh-tw': '卡片' },     link: '/wiki/cards',    enabled: true,  fieldCount: 8,  order: 3 },
  { key: 'pets',     label: '宠物',     labelI18n: { zh: '宠物',     en: 'Pets',           'zh-tw': '寵物' },     link: '/wiki/pets',     enabled: true,  fieldCount: 9,  order: 4 },
  { key: 'boxes',    label: '箱子',     labelI18n: { zh: '箱子',     en: 'Boxes',          'zh-tw': '箱子' },     link: '/wiki/boxes',    enabled: true,  fieldCount: 6,  order: 5 },
  { key: 'arrows',   label: '箭矢制作', labelI18n: { zh: '箭矢制作', en: 'Arrow Crafting', 'zh-tw': '箭矢製作' }, link: '/wiki/arrows',   enabled: true,  fieldCount: 7,  order: 6 },
  { key: 'sets',     label: '套装',     labelI18n: { zh: '套装',     en: 'Equipment Sets', 'zh-tw': '套裝' },     link: '/wiki/sets',     enabled: true,  fieldCount: 8,  order: 7 },
  { key: 'skills',   label: '技能模拟', labelI18n: { zh: '技能模拟', en: 'Skill Simulator','zh-tw': '技能模擬' }, link: '/wiki/skills',   enabled: false, fieldCount: 12, order: 8 },
  { key: 'npcs',     label: 'NPC',      labelI18n: { zh: 'NPC',      en: 'NPCs',           'zh-tw': 'NPC' },      link: '/wiki/npcs',     enabled: true,  fieldCount: 7,  order: 9 },
  { key: 'maps',     label: '地图',     labelI18n: { zh: '地图',     en: 'Maps',           'zh-tw': '地圖' },     link: '/wiki/maps',     enabled: true,  fieldCount: 10, order: 10 },
]


// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
function WikiManageInner() {
  const router = useRouter()
  const [messageApi, contextHolder] = message.useMessage()

  // ── Wiki 分类 state ──────────────────────────
  const [navs, setNavs] = useState<WikiNav[]>(initialNavs)
  const [navModalOpen, setNavModalOpen] = useState(false)
  const [editingNav, setEditingNav] = useState<WikiNav | null>(null)
  const [navForm] = Form.useForm()
  const [navNameI18nModalOpen, setNavNameI18nModalOpen] = useState(false)
  const [pendingNavLabelI18n, setPendingNavLabelI18n] = useState<I18nLabels>({})
  /** 列表「Wiki 名称」列内直接打开多语言（与编辑弹窗内的多语言分开） */
  const [listRowI18nOpen, setListRowI18nOpen] = useState(false)
  const [listRowI18nNav, setListRowI18nNav] = useState<WikiNav | null>(null)

  const sortedNavs = [...navs].sort((a, b) => a.order - b.order)

  const openAddNavModal = () => {
    setEditingNav(null)
    navForm.resetFields()
    navForm.setFieldsValue({ enabled: true })
    setPendingNavLabelI18n({})
    setNavModalOpen(true)
  }

  const openEditNavModal = (record: WikiNav) => {
    setEditingNav(record)
    navForm.setFieldsValue(record)
    setPendingNavLabelI18n({
      ...(record.labelI18n || {}),
      zh: record.labelI18n?.zh ?? record.label,
    })
    setNavModalOpen(true)
  }

  const handleNavNameI18nSave = (i18n: I18nLabels) => {
    const zh = (i18n.zh ?? '').trim()
    setPendingNavLabelI18n(i18n)
    navForm.setFieldsValue({ label: zh || navForm.getFieldValue('label') })
    setNavNameI18nModalOpen(false)
    messageApi.success('多语言配置已保存')
  }

  const openNavNameI18nModal = () => {
    const zh = (navForm.getFieldValue('label') as string | undefined)?.trim() ?? ''
    setPendingNavLabelI18n((prev) => ({ ...prev, ...(zh ? { zh } : {}) }))
    setNavNameI18nModalOpen(true)
  }

  const handleNavSave = () => {
    navForm.validateFields().then(values => {
      const zh = String(values.label ?? '').trim()
      const labelI18n: I18nLabels = { ...pendingNavLabelI18n, zh }
      const row: Omit<WikiNav, 'link' | 'order' | 'fieldCount'> & Partial<Pick<WikiNav, 'link' | 'order' | 'fieldCount'>> = {
        ...values,
        label: zh,
        labelI18n,
      }
      if (editingNav) {
        setNavs(prev => prev.map(n => (n.key === editingNav.key ? { ...n, ...row } as WikiNav : n)))
        messageApi.success('已更新')
      } else {
        const keyExists = navs.some(n => n.key === values.key)
        if (keyExists) { messageApi.error('Key 已存在'); return }
        const maxOrder = Math.max(...navs.map(n => n.order), 0)
        const link = `/wiki/${values.key}`
        setNavs(prev => [...prev, { ...row, link, order: maxOrder + 1, fieldCount: 0 } as WikiNav])
        messageApi.success('已新增')
      }
      setNavModalOpen(false)
      setPendingNavLabelI18n({})
    })
  }

  const handleNavDelete = (key: string) => {
    setNavs(prev => prev.filter(n => n.key !== key))
    messageApi.success('已删除')
  }

  const openListRowI18nModal = (record: WikiNav) => {
    setListRowI18nNav({
      ...record,
      labelI18n: {
        ...(record.labelI18n || {}),
        zh: record.labelI18n?.zh ?? record.label,
      },
    })
    setListRowI18nOpen(true)
  }

  const handleListRowI18nSave = (i18n: I18nLabels) => {
    if (!listRowI18nNav) return
    const nextZh = (i18n.zh ?? '').trim()
    setNavs((prev) =>
      prev.map((n) =>
        n.key === listRowI18nNav.key
          ? { ...n, labelI18n: i18n, label: nextZh || n.label }
          : n,
      ),
    )
    setListRowI18nOpen(false)
    setListRowI18nNav(null)
    messageApi.success('多语言配置已保存')
  }

  const closeListRowI18nModal = () => {
    setListRowI18nOpen(false)
    setListRowI18nNav(null)
  }

  // ── Wiki 分类表格列 ─────────────────────────────
  const navColumns = [
    {
      title: 'Wiki 名称', dataIndex: 'label', key: 'label', width: 220,
      render: (v: string, record: WikiNav) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{v}</span>
            <Tooltip title="配置多语言">
              <Button
                size="small"
                type="text"
                icon={<Languages size={12} />}
                style={{ color: '#1677FF', padding: '0 4px', height: 20 }}
                onClick={() => openListRowI18nModal(record)}
              />
            </Tooltip>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {LANGUAGES.filter(l => record.labelI18n?.[l.code]?.trim()).map(l => (
                <Tooltip key={l.code} title={`${l.label}: ${record.labelI18n[l.code]}`}>
                  <span style={{ fontSize: 11, color: '#6B7280', background: '#F3F4F6', padding: '1px 5px', borderRadius: 3, cursor: 'default', lineHeight: '18px' }}>{l.code}</span>
                </Tooltip>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>key: {record.key}</div>
        </div>
      ),
    },
    {
      title: '链接', dataIndex: 'link', key: 'link', width: 160,
      render: (v: string) => (
        <span style={{ fontSize: 12, color: '#1890ff', textDecoration: 'underline', cursor: 'pointer' }}>{v}</span>
      ),
    },
    {
      title: '字段数', dataIndex: 'fieldCount', key: 'fieldCount', width: 72, align: 'center' as const,
      render: (v: number) => <Tag color="blue">{v} 个</Tag>,
    },
    {
      title: '操作', key: 'action', width: 260,
      render: (_: unknown, record: WikiNav) => (
        <Space size={4} wrap>
          <Tooltip title="进入配置">
            <Button size="small" type="link" icon={<ExternalLink size={13} />}
              onClick={() => router.push(`/wiki/config/${record.key}`)}>
              配置
            </Button>
          </Tooltip>
          <Tooltip title="管理该 Wiki 下的卡片数据">
            <Button size="small" type="link" icon={<Database size={13} />}
              onClick={() => router.push(`/wiki/data/${record.key}`)}>
              数据
            </Button>
          </Tooltip>
          <Button size="small" type="text" icon={<Edit2 size={13} />} onClick={() => openEditNavModal(record)}>编辑</Button>
          <Popconfirm title="确认删除该 Wiki？" description="删除后前台将不再展示此 Wiki 页面。"
            onConfirm={() => handleNavDelete(record.key)} okText="删除" cancelText="取消" okButtonProps={{ danger: true }}>
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

      <ForumSelectRequired>
      {/* Wiki 分类列表 */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div>
            {/* 页头 */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
                管理该游戏的 Wiki 内容分类，每个分类对应一个独立的 Wiki 页面（如道具、怪物、卡片等）
              </p>
              <Button type="primary" icon={<Plus size={14} />} style={{ borderRadius: 6 }} onClick={openAddNavModal}>
                新增
              </Button>
            </div>

            {/* 统计卡片 */}
            <div style={{ padding: '16px 20px', display: 'flex', gap: 16, borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ flex: 1, padding: '12px 16px', background: '#F0F9FF', borderRadius: 8, border: '1px solid #BAE6FD' }}>
                <div style={{ fontSize: 12, color: '#0369A1' }}>总分类数</div>
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
                💡 点击「配置」管理字段与展示样式；点击「数据」进入该 Wiki 的卡片数据列表（示例 MOCK）。
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
              />
            </div>
          </div>
      </div>
      </ForumSelectRequired>

      {/* 新增 / 编辑 Wiki 分类弹窗 */}
      <Modal
        title={editingNav ? '编辑 Wiki 分类' : '新增 Wiki 分类'}
        open={navModalOpen}
        forceRender
        onOk={handleNavSave}
        onCancel={() => { setNavModalOpen(false); setPendingNavLabelI18n({}) }}
        okText="保存"
        cancelText="取消"
        width={480}
      >
        <Form form={navForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="key"
            label="Key（英文标识）"
            rules={[
              { required: true, message: '请输入 Key' },
              { pattern: /^[a-zA-Z_][a-zA-Z0-9_-]*$/, message: '只能包含字母、数字、下划线和连字符' },
            ]}
          >
            <Input placeholder="如：cards、pets" disabled={!!editingNav} />
          </Form.Item>
          <Form.Item label="名称" required style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Form.Item name="label" noStyle rules={[{ required: true, message: '请输入名称' }]}>
                <Input
                  placeholder="如：卡片、宠物（默认作为简体中文）"
                  style={{ flex: 1 }}
                  onChange={e => setPendingNavLabelI18n(prev => ({ ...prev, zh: e.target.value }))}
                />
              </Form.Item>
              <Tooltip title="配置多语言">
                <Button
                  type="text"
                  icon={<Languages size={16} />}
                  style={{ color: '#1677FF', flexShrink: 0, marginTop: 4 }}
                  onClick={openNavNameI18nModal}
                />
              </Tooltip>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9CA3AF' }}>
              与字段配置一致：可点击图标打开多语言弹窗，支持 AI 一键翻译。
            </p>
          </Form.Item>
          <Form.Item name="enabled" label="前台启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <FieldI18nModal
        open={navNameI18nModalOpen}
        fieldKey="name"
        fieldLabel={(pendingNavLabelI18n.zh ?? navForm.getFieldValue('label') ?? '').trim() || '名称'}
        i18n={pendingNavLabelI18n}
        onSave={handleNavNameI18nSave}
        onCancel={() => setNavNameI18nModalOpen(false)}
      />

      <FieldI18nModal
        open={listRowI18nOpen && !!listRowI18nNav}
        fieldKey={listRowI18nNav?.key ?? 'name'}
        fieldLabel={(listRowI18nNav?.labelI18n?.zh ?? listRowI18nNav?.label ?? '').trim() || '名称'}
        i18n={listRowI18nNav?.labelI18n ?? {}}
        onSave={handleListRowI18nSave}
        onCancel={closeListRowI18nModal}
      />
    </div>
  )
}

export default function WikiManagePage() {
  return (
    <Suspense fallback={null}>
      <WikiManageInner />
    </Suspense>
  )
}
