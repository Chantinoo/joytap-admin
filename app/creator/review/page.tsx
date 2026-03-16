'use client'

import React, { useState } from 'react'
import { Table, Button, Tag, Select, Space, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Check, X, UserPlus } from 'lucide-react'
import PageBreadcrumb from '../../components/PageBreadcrumb'

// Mock 待审校内容
const MOCK_REVIEW_ITEMS = [
  { id: '1', title: 'ROX 新手入门攻略', creator: '攻略达人小明', lang: 'en', status: 'pending', assignee: null },
  { id: '2', title: '波利卡片掉落指南', creator: 'ROX 攻略组', lang: 'ja', status: 'in_progress', assignee: '审校员A' },
  { id: '3', title: '职业转职流程详解', creator: '游戏解说阿杰', lang: 'en', status: 'pending', assignee: null },
]

export default function ReviewPage() {
  const [items, setItems] = useState(MOCK_REVIEW_ITEMS)
  const [messageApi, contextHolder] = message.useMessage()

  const approve = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'approved' as const } : i)))
    messageApi.success('已通过')
  }

  const reject = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'rejected' as const } : i)))
    messageApi.info('已驳回')
  }

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待审校' },
    in_progress: { color: 'blue', text: '审校中' },
    approved: { color: 'green', text: '已通过' },
    rejected: { color: 'red', text: '已驳回' },
  }

  const columns: ColumnsType<(typeof MOCK_REVIEW_ITEMS)[0]> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '标题', dataIndex: 'title', key: 'title', width: 220 },
    { title: '创作者', dataIndex: 'creator', key: 'creator', width: 120 },
    {
      title: '目标语言',
      dataIndex: 'lang',
      key: 'lang',
      width: 90,
      render: (l: string) => (l === 'en' ? '英文' : l === 'ja' ? '日文' : l),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text ?? s}</Tag>,
    },
    { title: '审校员', dataIndex: 'assignee', key: 'assignee', width: 100, render: (v) => v ?? '-' },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) =>
        record.status === 'pending' || record.status === 'in_progress' ? (
          <Space>
            <Button
              type="link"
              size="small"
              icon={<UserPlus size={14} />}
              onClick={() => messageApi.info('分配审校员')}
            >
              分配
            </Button>
            <Button type="link" size="small" icon={<Check size={14} />} onClick={() => approve(record.id)}>
              通过
            </Button>
            <Button type="link" size="small" danger icon={<X size={14} />} onClick={() => reject(record.id)}>
              驳回
            </Button>
          </Space>
        ) : null,
    },
  ]

  return (
    <>
      {contextHolder}
      <PageBreadcrumb items={[{ label: '创作者管理', href: '/creator/creators' }, { label: '多语言审校管理' }]} />
      <div style={{ background: '#fff', borderRadius: 8, padding: 20 }}>
        <div style={{ marginBottom: 16, color: '#6B7280', fontSize: 13 }}>
          管理待审校的多语言内容，支持分配审校员、通过/驳回。翻译工具配置可在平台设置中配置。
        </div>
        <Table
          columns={columns}
          dataSource={items}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        />
      </div>
    </>
  )
}
