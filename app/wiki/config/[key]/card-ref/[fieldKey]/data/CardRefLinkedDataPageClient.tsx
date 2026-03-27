'use client'

import React, { useMemo, useState } from 'react'
import { Table, Button, Switch, Popconfirm, message, Modal, Form, Input } from 'antd'
import { Plus, Search } from 'lucide-react'
import PageBreadcrumb from '../../../../../../components/PageBreadcrumb'

const WIKI_META: Record<string, { label: string }> = {
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

export interface CardRefLinkedDataRow {
  key: string
  id: number
  /** 第二列展示文案（对应关联子表一行摘要，当前为 MOCK） */
  summary: string
  hidden: boolean
}

/** 图 3 风格 MOCK：升星数据 / 掉落等 */
function buildInitialMockRows(fieldKey: string): CardRefLinkedDataRow[] {
  if (fieldKey === 'set_parts') {
    return [
      { key: 'set_parts-0', id: 824135, summary: '星级 1 · 波利卡片 ×1 · 幸运+3', hidden: false },
      { key: 'set_parts-1', id: 824135, summary: '星级 2 · 波利卡片 ×3 · 生命上限+100', hidden: false },
      { key: 'set_parts-2', id: 824135, summary: '星级 3 · 波利卡片 ×6 · 闪避+3', hidden: false },
    ]
  }
  if (fieldKey === 'drop_item') {
    return [{ key: 'drop_item-0', id: 816796, summary: '波利', hidden: false }]
  }
  return [
    { key: 'generic-0', id: 900001, summary: '示例关联行 A（MOCK）', hidden: false },
    { key: 'generic-1', id: 900002, summary: '示例关联行 B（MOCK）', hidden: false },
  ]
}

export default function CardRefLinkedDataPageClient({
  wikiKey,
  fieldKey,
  fieldLabel,
}: {
  wikiKey: string
  fieldKey: string
  fieldLabel: string
}) {
  const [messageApi, contextHolder] = message.useMessage()
  const wikiLabel = WIKI_META[wikiKey]?.label ?? wikiKey
  const [rows, setRows] = useState<CardRefLinkedDataRow[]>(() => buildInitialMockRows(fieldKey))
  const [searchKeyword, setSearchKeyword] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [addForm] = Form.useForm<{ summary: string }>()

  const dataSource = useMemo(() => {
    const q = searchKeyword.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => String(r.id).includes(q) || r.summary.toLowerCase().includes(q))
  }, [rows, searchKeyword])

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 100 },
    {
      title: fieldLabel,
      dataIndex: 'summary',
      key: 'summary',
      ellipsis: true,
    },
    {
      title: '隐藏',
      key: 'hidden',
      width: 90,
      align: 'center' as const,
      render: (_: unknown, record: CardRefLinkedDataRow) => (
        <Switch
          checked={record.hidden}
          onChange={(checked) => {
            setRows((prev) => prev.map((r) => (r.key === record.key ? { ...r, hidden: checked } : r)))
            messageApi.success(checked ? '已标记为隐藏' : '已取消隐藏')
          }}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: CardRefLinkedDataRow) => (
        <Popconfirm
          title="确认删除该条关联数据？"
          description="当前为本地 MOCK，删除后仅影响本页展示。"
          okText="删除"
          cancelText="取消"
          okButtonProps={{ danger: true }}
          onConfirm={() => {
            setRows((prev) => prev.filter((r) => r.key !== record.key))
            messageApi.success('已删除')
          }}
        >
          <Button size="small" danger type="link">
            删除卡片
          </Button>
        </Popconfirm>
      ),
    },
  ]

  const submitAdd = async () => {
    const values = await addForm.validateFields()
    const summary = (values.summary ?? '').trim()
    if (!summary) {
      messageApi.error('请填写内容')
      return
    }
    const nextId = Math.max(0, ...rows.map((r) => r.id), 100000) + 1
    setRows((prev) => [
      ...prev,
      { key: `${fieldKey}-${Date.now()}`, id: nextId, summary, hidden: false },
    ])
    messageApi.success('已新增（MOCK）')
    setAddOpen(false)
    addForm.resetFields()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {contextHolder}
      <PageBreadcrumb
        items={[
          { label: 'Wiki 管理', href: '/wiki' },
          { label: `${wikiLabel} 配置`, href: `/wiki/config/${wikiKey}` },
          { label: `${fieldLabel} · 数据` },
        ]}
      />

      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', flexShrink: 0 }}>{fieldLabel}</div>
          <Input
            allowClear
            placeholder={`搜索 ID 或${fieldLabel}内容`}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            prefix={<Search size={16} style={{ color: '#9ca3af' }} />}
            style={{ flex: '1 1 220px', maxWidth: 420, minWidth: 180 }}
          />
          <Button
            type="primary"
            icon={<Plus size={14} />}
            onClick={() => setAddOpen(true)}
            style={{ flexShrink: 0, marginLeft: 'auto' }}
          >
            新增
          </Button>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <Table<CardRefLinkedDataRow>
            rowKey="key"
            size="small"
            columns={columns}
            dataSource={dataSource}
            pagination={false}
          />
        </div>
      </div>

      <Modal
        title="新增条目"
        open={addOpen}
        onOk={submitAdd}
        onCancel={() => {
          setAddOpen(false)
          addForm.resetFields()
        }}
        okText="确定"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={addForm} layout="vertical" style={{ marginTop: 12 }} initialValues={{ summary: '' }}>
          <Form.Item name="summary" label={`${fieldLabel}（展示文案）`} rules={[{ required: true, message: '请填写' }]}>
            <Input allowClear placeholder="例如：星级 1 · 波利卡片 ×1" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
