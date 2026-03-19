'use client'

import React, { useState } from 'react'
import { Table, Input, Tag, Button, message, Modal, Form, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Search, Plus, Copy, Gift } from 'lucide-react'
import PageBreadcrumb from '../../components/PageBreadcrumb'
import { useForumFilter } from '../../context/ForumFilterContext'
import { FORUM_OPTIONS } from '../../data/forums'

// Mock 创作者列表（用于创建返利码时选择）
const MOCK_CREATORS = [
  { id: '1', nickname: '攻略达人小明' },
  { id: '2', nickname: '游戏解说阿杰' },
  { id: '3', nickname: '新手向攻略' },
  { id: '4', nickname: 'ROX 攻略组' },
  { id: '5', nickname: '休闲玩家' },
]

type RebateCode = {
  id: string
  code: string
  creatorId: string
  creatorNickname: string
  forumId: string
  forumName: string
  rate: number
  useCount: number
  totalRebate: number
  status: string
  createdAt: string
}

type RebateRecord = {
  id: string
  code: string
  creatorNickname: string
  forumName: string
  amount: number
  orderId: string
  createdAt: string
}

// 初始返利码数据（同一创作者可关联多个论坛）
const INIT_REBATE_CODES: RebateCode[] = [
  { id: '1', code: 'CREATOR001', creatorId: '1', creatorNickname: '攻略达人小明', forumId: 'rox', forumName: '仙境传说3', rate: 5, useCount: 42, totalRebate: 128.5, status: 'active', createdAt: '2025-01-15' },
  { id: '1-yjyj', code: 'CREATOR001_YJYJ', creatorId: '1', creatorNickname: '攻略达人小明', forumId: 'yjyj', forumName: '永劫无间', rate: 5, useCount: 18, totalRebate: 56.0, status: 'active', createdAt: '2025-02-10' },
  { id: '2', code: 'CREATOR002', creatorId: '2', creatorNickname: '游戏解说阿杰', forumId: 'rox', forumName: '仙境传说3', rate: 5, useCount: 18, totalRebate: 56.0, status: 'active', createdAt: '2025-02-03' },
  { id: '3', code: 'CREATOR003', creatorId: '4', creatorNickname: 'ROX 攻略组', forumId: 'rox', forumName: '仙境传说3', rate: 8, useCount: 89, totalRebate: 320.8, status: 'active', createdAt: '2024-11-20' },
]

// 初始返利记录（含关联创作者、关联论坛）
const INIT_REBATE_RECORDS: RebateRecord[] = [
  { id: 'r1', code: 'CREATOR001', creatorNickname: '攻略达人小明', forumName: '仙境传说3', amount: 12.5, orderId: 'ORD20250115001', createdAt: '2025-01-15 14:32' },
  { id: 'r2', code: 'CREATOR001', creatorNickname: '攻略达人小明', forumName: '仙境传说3', amount: 8.0, orderId: 'ORD20250116002', createdAt: '2025-01-16 09:15' },
  { id: 'r3', code: 'CREATOR001_YJYJ', creatorNickname: '攻略达人小明', forumName: '永劫无间', amount: 15.0, orderId: 'ORD20250210001', createdAt: '2025-02-10 16:20' },
  { id: 'r4', code: 'CREATOR003', creatorNickname: 'ROX 攻略组', forumName: '仙境传说3', amount: 25.0, orderId: 'ORD20250120003', createdAt: '2025-01-20 18:42' },
]

const RATE_OPTIONS = [3, 5, 8, 10].map((v) => ({ label: `${v}%`, value: v }))

