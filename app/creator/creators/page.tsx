'use client'

import React, { useState } from 'react'
import { Table, Input } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Search, Eye } from 'lucide-react'
import PageBreadcrumb from '../../components/PageBreadcrumb'

// Mock 数据（同一创作者可关联多个游戏，每条记录对应一个游戏）
const MOCK_CREATORS = [
  { id: '1', userId: '1', nickname: '攻略达人小明', gameName: '仙境传说3', certified: true, fans: 1250, manuscripts: 42, rebateAmount: 128.5, createdAt: '2025-01-15' },
  { id: '1-yjyj', userId: '1', nickname: '攻略达人小明', gameName: '永劫无间', certified: true, fans: 1250, manuscripts: 42, rebateAmount: 56.0, createdAt: '2025-02-10' },
  { id: '2', userId: '2', nickname: '游戏解说阿杰', gameName: '仙境传说3', certified: true, fans: 890, manuscripts: 28, rebateAmount: 56.0, createdAt: '2025-02-03' },
  { id: '3', userId: '3', nickname: '新手向攻略', gameName: '仙境传说3', certified: false, fans: 320, manuscripts: 15, rebateAmount: 0, createdAt: '2025-03-01' },
  { id: '4', userId: '4', nickname: 'ROX 攻略组', gameName: '仙境传说3', certified: true, fans: 2100, manuscripts: 68, rebateAmount: 320.8, createdAt: '2024-11-20' },
  { id: '5', userId: '5', nickname: '休闲玩家', gameName: '仙境传说3', certified: false, fans: 56, manuscripts: 3, rebateAmount: 0, createdAt: '2025-03-10' },
]

export default function CreatorListPage() {
  const [search, setSearch] = useState('')
  const [creators] = useState(MOCK_CREATORS)

  const filtered = creators.filter((c) => {
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    return c.nickname.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
  })

  const columns: ColumnsType<(typeof MOCK_CREATORS)[0]> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '昵称', dataIndex: 'nickname', key: 'nickname', width: 160 },
    { title: '关联论坛', dataIndex: 'gameName', key: 'gameName', width: 110 },
    { title: '粉丝数', dataIndex: 'fans', key: 'fans', width: 90 },
    { title: '稿件数', dataIndex: 'manuscripts', key: 'manuscripts', width: 90 },
    {
      title: '返利额',
      dataIndex: 'rebateAmount',
      key: 'rebateAmount',
      width: 100,
      render: (v: number) => `¥${typeof v === 'number' ? v.toFixed(2) : '0.00'}`,
    },
    { title: '认证时间', dataIndex: 'createdAt', key: 'createdAt', width: 120 },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <a
          href={`https://club.oneone.com/my?user_id=${record.userId ?? record.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#1677FF' }}
        >
          <Eye size={14} />
          查看
        </a>
      ),
    },
  ]

  return (
    <>
      <PageBreadcrumb items={[{ label: '创作者管理', href: '/creator/creators' }, { label: '认证创作者' }]} />
      <div style={{ background: '#fff', borderRadius: 8, padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索昵称或 ID"
            prefix={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 220 }}
            allowClear
          />
        </div>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        />
      </div>
    </>
  )
}
