'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Table, Button, Tag, Input, Modal, Form, Popconfirm, message, Space, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FileText, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { CollectionPageData } from '../types'
import { useCollectionPages } from '../context/CollectionPagesContext'
import PageBreadcrumb from '../components/PageBreadcrumb'
import ForumSelectRequired from '../components/ForumSelectRequired'

function InlineNameEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const confirm = () => { onChange(draft); setEditing(false) }
  const cancel = () => { setDraft(value); setEditing(false) }

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={(e) => e.stopPropagation()}>
        <Input
          size="small"
          value={draft}
          autoFocus
          style={{ width: 180, borderRadius: 4 }}
          onChange={(e) => setDraft(e.target.value)}
          onPressEnter={confirm}
          onKeyDown={(e) => e.key === 'Escape' && cancel()}
        />
        <Button type="primary" size="small" style={{ fontSize: 12, padding: '0 8px', height: 24 }} onClick={confirm}>确认</Button>
        <Button size="small" style={{ fontSize: 12, padding: '0 8px', height: 24 }} onClick={cancel}>取消</Button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontWeight: 500, fontSize: 13, color: '#1F2937' }}>{value}</span>
      <Tooltip title="修改名称">
        <Pencil
          size={12}
          color="#C0C8D0"
          style={{ cursor: 'pointer', flexShrink: 0 }}
          onClick={(e) => { e.stopPropagation(); setDraft(value); setEditing(true) }}
        />
      </Tooltip>
    </div>
  )
}

export default function CollectionPagesPage() {
  const router = useRouter()
  const { pages, addPage, deletePage, updatePageName } = useCollectionPages()
  const [createOpen, setCreateOpen] = useState(false)
  const [searchName, setSearchName] = useState('')
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  const filteredPages = searchName.trim()
    ? pages.filter((p) => p.name.toLowerCase().includes(searchName.trim().toLowerCase()))
    : pages

  const genLink = () => {
    const maxN = pages.reduce((max, p) => {
      const m = p.link.match(/^\/collection\/(\d+)$/)
      return m ? Math.max(max, parseInt(m[1])) : max
    }, 0)
    return `/collection/${maxN + 1}`
  }

  const handleCreate = async () => {
    const values = await form.validateFields()
    const id = `cp-${Date.now()}`
    addPage({
      id,
      name: values.name,
      link: genLink(),
      articles: [],
    })
    messageApi.success('集合页已创建')
    setCreateOpen(false)
    form.resetFields()
  }

  const columns: ColumnsType<CollectionPageData> = [
    {
      title: '集合页名称',
      key: 'name',
      width: 220,
      onCell: () => ({ style: { paddingLeft: 20 } }),
      onHeaderCell: () => ({ style: { paddingLeft: 20 } }),
      render: (_, record) => (
        <InlineNameEditor
          value={record.name}
          onChange={(v) => updatePageName(record.id, v)}
        />
      ),
    },
    {
      title: '链接',
      dataIndex: 'link',
      key: 'link',
      width: 260,
      render: (link: string) =>
        link ? (
          <a href={link} target="_blank" rel="noreferrer"
            style={{ fontSize: 12, color: '#1677FF' }}
            onClick={(e) => e.stopPropagation()}
          >
            {link}
          </a>
        ) : (
          <span style={{ fontSize: 12, color: '#C0C8D0' }}>未设置</span>
        ),
    },
    {
      title: '帖子数',
      key: 'articles',
      width: 100,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <FileText size={13} color="#9CA3AF" />
          <span style={{ fontSize: 13, color: '#374151' }}>{record.articles.length}</span>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      align: 'left',
      render: (_, record) => (
        <Space size={12}>
          <Button
            type="link"
            size="small"
            style={{ fontSize: 12, padding: 0 }}
            onClick={(e) => { e.stopPropagation(); router.push(`/collection-pages/${record.id}`) }}
          >
            管理帖子
          </Button>
          <Popconfirm
            title={`确认删除「${record.name}」？`}
            description="删除后数据不可恢复"
            onConfirm={() => { deletePage(record.id); messageApi.success('已删除') }}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              size="small"
              icon={<Trash2 size={13} color="#EF4444" />}
              onClick={(e) => e.stopPropagation()}
              style={{ padding: '0 4px' }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {contextHolder}

      <PageBreadcrumb items={[{ label: '论坛管理', href: '/forum/list' }, { label: '集合页管理' }]} />

      <ForumSelectRequired>
      <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 15, fontWeight: 600, color: '#1F2937', margin: 0 }}>集合页管理</h1>
              <Tag style={{ background: '#E6F4FF', color: '#1677FF', border: 'none', borderRadius: 10, fontSize: 11 }}>
                {pages.length} 个
              </Tag>
            </div>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>管理各集合页内的帖子及封面图</p>
          </div>
          <Button
            type="primary"
            icon={<Plus size={14} />}
            style={{ borderRadius: 4, height: 32, fontSize: 13, fontWeight: 500 }}
            onClick={() => setCreateOpen(true)}
          >
            新建集合页
          </Button>
        </div>

        <div style={{ padding: '12px 20px', borderBottom: '1px solid #F3F4F6' }}>
          <Input
            placeholder="搜索集合页名称"
            prefix={<Search size={14} color="#9CA3AF" />}
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            allowClear
            style={{ width: 240, borderRadius: 6 }}
          />
        </div>

        <Table
          dataSource={filteredPages}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 20, showTotal: (total) => `共 ${total} 个`, showSizeChanger: true }}
          size="middle"
        />
      </div>

      {/* 新建弹窗 */}
      <Modal
        title="新建集合页"
        open={createOpen}
        forceRender
        onCancel={() => { setCreateOpen(false); form.resetFields() }}
        onOk={handleCreate}
        okText="创建"
        cancelText="取消"
        width={440}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="集合页名称"
            rules={[{ required: true, message: '请输入集合页名称' }]}
          >
            <Input placeholder="例如：武器攻略" autoFocus />
          </Form.Item>
          <div style={{ fontSize: 12, color: '#9CA3AF', background: '#F9FAFB', borderRadius: 6, padding: '8px 12px', border: '1px solid #E5E7EB' }}>
            链接将自动生成（格式：/collection/N），创建后在列表中可查看
          </div>
        </Form>
      </Modal>
      </ForumSelectRequired>
    </div>
  )
}
