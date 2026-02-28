'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Breadcrumb,
  Switch,
  Tooltip,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  Plus,
  Pencil,
  Trash2,
  Home,
  LayoutGrid,
  AlertCircle,
  Lock,
  GripVertical,
} from 'lucide-react'
import { TabRoute, TabType, TAB_TYPE_CONFIG } from '../types'
import { initialTabRoutes } from '../data/mockData'
import dayjs from 'dayjs'

export default function TabRoutePage() {
  const [tabRoutes, setTabRoutes] = useState<TabRoute[]>(initialTabRoutes)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTab, setEditingTab] = useState<TabRoute | null>(null)
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()
  const router = useRouter()

  const dragItemId = useRef<string | null>(null)
  const dragOverId = useRef<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const handleDragStart = useCallback((id: string) => {
    dragItemId.current = id
    setDraggingId(id)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault()
    dragOverId.current = id
  }, [])

  const handleDragEnd = useCallback(() => {
    const fromId = dragItemId.current
    const toId = dragOverId.current
    setDraggingId(null)

    if (!fromId || !toId || fromId === toId) return

    setTabRoutes((prev) => {
      const items = [...prev]
      const draggable = items.filter((t) => !t.isFixed)
      const fromIdx = draggable.findIndex((t) => t.id === fromId)
      const toIdx = draggable.findIndex((t) => t.id === toId)
      if (fromIdx === -1 || toIdx === -1) return prev

      const [moved] = draggable.splice(fromIdx, 1)
      draggable.splice(toIdx, 0, moved)

      const reordered = draggable.map((t, i) => ({ ...t, sortOrder: i + 1 }))
      return [items.find((t) => t.isFixed)!, ...reordered]
    })

    dragItemId.current = null
    dragOverId.current = null
  }, [])

  const handleAdd = () => {
    setEditingTab(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleEdit = (record: TabRoute) => {
    router.push(`/tab-route/${record.id}`)
  }

  const handleDelete = (id: string) => {
    setTabRoutes((prev) => {
      const filtered = prev.filter((t) => t.id !== id)
      const fixed = filtered.filter((t) => t.isFixed)
      const rest = filtered.filter((t) => !t.isFixed).map((t, i) => ({ ...t, sortOrder: i + 1 }))
      return [...fixed, ...rest]
    })
    messageApi.success('Tab deleted successfully')
  }

  const handleStatusToggle = (id: string, checked: boolean) => {
    setTabRoutes((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: checked ? 'active' as const : 'draft' as const, updatedAt: dayjs().format('YYYY-MM-DD') }
          : t
      )
    )
    messageApi.success(`Tab ${checked ? 'activated' : 'deactivated'}`)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const now = dayjs().format('YYYY-MM-DD')
      const typeConfig = TAB_TYPE_CONFIG[values.type as TabType]

      if (editingTab) {
        setTabRoutes((prev) =>
          prev.map((t) =>
            t.id === editingTab.id
              ? { ...t, name: values.name || typeConfig.label, type: values.type, updatedAt: now }
              : t
          )
        )
        messageApi.success('Tab updated successfully')
      } else {
        const maxSort = Math.max(...tabRoutes.map((t) => t.sortOrder))
        const newTab: TabRoute = {
          id: String(Date.now()),
          name: values.name || typeConfig.label,
          type: values.type,
          status: 'draft',
          sortOrder: maxSort + 1,
          isFixed: false,
          createdAt: now,
          updatedAt: now,
        }
        setTabRoutes((prev) => [...prev, newTab])
        messageApi.success('Tab created successfully')
      }
      setModalOpen(false)
    } catch {
      // validation failed
    }
  }

  const columns: ColumnsType<TabRoute> = [
    {
      title: '',
      key: 'drag',
      width: 40,
      render: (_: unknown, record: TabRoute) =>
        record.isFixed ? (
          <Lock size={14} color="#D1D5DB" />
        ) : (
          <GripVertical
            size={16}
            color={draggingId === record.id ? '#4F46E5' : '#9CA3AF'}
            style={{ cursor: 'grab' }}
          />
        ),
    },
    {
      title: '#',
      key: 'order',
      width: 40,
      render: (_: unknown, record: TabRoute) =>
        record.isFixed ? (
          <span style={{ color: '#D1D5DB', fontSize: 13 }}>—</span>
        ) : (
          <span style={{ color: '#9CA3AF', fontSize: 13 }}>{record.sortOrder}</span>
        ),
    },
    {
      title: 'Tab Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: TabRoute) => (
        <span
          style={{
            fontWeight: 500,
            color: record.isFixed ? '#9CA3AF' : '#111827',
            fontSize: 14,
          }}
        >
          {name}
        </span>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        if (type === 'default') {
          return <span style={{ color: '#D1D5DB', fontSize: 12 }}>—</span>
        }
        const config = TAB_TYPE_CONFIG[type as TabType]
        return config ? (
          <Tag
            style={{
              background: config.bg,
              color: config.color,
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {config.label}
          </Tag>
        ) : null
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string, record: TabRoute) => {
        if (record.isFixed) {
          return (
            <Tag style={{ borderRadius: 12, fontSize: 12, color: '#9CA3AF', background: '#F3F4F6', border: 'none' }}>
              Always On
            </Tag>
          )
        }
        return (
          <Space size={8}>
            <Switch
              size="small"
              checked={status === 'active'}
              onChange={(checked) => handleStatusToggle(record.id, checked)}
            />
            <Tag
              color={status === 'active' ? 'success' : 'default'}
              style={{ borderRadius: 12, fontSize: 12 }}
            >
              {status === 'active' ? 'Active' : 'Draft'}
            </Tag>
          </Space>
        )
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => (
        <span style={{ color: '#6B7280', fontSize: 12 }}>{date}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'right',
      render: (_: unknown, record: TabRoute) => {
        if (record.isFixed) {
          return <span style={{ color: '#D1D5DB', fontSize: 12 }}>—</span>
        }
        return (
          <Space size={4}>
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<Pencil size={15} color="#6B7280" />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
            <Popconfirm
              title="Delete this tab?"
              description={`Are you sure you want to delete "${record.name}"?`}
              onConfirm={() => handleDelete(record.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              icon={<AlertCircle size={16} color="#EF4444" />}
            >
              <Tooltip title="Delete">
                <Button
                  type="text"
                  size="small"
                  icon={<Trash2 size={15} color="#EF4444" />}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {contextHolder}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Breadcrumb
            items={[
              { title: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Home size={14} /> Home</span> },
              { title: 'Tab Route' },
            ]}
          />
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
            Tab Route
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
            Manage navigation tabs for your game community pages
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={handleAdd}
          style={{ background: '#4F46E5', borderRadius: 8, height: 36, fontWeight: 500 }}
        >
          Add Tab
        </Button>
      </div>

      {/* Table Card */}
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LayoutGrid size={18} color="#4F46E5" />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Tab Route</span>
            <Tag
              style={{
                background: '#EEF2FF',
                color: '#4F46E5',
                border: 'none',
                borderRadius: 12,
                fontSize: 12,
              }}
            >
              {tabRoutes.length} tabs
            </Tag>
          </div>
        </div>
        <Table
          dataSource={tabRoutes}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="middle"
          rowClassName={(record) => (record.isFixed ? 'fixed-row' : '')}
          onRow={(record) =>
            record.isFixed
              ? {}
              : {
                  draggable: true,
                  onDragStart: () => handleDragStart(record.id),
                  onDragOver: (e: React.DragEvent) => handleDragOver(e, record.id),
                  onDragEnd: handleDragEnd,
                  style: {
                    opacity: draggingId === record.id ? 0.4 : 1,
                    cursor: 'grab',
                  },
                }
          }
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        title={editingTab ? 'Edit Tab' : 'Create New Tab'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={editingTab ? 'Save Changes' : 'Create Tab'}
        okButtonProps={{ style: { background: '#4F46E5', borderRadius: 8 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        width={480}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="type"
            label="Tab Type"
            rules={[{ required: true, message: 'Please select a tab type' }]}
          >
            <Select
              placeholder="Select tab type"
              style={{ borderRadius: 8 }}
              disabled={!!editingTab}
              options={Object.entries(TAB_TYPE_CONFIG).map(([key, config]) => ({
                value: key,
                label: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: config.color,
                      }}
                    />
                    {config.label}
                  </div>
                ),
              }))}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="Display Name (optional)"
            tooltip="Leave empty to use the default type name"
          >
            <Input placeholder="Custom display name" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Form>
      </Modal>

      <style jsx global>{`
        .fixed-row td {
          background: #F9FAFB !important;
        }
        .fixed-row {
          cursor: default !important;
        }
        tr[draggable="true"]:hover td {
          background: #F0F0FF !important;
        }
        tr[draggable="true"] {
          transition: opacity 0.15s ease;
        }
      `}</style>
    </div>
  )
}