export default function RebatePage() {
  const forumId = useForumFilter()?.forumId ?? ''
  const [searchCode, setSearchCode] = useState('')
  const [searchRecordUser, setSearchRecordUser] = useState('')
  const [rebateCodes, setRebateCodes] = useState<RebateCode[]>(INIT_REBATE_CODES)
  const [rebateRecords] = useState<RebateRecord[]>(INIT_REBATE_RECORDS)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  const filteredCodes = rebateCodes.filter((c) => {
    if (forumId && c.forumId !== forumId) return false
    if (!searchCode.trim()) return true
    const q = searchCode.trim().toLowerCase()
    return c.code.toLowerCase().includes(q) || c.creatorNickname.toLowerCase().includes(q) || c.forumName.toLowerCase().includes(q)
  })

  const filteredRecords = rebateRecords.filter((r) => {
    if (forumId) {
      const code = rebateCodes.find((c) => c.code === r.code)
      if (!code || code.forumId !== forumId) return false
    }
    if (!searchRecordUser.trim()) return true
    const q = searchRecordUser.trim().toLowerCase()
    return (
      r.creatorNickname.toLowerCase().includes(q) ||
      r.code.toLowerCase().includes(q) ||
      r.forumName.toLowerCase().includes(q)
    )
  })

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    messageApi.success('已复制返利码')
  }

  const handleCreate = () => {
    form.validateFields().then((values) => {
      const creator = MOCK_CREATORS.find((c) => c.id === values.creatorId)
      const forum = FORUM_OPTIONS.find((f) => f.id === values.forumId)
      if (!creator || !forum) return
      const nextId = String(Math.max(...rebateCodes.map((c) => parseInt(c.id, 10) || 0), 0) + 1)
      const code = `CREATOR${creator.id.padStart(3, '0')}`
      const hasCodeForForum = rebateCodes.some((c) => c.creatorId === creator.id && c.forumId === forum.id)
      const newCode = hasCodeForForum ? `${code}_${forum.id.toUpperCase()}` : code
      const item: RebateCode = {
        id: nextId,
        code: newCode,
        creatorId: creator.id,
        creatorNickname: creator.nickname,
        forumId: forum.id,
        forumName: forum.name,
        rate: values.rate,
        useCount: 0,
        totalRebate: 0,
        status: 'active',
        createdAt: new Date().toISOString().slice(0, 10),
      }
      setRebateCodes((prev) => [...prev, item])
      setCreateModalOpen(false)
      form.resetFields()
      messageApi.success('返利码创建成功')
    })
  }

  const columns: ColumnsType<RebateCode> = [
    { title: '返利码', dataIndex: 'code', key: 'code', width: 140, render: (v: string) => <code style={{ fontSize: 12 }}>{v}</code> },
    { title: '关联创作者', dataIndex: 'creatorNickname', key: 'creatorNickname', width: 140 },
    { title: '关联论坛', dataIndex: 'forumName', key: 'forumName', width: 110 },
    { title: '返利比例', dataIndex: 'rate', key: 'rate', width: 90, render: (v: number) => `${v}%` },
    { title: '使用次数', dataIndex: 'useCount', key: 'useCount', width: 90 },
    {
      title: '累计返利',
      dataIndex: 'totalRebate',
      key: 'totalRebate',
      width: 100,
      render: (v: number) => `¥${typeof v === 'number' ? v.toFixed(2) : '0.00'}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (v: string) => (v === 'active' ? <Tag color="green">有效</Tag> : <Tag>已停用</Tag>),
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 110 },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" icon={<Copy size={14} />} onClick={() => copyCode(record.code)}>
          复制
        </Button>
      ),
    },
  ]

  const recordColumns: ColumnsType<RebateRecord> = [
    { title: '返利码', dataIndex: 'code', key: 'code', width: 120 },
    { title: '关联创作者', dataIndex: 'creatorNickname', key: 'creatorNickname', width: 120 },
    { title: '关联论坛', dataIndex: 'forumName', key: 'forumName', width: 110 },
    { title: '返利金额', dataIndex: 'amount', key: 'amount', width: 100, render: (v: number) => `¥${v.toFixed(2)}` },
    { title: '关联订单', dataIndex: 'orderId', key: 'orderId', width: 160 },
    { title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
  ]

  return (
    <>
      {contextHolder}
      <PageBreadcrumb items={[{ label: '创作者管理', href: '/creator/creators' }, { label: '返利管理' }]} />
      <div style={{ background: '#fff', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Gift size={18} style={{ color: '#1677FF' }} />
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>返利码列表</h2>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索创作者昵称或返利码"
            prefix={<Search size={14} />}
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            style={{ width: 220 }}
            allowClear
          />
          <Button type="primary" icon={<Plus size={14} />} onClick={() => setCreateModalOpen(true)}>
            创建返利码
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={filteredCodes}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        />
      </div>

      <div style={{ background: '#fff', borderRadius: 8, padding: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>返利记录</h2>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索创作者昵称或返利码"
            prefix={<Search size={14} />}
            value={searchRecordUser}
            onChange={(e) => setSearchRecordUser(e.target.value)}
            style={{ width: 220 }}
            allowClear
          />
        </div>
        <Table
          columns={recordColumns}
          dataSource={filteredRecords}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        />
      </div>

      <Modal
        title="创建返利码"
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => { setCreateModalOpen(false); form.resetFields() }}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="creatorId"
            label="关联创作者"
            rules={[{ required: true, message: '请选择创作者' }]}
          >
            <Select
              placeholder="请选择创作者"
              options={MOCK_CREATORS.map((c) => ({ label: `${c.nickname} (ID: ${c.id})`, value: c.id }))}
              showSearch
              filterOption={(input, opt) =>
                (opt?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item
            name="forumId"
            label="关联论坛"
            rules={[{ required: true, message: '请选择关联论坛' }]}
          >
            <Select placeholder="请选择关联论坛" options={FORUM_OPTIONS.map((f) => ({ label: f.name, value: f.id }))} />
          </Form.Item>
          <Form.Item
            name="rate"
            label="返利比例"
            rules={[{ required: true, message: '请选择返利比例' }]}
          >
            <Select placeholder="请选择返利比例" options={RATE_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
