'use client'

import React, { useState, Suspense } from 'react'
import {
  Table, Button, Tag, Space, Input, Select, Modal, Form, Switch,
  Tooltip, Popconfirm, message,
} from 'antd'
import { Plus, Edit2, Trash2, ExternalLink, Search, Database } from 'lucide-react'
import { useRouter } from 'next/navigation'
import PageBreadcrumb from '../components/PageBreadcrumb'
import ForumSelectRequired from '../components/ForumSelectRequired'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface WikiNav {
  key: string
  label: string
  description: string
  link: string
  enabled: boolean
  fieldCount: number
  order: number
}


// ─────────────────────────────────────────────
// Nav data
// ─────────────────────────────────────────────
const initialNavs: WikiNav[] = [
  { key: 'items',    label: '道具',     description: '武器、防具、消耗品、材料等游戏道具',   link: '/wiki/items',    enabled: true,  fieldCount: 11, order: 1 },
  { key: 'monsters', label: '怪物',     description: '普通怪物、MVP、Mini Boss 等',         link: '/wiki/monsters', enabled: true,  fieldCount: 13, order: 2 },
  { key: 'cards',    label: '卡片',     description: '怪物掉落卡片及其效果',               link: '/wiki/cards',    enabled: true,  fieldCount: 8,  order: 3 },
  { key: 'pets',     label: '宠物',     description: '可捕获的宠物及其属性、亲密度等',     link: '/wiki/pets',     enabled: true,  fieldCount: 9,  order: 4 },
  { key: 'boxes',    label: '箱子',     description: '宝箱、礼包等可开启的容器类道具',     link: '/wiki/boxes',    enabled: true,  fieldCount: 6,  order: 5 },
  { key: 'arrows',   label: '箭矢制作', description: '弓箭手系列箭矢的制作配方',           link: '/wiki/arrows',   enabled: true,  fieldCount: 7,  order: 6 },
  { key: 'sets',     label: '套装',     description: '装备套装组合及套装效果',             link: '/wiki/sets',     enabled: true,  fieldCount: 8,  order: 7 },
  { key: 'skills',   label: '技能模拟', description: '各职业技能树与技能效果模拟',         link: '/wiki/skills',   enabled: false, fieldCount: 12, order: 8 },
  { key: 'npcs',     label: 'NPC',      description: '游戏内 NPC 位置、功能与对话',        link: '/wiki/npcs',     enabled: true,  fieldCount: 7,  order: 9 },
  { key: 'maps',     label: '地图',     description: '游戏地图信息、怪物分布与传送点',     link: '/wiki/maps',     enabled: true,  fieldCount: 10, order: 10 },
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
        messageApi.success('已更新')
      } else {
        const keyExists = navs.some(n => n.key === values.key)
        if (keyExists) { messageApi.error('Key 已存在'); return }
        const maxOrder = Math.max(...navs.map(n => n.order), 0)
        const link = `/wiki/${values.key}`
        setNavs(prev => [...prev, { ...values, link, order: maxOrder + 1, fieldCount: 0 }])
        messageApi.success('已新增')
      }
      setNavModalOpen(false)
    })
  }

  const handleNavDelete = (key: string) => {
    setNavs(prev => prev.filter(n => n.key !== key))
    messageApi.success('已删除')
  }

  // ── Wiki 分类表格列 ─────────────────────────────
  const navColumns = [
    {
      title: 'Wiki 名称', dataIndex: 'label', key: 'label', width: 160,
      render: (v: string, record: WikiNav) => (
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{v}</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>key: {record.key}</div>
        </div>
      ),
    },
    {
      title: '说明', dataIndex: 'description', key: 'description', width: 300,
      render: (v: string) => <span style={{ fontSize: 13, color: '#6B7280' }}>{v}</span>,
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
        onOk={handleNavSave}
        onCancel={() => setNavModalOpen(false)}
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
          <Form.Item name="label" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：卡片、宠物" />
          </Form.Item>
          <Form.Item name="description" label="说明">
            <Input.TextArea placeholder="简要描述该 Wiki 分类包含的内容" rows={2} />
          </Form.Item>
          <Form.Item name="enabled" label="前台启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
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
