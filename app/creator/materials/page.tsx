'use client'

import React, { useState } from 'react'
import { Table, Button, Input, Tag, Select, Space, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Search, Plus, Edit2, Languages } from 'lucide-react'
import PageBreadcrumb from '../../components/PageBreadcrumb'

// Mock 素材数据
const MOCK_MATERIALS = [
  { id: '1', name: '波利卡片', type: '卡片', source: 'Wiki', game: 'ROX', tags: ['怪物', '掉落'], translated: true },
  { id: '2', name: '笨拙短剑', type: '道具', source: 'Wiki', game: 'ROX', tags: ['武器', '新手'], translated: true },
  { id: '3', name: '白色药水', type: '道具', source: '抓取', game: 'ROX', tags: ['消耗品', '治疗'], translated: false },
  { id: '4', name: '艾斯帕', type: '怪物', source: 'Wiki', game: 'ROX', tags: ['MVP'], translated: true },
  { id: '5', name: '普隆德拉', type: '地图', source: '抓取', game: 'ROX', tags: ['主城'], translated: false },
]

export default function MaterialsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [messageApi, contextHolder] = message.useMessage()

  const filtered = MOCK_MATERIALS.filter((m) => {
    if (search.trim() && !m.name.toLowerCase().includes(search.trim().toLowerCase())) return false
    if (typeFilter && m.type !== typeFilter) return false
    return true
  })

  const columns: ColumnsType<(typeof MOCK_MATERIALS)[0]> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 140 },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: (t: string) => <Tag>{t}</Tag>,
    },
    { title: '来源', dataIndex: 'source', key: 'source', width: 90 },
    { title: '游戏', dataIndex: 'game', key: 'game', width: 90 },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => tags?.map((t) => <Tag key={t}>{t}</Tag>),
    },
    {
      title: '翻译',
      dataIndex: 'translated',
      key: 'translated',
      width: 80,
      render: (v: boolean) => (v ? <Tag color="green">已翻译</Tag> : <Tag>待翻译</Tag>),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<Edit2 size={14} />} onClick={() => messageApi.info('编辑打标')}>
            打标
          </Button>
          <Button type="link" size="small" icon={<Languages size={14} />} onClick={() => messageApi.info('翻译')}>
            翻译
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <>
      {contextHolder}
      <PageBreadcrumb items={[{ label: '创作者管理', href: '/creator/creators' }, { label: '素材库管理' }]} />
      <div style={{ background: '#fff', borderRadius: 8, padding: 20 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索素材名称"
            prefix={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="类型"
            allowClear
            style={{ width: 120 }}
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { label: '道具', value: '道具' },
              { label: '怪物', value: '怪物' },
              { label: '卡片', value: '卡片' },
              { label: '地图', value: '地图' },
            ]}
          />
          <Button type="primary" icon={<Plus size={14} />} onClick={() => messageApi.info('素材抓取功能开发中')}>
            素材抓取
          </Button>
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
