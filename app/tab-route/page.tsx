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
  message,
  Popconfirm,
  Switch,
  Tooltip,
  Select,
  Popover,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Lock,
  GripVertical,
  MinusCircle,
} from 'lucide-react'
import {
  TabRoute,
  TAB_PARTITION_LAYOUT_CONFIG,
  tabRouteHasSecondaryTabs,
  type TabPartitionLayoutType,
} from '../types'
import { initialTabRoutes } from '../data/mockData'
import PageBreadcrumb from '../components/PageBreadcrumb'
import ForumSelectRequired from '../components/ForumSelectRequired'
import dayjs from 'dayjs'

const LAYOUT_SELECT_OPTIONS = (Object.keys(TAB_PARTITION_LAYOUT_CONFIG) as TabPartitionLayoutType[]).map((k) => ({
  value: k,
  label: TAB_PARTITION_LAYOUT_CONFIG[k].label,
}))

function InlineNameEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const confirm = () => { onChange(draft); setEditing(false) }
  const cancel = () => { setDraft(value); setEditing(false) }

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Input
          size="small"
          value={draft}
          autoFocus
          style={{ width: 160, borderRadius: 4 }}
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
      <span style={{ fontWeight: 500, color: '#1F2937', fontSize: 13 }}>{value}</span>
      <Tooltip title="修改名称">
        <Button
          type="text" size="small"
          icon={<Pencil size={12} color="#C0C8D0" />}
          style={{ padding: '0 2px', height: 20 }}
          onClick={() => { setDraft(value); setEditing(true) }}
        />
      </Tooltip>
    </div>
  )
}

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
    form.setFieldsValue({
      name: '',
      useSecondaryTabs: false,
      layoutType: 'feeds',
      subTabs: [],
    })
    setModalOpen(true)
  }

  const openEditPartition = (record: TabRoute) => {
    setEditingTab(record)
    const hasSub = tabRouteHasSecondaryTabs(record)
    form.setFieldsValue({
      name: record.name,
      useSecondaryTabs: hasSub,
      layoutType: record.layoutType ?? 'feeds',
      subTabs: hasSub
        ? [...record.subTabs!].sort((a, b) => a.sortOrder - b.sortOrder).map((s) => ({ ...s }))
        : [],
    })
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
    messageApi.success('分区已删除')
  }

  const handleStatusToggle = (id: string, checked: boolean) => {
    setTabRoutes((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: checked ? 'active' as const : 'draft' as const, updatedAt: dayjs().format('YYYY-MM-DD') }
          : t
      )
    )
    messageApi.success(`已${checked ? '启用' : '禁用'}`)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const now = dayjs().format('YYYY-MM-DD')
      const useSecondary = !!values.useSecondaryTabs

      let nextSubTabs: TabRoute['subTabs']
      let nextLayout: TabPartitionLayoutType | undefined

      if (useSecondary) {
        const raw = (values.subTabs ?? []) as { id?: string; name?: string; layoutType?: TabPartitionLayoutType }[]
        const rows = raw.filter((r) => (r.name ?? '').trim())
        if (rows.length === 0) {
          messageApi.error('启用二级 Tab 时请至少添加一行并填写名称')
          return
        }
        nextSubTabs = rows.map((r, i) => ({
          id: (r.id && String(r.id).trim()) || `sub-${Date.now()}-${i}`,
          name: r.name!.trim(),
          layoutType: (r.layoutType ?? 'feeds') as TabPartitionLayoutType,
          sortOrder: i + 1,
        }))
        nextLayout = undefined
      } else {
        nextSubTabs = undefined
        nextLayout = (values.layoutType ?? 'feeds') as TabPartitionLayoutType
      }

      if (editingTab) {
        setTabRoutes((prev) =>
          prev.map((t) => {
            if (t.id !== editingTab.id) return t
            if (useSecondary) {
              return {
                ...t,
                name: values.name,
                subTabs: nextSubTabs,
                layoutType: undefined,
                updatedAt: now,
              }
            }
            return {
              ...t,
              name: values.name,
              layoutType: nextLayout,
              subTabs: undefined,
              updatedAt: now,
            }
          }),
        )
        messageApi.success('分区已更新')
      } else {
        const maxSort = Math.max(...tabRoutes.map((t) => t.sortOrder))
        const base: TabRoute = {
          id: String(Date.now()),
          name: values.name,
          type: 'guides',
          status: 'draft',
          sortOrder: maxSort + 1,
          isFixed: false,
          createdAt: now,
          updatedAt: now,
        }
        const newTab: TabRoute = useSecondary
          ? { ...base, subTabs: nextSubTabs }
          : { ...base, layoutType: nextLayout }
        setTabRoutes((prev) => [...prev, newTab])
        messageApi.success('分区已创建')
      }
      setModalOpen(false)
      setEditingTab(null)
    } catch {
      // 表单验证失败
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
      title: '序号',
      key: 'order',
      width: 60,
      render: (_: unknown, record: TabRoute) =>
        record.isFixed ? (
          <span style={{ color: '#D1D5DB', fontSize: 13 }}>—</span>
        ) : (
          <span style={{ color: '#9CA3AF', fontSize: 13 }}>{record.sortOrder}</span>
        ),
    },
    {
      title: '分区名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, record: TabRoute) => {
        if (record.isFixed) {
          return <span style={{ fontWeight: 500, color: '#9CA3AF', fontSize: 13 }}>{name}</span>
        }
        return (
          <InlineNameEditor
            value={name}
            onChange={(v) => setTabRoutes((prev) =>
              prev.map((t) => t.id === record.id ? { ...t, name: v, updatedAt: dayjs().format('YYYY-MM-DD') } : t)
            )}
          />
        )
      },
    },
    {
      title: '分区类型',
      key: 'layoutType',
      width: 188,
      render: (_: unknown, record: TabRoute) => {
        if (record.isFixed) {
          const v = record.layoutType ?? 'feeds'
          return (
            <Tooltip title={TAB_PARTITION_LAYOUT_CONFIG[v].hint}>
              <Tag style={{ margin: 0, fontSize: 12, color: '#6B7280', background: '#F3F4F6', border: 'none', borderRadius: 6 }}>
                {TAB_PARTITION_LAYOUT_CONFIG[v].label}
              </Tag>
            </Tooltip>
          )
        }
        if (tabRouteHasSecondaryTabs(record)) {
          const sorted = [...record.subTabs!].sort((a, b) => a.sortOrder - b.sortOrder)
          const popover = (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 260 }}>
              <div style={{ fontSize: 12, color: '#6B7280' }}>一级分区不配置类型；以下为各二级 Tab 的展示形态</div>
              {sorted.map((st) => (
                <div key={st.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: 13, color: '#374151', flex: '1 1 auto' }}>{st.name}</span>
                  <Select
                    size="small"
                    style={{ width: 118 }}
                    value={st.layoutType}
                    options={LAYOUT_SELECT_OPTIONS}
                    onChange={(layoutType: TabPartitionLayoutType) => {
                      setTabRoutes((prev) =>
                        prev.map((t) => {
                          if (t.id !== record.id || !t.subTabs) return t
                          return {
                            ...t,
                            subTabs: t.subTabs.map((s) => (s.id === st.id ? { ...s, layoutType } : s)),
                            updatedAt: dayjs().format('YYYY-MM-DD'),
                          }
                        }),
                      )
                      messageApi.success('已更新')
                    }}
                  />
                </div>
              ))}
            </div>
          )
          return (
            <Popover title="二级 Tab · 分区类型" content={popover} trigger="click" placement="bottomLeft">
              <Tag
                color="blue"
                style={{ margin: 0, fontSize: 12, borderRadius: 6, cursor: 'pointer' }}
              >
                二级 {sorted.length} 项 · 点击配置
              </Tag>
            </Popover>
          )
        }
        const v = record.layoutType ?? 'feeds'
        return (
          <Tooltip title={TAB_PARTITION_LAYOUT_CONFIG[v].hint}>
            <Select
              size="small"
              value={v}
              bordered={false}
              style={{ width: 148 }}
              popupMatchSelectWidth={false}
              options={LAYOUT_SELECT_OPTIONS}
              onChange={(layoutType: TabPartitionLayoutType) => {
                setTabRoutes((prev) =>
                  prev.map((t) =>
                    t.id === record.id
                      ? { ...t, layoutType, updatedAt: dayjs().format('YYYY-MM-DD') }
                      : t
                  )
                )
                messageApi.success('分区类型已更新')
              }}
            />
          </Tooltip>
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string, record: TabRoute) => {
        if (record.isFixed) {
          return (
            <Tag style={{ borderRadius: 10, fontSize: 12, color: '#9CA3AF', background: '#F3F4F6', border: 'none' }}>
              固定项
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
              style={{ borderRadius: 10, fontSize: 12 }}
            >
              {status === 'active' ? '已启用' : '未启用'}
            </Tag>
          </Space>
        )
      },
    },
    {
      title: '操作人',
      key: 'operator',
      width: 100,
      render: (_: unknown, record: TabRoute) => (
        <span style={{ color: '#6B7280', fontSize: 12 }}>
          {record.isFixed ? '—' : 'Admin'}
        </span>
      ),
    },
    {
      title: '操作时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: (date: string, record: TabRoute) => (
        <span style={{ color: '#6B7280', fontSize: 12 }}>
          {record.isFixed ? '—' : date}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      align: 'center',
      render: (_: unknown, record: TabRoute) => {
        if (record.isFixed) {
          return <span style={{ color: '#D1D5DB', fontSize: 12 }}>—</span>
        }
        return (
          <Space size={8} wrap>
            <Tooltip title="名称、二级 Tab 与分区类型">
              <Button
                type="link"
                size="small"
                style={{ fontSize: 12, padding: 0 }}
                onClick={() => openEditPartition(record)}
              >
                编辑分区
              </Button>
            </Tooltip>
            <Tooltip title="进入配置集合页与模块顺序">
              <Button
                type="link"
                size="small"
                style={{ fontSize: 12, padding: 0 }}
                onClick={() => handleEdit(record)}
              >
                管理内容
              </Button>
            </Tooltip>
            <Popconfirm
              title="确认删除该分区？"
              description={`确定要删除「${record.name}」吗？`}
              onConfirm={() => handleDelete(record.id)}
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              icon={<AlertCircle size={16} color="#EF4444" />}
            >
              <Tooltip title="删除">
                <Button
                  type="text"
                  size="small"
                  icon={<Trash2 size={14} color="#EF4444" />}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {contextHolder}

      <PageBreadcrumb items={[{ label: '论坛管理', href: '/forum/list' }, { label: '分区管理' }]} />

      <ForumSelectRequired>
      {/* 页面标题区 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fff',
        borderRadius: 6,
        padding: '14px 20px',
        border: '1px solid #E5E7EB',
      }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: '#1F2937', margin: 0 }}>
            分区管理
          </h1>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 0 0' }}>
            管理游戏社区的内容分区及其排序
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={14} />}
          onClick={handleAdd}
          style={{ borderRadius: 4, height: 32, fontSize: 13, fontWeight: 500 }}
        >
          新建
        </Button>
      </div>

      {/* 列表卡片 */}
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
          gap: 8,
        }}>
          <span style={{ width: 3, height: 14, background: '#1677FF', borderRadius: 2, display: 'inline-block' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>列表</span>
          <Tag style={{ background: '#E6F4FF', color: '#1677FF', border: 'none', borderRadius: 10, fontSize: 11, marginLeft: 2 }}>
            {tabRoutes.length} 条
          </Tag>
        </div>
        <Table
          dataSource={tabRoutes}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 20, showTotal: (total) => `共 ${total} 条`, showSizeChanger: true }}
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

      {/* 新建 / 编辑弹窗 */}
      <Modal
        title={editingTab ? '编辑分区' : '新建分区'}
        open={modalOpen}
        forceRender
        onCancel={() => {
          setModalOpen(false)
          setEditingTab(null)
        }}
        onOk={handleSubmit}
        okText={editingTab ? '保存' : '创建'}
        cancelText="取消"
        width={600}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} initialValues={{ layoutType: 'feeds', useSecondaryTabs: false, subTabs: [] }}>
          <Form.Item
            name="name"
            label="分区名称"
            rules={[{ required: true, message: '请输入分区名称' }]}
          >
            <Input placeholder="例如：攻略、官方、交流" autoFocus />
          </Form.Item>

          <Form.Item
            name="useSecondaryTabs"
            label="启用二级 Tab"
            valuePropName="checked"
            tooltip="开启后，一级分区不再配置「分区类型」；需为每个二级 Tab 单独选择 Feeds 流或卡片网格（适合官方下「综合/资讯/活动」等结构）"
          >
            <Switch
              checkedChildren="开"
              unCheckedChildren="关"
              onChange={(checked) => {
                if (checked) {
                  const cur = form.getFieldValue('subTabs') as unknown[] | undefined
                  if (!cur?.length) {
                    form.setFieldValue('subTabs', [{ id: `sub-${Date.now()}`, name: '', layoutType: 'feeds' }])
                  }
                }
              }}
            />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.useSecondaryTabs !== cur.useSecondaryTabs}>
            {({ getFieldValue }) =>
              getFieldValue('useSecondaryTabs') ? (
                <Form.List name="subTabs">
                  {(fields, { add, remove }) => (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>二级 Tab 列表（名称 + 分区类型）</div>
                      {fields.map(({ key, name: idx, ...restField }) => (
                        <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                          <Form.Item {...restField} name={[idx, 'id']} hidden>
                            <Input />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[idx, 'name']}
                            rules={[{ required: true, message: '请填写二级 Tab 名称' }]}
                            style={{ marginBottom: 0, flex: 1 }}
                          >
                            <Input placeholder="如：综合、资讯" style={{ width: 160 }} />
                          </Form.Item>
                          <Form.Item {...restField} name={[idx, 'layoutType']} style={{ marginBottom: 0 }}>
                            <Select style={{ width: 130 }} options={LAYOUT_SELECT_OPTIONS} />
                          </Form.Item>
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<MinusCircle size={16} />}
                            onClick={() => remove(idx)}
                            aria-label="删除该行"
                          />
                        </Space>
                      ))}
                      <Button type="dashed" onClick={() => add({ id: `sub-${Date.now()}`, name: '', layoutType: 'feeds' })} block>
                        + 添加二级 Tab
                      </Button>
                    </div>
                  )}
                </Form.List>
              ) : (
                <Form.Item
                  name="layoutType"
                  label="分区类型"
                  tooltip="无二级 Tab 时，由一级分区决定前台版式"
                  rules={[{ required: true, message: '请选择分区类型' }]}
                >
                  <Select placeholder="请选择" options={LAYOUT_SELECT_OPTIONS} />
                </Form.Item>
              )
            }
          </Form.Item>
        </Form>
      </Modal>
      </ForumSelectRequired>

      <style jsx global>{`
        .fixed-row td {
          background: #FAFAFA !important;
        }
        .fixed-row {
          cursor: default !important;
        }
        tr[draggable="true"]:hover td {
          background: #F0F5FF !important;
        }
        tr[draggable="true"] {
          transition: opacity 0.15s ease;
        }
      `}</style>
    </div>
  )
}
