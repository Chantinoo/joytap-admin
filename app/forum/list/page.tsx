'use client'

import React, { useState } from 'react'
import {
  Table,
  Button,
  Select,
  Tag,
  message,
  Tooltip,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Languages, RefreshCw, Settings } from 'lucide-react'
import PageBreadcrumb from '../../components/PageBreadcrumb'

/** 论坛列表 mock 数据 */
interface ForumRecord {
  id: number
  name: string
  icon: string
  bgImage: string
  description: string
  appId: string
  appName: string
  status: 'enabled' | 'disabled'
  postCount: number
  createdAt: string
}

const MOCK_APPS = [
  { id: 'app1', name: 'Ragnarok Online: Wor...' },
  { id: 'app2', name: 'OneOne' },
]

const MOCK_FORUMS: ForumRecord[] = [
  { id: 6, name: 'Ragnarok X: Next Gen...', icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=rox', bgImage: 'https://api.dicebear.com/7.x/identicon/svg?seed=rox-bg', description: 'MMO', appId: 'app1', appName: 'Ragnarok Online: Wor...', status: 'enabled', postCount: 23, createdAt: '2026-03-06 12:13:09' },
  { id: 5, name: '永劫无间', icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=yjyj', bgImage: 'https://api.dicebear.com/7.x/identicon/svg?seed=yjyj-bg', description: 'MMORPG', appId: 'app1', appName: 'Ragnarok Online: Wor...', status: 'enabled', postCount: 8, createdAt: '2026-03-05 10:22:15' },
  { id: 4, name: '原神', icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=ys', bgImage: 'https://api.dicebear.com/7.x/identicon/svg?seed=ys-bg', description: 'MMO', appId: 'app2', appName: 'OneOne', status: 'enabled', postCount: 28, createdAt: '2026-03-04 09:11:33' },
  { id: 3, name: '王者荣耀', icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=wzry', bgImage: 'https://api.dicebear.com/7.x/identicon/svg?seed=wzry-bg', description: 'MOBA', appId: 'app2', appName: 'OneOne', status: 'enabled', postCount: 15, createdAt: '2026-03-03 14:05:22' },
  { id: 2, name: '和平精英', icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=hpjy', bgImage: 'https://api.dicebear.com/7.x/identicon/svg?seed=hpjy-bg', description: '射击', appId: 'app2', appName: 'OneOne', status: 'enabled', postCount: 12, createdAt: '2026-03-02 11:30:00' },
]

export default function ForumListPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const [appFilter, setAppFilter] = useState<string | undefined>(undefined)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [forums] = useState<ForumRecord[]>(MOCK_FORUMS)

  const handleReset = () => {
    setAppFilter(undefined)
    setStatusFilter(undefined)
  }

  const handleQuery = () => {
    messageApi.info('查询')
  }

  const handleEdit = (record: ForumRecord) => {
    messageApi.info(`编辑：${record.name}`)
  }

  const columns: ColumnsType<ForumRecord> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (name: string) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{name}</span>
          <Tooltip title="多语言">
            <Languages size={14} style={{ color: '#1677FF', flexShrink: 0, cursor: 'pointer' }} />
          </Tooltip>
        </span>
      ),
    },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      width: 64,
      render: (url: string) => (
        <img src={url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
      ),
    },
    {
      title: '背景图',
      dataIndex: 'bgImage',
      key: 'bgImage',
      width: 100,
      render: (url: string) => (
        <img src={url} alt="" style={{ width: 80, height: 40, objectFit: 'cover', borderRadius: 6 }} />
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 100,
      render: (desc: string) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Tag style={{ margin: 0 }}>{desc}</Tag>
          <Tooltip title="多语言">
            <Languages size={14} style={{ color: '#1677FF', flexShrink: 0, cursor: 'pointer' }} />
          </Tooltip>
        </span>
      ),
    },
    {
      title: '应用',
      dataIndex: 'appName',
      key: 'app',
      width: 140,
      render: (_: unknown, record: ForumRecord) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <img src="https://api.dicebear.com/7.x/shapes/svg?seed=app" alt="" style={{ width: 20, height: 20, borderRadius: 4 }} />
          <span>{record.appName}</span>
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color="green" style={{ margin: 0 }}>{status === 'enabled' ? '开启' : '关闭'}</Tag>
      ),
    },
    { title: '帖子数量', dataIndex: 'postCount', key: 'postCount', width: 90 },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: ForumRecord) => (
        <Button type="link" size="small" style={{ padding: 0, fontSize: 13 }} onClick={() => handleEdit(record)}>
          编辑
        </Button>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {contextHolder}

      <PageBreadcrumb items={[{ label: '论坛资源', href: '/forum/list' }, { label: '论坛' }]} />

      {/* 筛选卡片 */}
      <div style={{
        background: '#fff',
        borderRadius: 6,
        border: '1px solid #E5E7EB',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#374151', flexShrink: 0 }}>应用：</span>
          <Select
            placeholder="请选择应用"
            allowClear
            value={appFilter}
            onChange={setAppFilter}
            style={{ width: 180 }}
            size="middle"
            options={MOCK_APPS.map((a) => ({ label: a.name, value: a.id }))}
          />
          <span style={{ fontSize: 13, color: '#374151', flexShrink: 0, marginLeft: 8 }}>状态：</span>
          <Select
            placeholder="请选择状态"
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 140 }}
            size="middle"
            options={[
              { label: '开启', value: 'enabled' },
              { label: '关闭', value: 'disabled' },
            ]}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button onClick={handleReset}>重置</Button>
          <Button type="primary" onClick={handleQuery}>查询</Button>
        </div>
      </div>

      {/* 论坛列表卡片 */}
      <div style={{
        background: '#fff',
        borderRadius: 6,
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 3, height: 14, background: '#1677FF', borderRadius: 2, display: 'inline-block' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>论坛</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tooltip title="刷新">
              <Button type="text" size="small" icon={<RefreshCw size={14} />} />
            </Tooltip>
            <Tooltip title="设置">
              <Button type="text" size="small" icon={<Settings size={14} />} />
            </Tooltip>
          </div>
        </div>
        <Table
          dataSource={forums}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `第 1-${Math.min(total, 10)} 条 / 总共 ${total} 条`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            locale: { items_per_page: '条/页' },
          }}
          size="middle"
        />
      </div>
    </div>
  )
}
