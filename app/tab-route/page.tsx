'use client'

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react'
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
  Drawer,
  Popover,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  Plus,
  Trash2,
  AlertCircle,
  Lock,
  GripVertical,
  MinusCircle,
  Languages,
  HelpCircle,
} from 'lucide-react'
import {
  TabRoute,
  TAB_PARTITION_LAYOUT_CONFIG,
  tabRouteHasSecondaryTabs,
  OFFICIAL_POST_ONLY_TOOLTIP,
  type TabPartitionLayoutType,
} from '../types'
import { initialTabRoutes } from '../data/mockData'
import PageBreadcrumb from '../components/PageBreadcrumb'
import ForumSelectRequired from '../components/ForumSelectRequired'
import ActivityCardGoPostLink from '../components/ActivityCardGoPostLink'
import FieldI18nEditor from '../wiki/components/FieldI18nEditor'
import { LANGUAGES, type I18nLabels } from '../wiki/components/fieldI18nConstants'
import {
  mergeTabNameI18n,
  mergeSubTabNameI18n,
  pruneTabNameI18n,
  subTabPrimaryDisplayName,
  tabPrimaryDisplayName,
} from '../lib/tabRouteLocale'
import dayjs from 'dayjs'

const LAYOUT_SELECT_OPTIONS = (Object.keys(TAB_PARTITION_LAYOUT_CONFIG) as TabPartitionLayoutType[]).map((k) => ({
  value: k,
  label: TAB_PARTITION_LAYOUT_CONFIG[k].label,
}))

/** antd 6：Drawer 使用 `size`，勿使用已废弃的 `width` */
const PARTITION_NAME_I18N_DRAWER_PROPS = {
  placement: 'right' as const,
  size: 440,
  destroyOnHidden: true,
  zIndex: 1100,
  styles: { body: { paddingTop: 8 } as const },
}

type PartitionI18nDrawerTarget = null | { kind: 'partition' } | { kind: 'subTab'; index: number }

export default function TabRoutePage() {
  const [tabRoutes, setTabRoutes] = useState<TabRoute[]>(initialTabRoutes)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTab, setEditingTab] = useState<TabRoute | null>(null)
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()
  const router = useRouter()
  const [i18nDrawerTarget, setI18nDrawerTarget] = useState<PartitionI18nDrawerTarget>(null)

  /** Modal 使用 destroyOnHidden 时，Form 仅在 open 后挂载；须在此之后再 reset/setFields，否则会触发 useForm 未连接警告 */
  useEffect(() => {
    if (!modalOpen) return
    if (editingTab) {
      const hasSub = tabRouteHasSecondaryTabs(editingTab)
      form.setFieldsValue({
        partitionNameI18n: mergeTabNameI18n(editingTab),
        useSecondaryTabs: hasSub,
        layoutType: editingTab.layoutType ?? 'feeds',
        subTabs: hasSub
          ? [...editingTab.subTabs!].sort((a, b) => a.sortOrder - b.sortOrder).map((s) => ({
            id: s.id,
            layoutType: s.layoutType,
            nameI18n: mergeSubTabNameI18n(s),
          }))
          : [],
      })
    } else {
      form.resetFields()
      form.setFieldsValue({
        partitionNameI18n: { zh: '' },
        useSecondaryTabs: false,
        layoutType: 'feeds',
        subTabs: [],
      })
    }
  }, [modalOpen, editingTab, form])

  const drawerInitialI18n = useMemo((): I18nLabels => {
    if (!i18nDrawerTarget) return {}
    if (i18nDrawerTarget.kind === 'partition') {
      return { ...((form.getFieldValue('partitionNameI18n') as I18nLabels | undefined) ?? {}) }
    }
    return { ...((form.getFieldValue(['subTabs', i18nDrawerTarget.index, 'nameI18n']) as I18nLabels | undefined) ?? {}) }
  }, [i18nDrawerTarget, form])

  const closeI18nDrawer = useCallback(() => setI18nDrawerTarget(null), [])

  const applyPartitionI18n = useCallback(
    (next: I18nLabels) => {
      form.setFieldValue('partitionNameI18n', { ...next })
      messageApi.success('分区名称多语言已更新')
      setI18nDrawerTarget(null)
    },
    [form, messageApi],
  )

  const applySubTabI18n = useCallback(
    (index: number, next: I18nLabels) => {
      form.setFieldValue(['subTabs', index, 'nameI18n'], { ...next })
      messageApi.success('该二级 Tab 名称多语言已更新')
      setI18nDrawerTarget(null)
    },
    [form, messageApi],
  )

  const dragItemId = useRef<string | null>(null)
  const dragOverId = useRef<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  /** 编辑弹窗 Form.List：二级 Tab 行拖拽排序 */
  const subFormDrag = useRef<{ from: number | null; over: number | null }>({ from: null, over: null })

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
    setModalOpen(true)
  }

  const openEditPartition = (record: TabRoute) => {
    setEditingTab(record)
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

  const handlePrimaryOfficialToggle = (id: string, checked: boolean) => {
    setTabRoutes((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, officialPostOnly: checked, updatedAt: dayjs().format('YYYY-MM-DD') } : t,
      ),
    )
    messageApi.success(checked ? '已设为仅官方可发帖' : '已允许全体用户发帖')
  }

  const handleSubTabOfficialToggle = (tabId: string, subId: string, checked: boolean) => {
    setTabRoutes((prev) =>
      prev.map((t) => {
        if (t.id !== tabId || !t.subTabs?.length) return t
        const nextSubs = t.subTabs.map((s) =>
          s.id === subId ? { ...s, officialPostOnly: checked } : s,
        )
        return { ...t, subTabs: nextSubs, updatedAt: dayjs().format('YYYY-MM-DD') }
      }),
    )
    messageApi.success(checked ? '该子 Tab 已设为仅官方可发帖' : '该子 Tab 已允许全体用户发帖')
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

      const pI18nForm = (values.partitionNameI18n ?? {}) as I18nLabels
      const zhPartition = (pI18nForm.zh ?? '').trim()
      if (!zhPartition) {
        messageApi.error('请填写简体中文分区名称')
        return
      }
      const partitionNameI18nOut = pruneTabNameI18n({ ...pI18nForm, zh: zhPartition })
      const partitionName = zhPartition

      let nextSubTabs: TabRoute['subTabs']
      let nextLayout: TabPartitionLayoutType | undefined

      if (useSecondary) {
        const raw = (values.subTabs ?? []) as {
          id?: string
          nameI18n?: I18nLabels
          layoutType?: TabPartitionLayoutType
        }[]
        const rows = raw.filter((r) => (r.nameI18n?.zh ?? '').trim())
        if (rows.length === 0) {
          messageApi.error('启用二级 Tab 时请至少添加一行并填写简体中文名称')
          return
        }
        const subTabsMergeSource =
          editingTab != null ? tabRoutes.find((t) => t.id === editingTab.id)?.subTabs : undefined
        nextSubTabs = rows.map((r, i) => {
          const id = (r.id && String(r.id).trim()) || `sub-${Date.now()}-${i}`
          const zh = (r.nameI18n?.zh ?? '').trim()
          const pruned = pruneTabNameI18n({ ...r.nameI18n, zh })
          const prev =
            subTabsMergeSource?.find((s) => s.id === id) ?? editingTab?.subTabs?.find((s) => s.id === id)
          return {
            id,
            name: zh,
            nameI18n: pruned,
            layoutType: (r.layoutType ?? 'feeds') as TabPartitionLayoutType,
            sortOrder: i + 1,
            officialPostOnly: prev?.officialPostOnly ?? false,
            modules: prev?.modules,
          }
        })
        nextLayout = undefined
      } else {
        nextSubTabs = undefined
        nextLayout = (values.layoutType ?? 'feeds') as TabPartitionLayoutType
      }

      if (editingTab) {
        const latestRow = tabRoutes.find((tr) => tr.id === editingTab.id)
        const mergedPrimaryOfficial =
          latestRow?.officialPostOnly ?? editingTab.officialPostOnly ?? false
        setTabRoutes((prev) =>
          prev.map((t) => {
            if (t.id !== editingTab.id) return t
            if (useSecondary) {
              return {
                ...t,
                name: partitionName,
                nameI18n: partitionNameI18nOut,
                subTabs: nextSubTabs,
                layoutType: undefined,
                officialPostOnly: undefined,
                updatedAt: now,
              }
            }
            return {
              ...t,
              name: partitionName,
              nameI18n: partitionNameI18nOut,
              layoutType: nextLayout,
              subTabs: undefined,
              officialPostOnly: mergedPrimaryOfficial,
              modules: t.modules,
              updatedAt: now,
            }
          }),
        )
        messageApi.success('分区已更新')
      } else {
        const maxSort = Math.max(...tabRoutes.map((t) => t.sortOrder))
        const base: TabRoute = {
          id: String(Date.now()),
          name: partitionName,
          nameI18n: partitionNameI18nOut,
          type: 'guides',
          status: 'draft',
          sortOrder: maxSort + 1,
          isFixed: false,
          createdAt: now,
          updatedAt: now,
        }
        const newTab: TabRoute = useSecondary
          ? { ...base, subTabs: nextSubTabs }
          : { ...base, layoutType: nextLayout, officialPostOnly: false }
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
      width: 240,
      render: (_: string, record: TabRoute) => {
        if (record.isFixed) {
          return <span style={{ fontWeight: 500, color: '#9CA3AF', fontSize: 13 }}>{record.name}</span>
        }
        const merged = mergeTabNameI18n(record)
        const primary = tabPrimaryDisplayName(record)
        const filled = LANGUAGES.filter((l) => (merged[l.code] ?? '').trim())
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 500, color: '#1F2937', fontSize: 13 }}>{primary}</span>
            {filled.length > 1
              ? filled.map((l) => (
                <Tooltip key={l.code} title={`${l.label}：${(merged[l.code] ?? '').trim()}`}>
                  <Tag style={{ margin: 0, fontSize: 10, lineHeight: '18px', padding: '0 5px', borderRadius: 4 }}>{l.flag}</Tag>
                </Tooltip>
              ))
              : null}
          </div>
        )
      },
    },
    {
      title: '分区类型',
      key: 'layoutType',
      width: 228,
      render: (_: unknown, record: TabRoute) => {
        if (record.isFixed) {
          const v = record.layoutType ?? 'feeds'
          return (
            <Space size={8} align="center" wrap>
              <Tooltip title={TAB_PARTITION_LAYOUT_CONFIG[v].hint}>
                <Tag style={{ margin: 0, fontSize: 12, color: '#6B7280', background: '#F3F4F6', border: 'none', borderRadius: 6 }}>
                  {TAB_PARTITION_LAYOUT_CONFIG[v].label}
                </Tag>
              </Tooltip>
              {v === 'activity-card' ? <ActivityCardGoPostLink /> : null}
            </Space>
          )
        }
        if (tabRouteHasSecondaryTabs(record)) {
          const sorted = [...record.subTabs!].sort((a, b) => a.sortOrder - b.sortOrder)
          const tip = (
            <div style={{ maxWidth: 320 }}>
              {sorted.map((st) => (
                <div key={st.id} style={{ fontSize: 12, color: '#E5E7EB', marginBottom: 4 }}>
                  <span>
                    {subTabPrimaryDisplayName(st)} · {TAB_PARTITION_LAYOUT_CONFIG[st.layoutType].label}
                  </span>
                </div>
              ))}
            </div>
          )
          return (
            <Space size={8} align="center" wrap>
              <Tooltip title={tip}>
                <Tag color="blue" style={{ margin: 0, fontSize: 12, borderRadius: 6, cursor: 'default' }}>
                  二级 {sorted.length} 项
                </Tag>
              </Tooltip>
            </Space>
          )
        }
        const v = record.layoutType ?? 'feeds'
        return (
          <Space size={8} align="center" wrap>
            <Tooltip title={TAB_PARTITION_LAYOUT_CONFIG[v].hint}>
              <Tag style={{ margin: 0, fontSize: 12, color: '#374151', background: '#F3F4F6', border: 'none', borderRadius: 6 }}>
                {TAB_PARTITION_LAYOUT_CONFIG[v].label}
              </Tag>
            </Tooltip>
            {v === 'activity-card' ? <ActivityCardGoPostLink /> : null}
          </Space>
        )
      },
    },
    {
      title: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          官方
          <Tooltip title={OFFICIAL_POST_ONLY_TOOLTIP}>
            <span style={{ display: 'inline-flex', color: '#9CA3AF', cursor: 'help' }} aria-label="说明">
              <HelpCircle size={14} />
            </span>
          </Tooltip>
        </span>
      ),
      key: 'officialPostOnly',
      width: 168,
      render: (_: unknown, record: TabRoute) => {
        if (record.isFixed) {
          return <span style={{ color: '#D1D5DB', fontSize: 12 }}>—</span>
        }
        if (tabRouteHasSecondaryTabs(record)) {
          const sorted = [...record.subTabs!].sort((a, b) => a.sortOrder - b.sortOrder)
          const content = (
            <div style={{ minWidth: 240 }}>
              {sorted.map((st) => (
                <div
                  key={st.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    padding: '8px 0',
                    borderBottom: '1px solid #F3F4F6',
                  }}
                >
                  <span style={{ fontSize: 13, color: '#374151' }}>{subTabPrimaryDisplayName(st)}</span>
                  <Switch
                    size="small"
                    checked={st.officialPostOnly ?? false}
                    onChange={(c) => handleSubTabOfficialToggle(record.id, st.id, c)}
                  />
                </div>
              ))}
            </div>
          )
          return (
            <Popover content={content} trigger="click" placement="bottomLeft">
              <Button type="link" size="small" style={{ padding: 0, height: 'auto', fontSize: 12 }}>
                二级 {sorted.length} 项
              </Button>
            </Popover>
          )
        }
        return (
          <Switch
            size="small"
            checked={record.officialPostOnly ?? false}
            onChange={(c) => handlePrimaryOfficialToggle(record.id, c)}
          />
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
              description={`确定要删除「${tabPrimaryDisplayName(record)}」吗？`}
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
        onCancel={() => {
          setI18nDrawerTarget(null)
          setModalOpen(false)
          setEditingTab(null)
        }}
        onOk={handleSubmit}
        okText={editingTab ? '保存' : '创建'}
        cancelText="取消"
        width={600}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
          initialValues={{ partitionNameI18n: {}, layoutType: 'feeds', useSecondaryTabs: false, subTabs: [] }}
        >
          <Form.Item
            name={['partitionNameI18n', 'zh']}
            label="分区名称（简体中文）"
            rules={[{ required: true, message: '请填写简体中文分区名称' }]}
          >
            <Input
              placeholder="必填，列表默认展示"
              suffix={
                <Tooltip title="多语言名称">
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="多语言名称"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setI18nDrawerTarget({ kind: 'partition' })
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setI18nDrawerTarget({ kind: 'partition' })
                      }
                    }}
                    style={{
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      color: '#64748B',
                    }}
                  >
                    <Languages size={18} strokeWidth={2} />
                  </span>
                </Tooltip>
              }
            />
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
                    form.setFieldValue('subTabs', [{ id: `sub-${Date.now()}`, nameI18n: { zh: '' }, layoutType: 'feeds' }])
                  }
                }
              }}
            />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.useSecondaryTabs !== cur.useSecondaryTabs}>
            {({ getFieldValue }) =>
              getFieldValue('useSecondaryTabs') ? (
                <Form.List name="subTabs">
                  {(fields, { add, remove, move }) => (
                    <div
                      style={{ marginBottom: 8 }}
                      onDragEnd={() => {
                        const { from, over } = subFormDrag.current
                        subFormDrag.current = { from: null, over: null }
                        if (from != null && over != null && from !== over) move(from, over)
                      }}
                    >
                      {fields.map(({ key, name: idx, ...restField }, index) => (
                        <div
                          key={key}
                          style={{
                            display: 'flex',
                            gap: 10,
                            marginBottom: 10,
                            padding: '10px 12px',
                            border: '1px solid #E5E7EB',
                            borderRadius: 8,
                            background: '#FAFAFA',
                            alignItems: 'flex-start',
                          }}
                        >
                          <div
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = 'move'
                              subFormDrag.current = { from: index, over: null }
                            }}
                            onDragOver={(e) => {
                              e.preventDefault()
                              e.dataTransfer.dropEffect = 'move'
                              subFormDrag.current.over = index
                            }}
                            style={{ cursor: 'grab', display: 'flex', alignItems: 'center', paddingTop: 6 }}
                            title="拖动排序"
                          >
                            <GripVertical size={14} color="#9CA3AF" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Form.Item {...restField} name={[idx, 'id']} hidden>
                              <Input />
                            </Form.Item>
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px' }}>
                              <Form.Item
                                {...restField}
                                name={[idx, 'nameI18n', 'zh']}
                                rules={[{ required: true, message: '请填写简体中文名称' }]}
                                style={{ marginBottom: 0, flex: '1 1 180px', minWidth: 160 }}
                              >
                                <Input
                                  size="small"
                                  placeholder="简体中文（必填）"
                                  suffix={
                                    <Tooltip title="多语言名称">
                                      <span
                                        role="button"
                                        tabIndex={0}
                                        aria-label="多语言名称"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          setI18nDrawerTarget({ kind: 'subTab', index: idx })
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault()
                                            setI18nDrawerTarget({ kind: 'subTab', index: idx })
                                          }
                                        }}
                                        style={{
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          color: '#64748B',
                                        }}
                                      >
                                        <Languages size={15} strokeWidth={2} />
                                      </span>
                                    </Tooltip>
                                  }
                                />
                              </Form.Item>
                              <Form.Item {...restField} name={[idx, 'layoutType']} label="" style={{ marginBottom: 0, minWidth: 148 }}>
                                <Select size="small" style={{ width: 148 }} options={LAYOUT_SELECT_OPTIONS} placeholder="分区类型" />
                              </Form.Item>
                              <Form.Item noStyle dependencies={[['subTabs', idx, 'layoutType']]}>
                                {() =>
                                  form.getFieldValue(['subTabs', idx, 'layoutType']) === 'activity-card' ? (
                                    <ActivityCardGoPostLink style={{ lineHeight: '24px' }} />
                                  ) : null
                                }
                              </Form.Item>
                            </div>
                          </div>
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<MinusCircle size={16} />}
                            onClick={() => remove(idx)}
                            aria-label="删除该行"
                            style={{ flexShrink: 0 }}
                          />
                        </div>
                      ))}
                      <Button
                        type="dashed"
                        onClick={() => add({ id: `sub-${Date.now()}`, nameI18n: { zh: '' }, layoutType: 'feeds' })}
                        block
                      >
                        + 添加二级 Tab
                      </Button>
                    </div>
                  )}
                </Form.List>
              ) : (
                <>
                  <Form.Item
                    name="layoutType"
                    label="分区类型"
                    tooltip="无二级 Tab 时，由一级分区决定前台版式"
                    rules={[{ required: true, message: '请选择分区类型' }]}
                  >
                    <Select placeholder="请选择" options={LAYOUT_SELECT_OPTIONS} />
                  </Form.Item>
                  <Form.Item noStyle dependencies={[['layoutType']]}>
                    {() =>
                      form.getFieldValue('layoutType') === 'activity-card' ? (
                        <div style={{ marginTop: -4, marginBottom: 8 }}>
                          <ActivityCardGoPostLink />
                        </div>
                      ) : null
                    }
                  </Form.Item>
                </>
              )
            }
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        {...PARTITION_NAME_I18N_DRAWER_PROPS}
        title={
          i18nDrawerTarget?.kind === 'partition'
            ? '分区名称 · 多语言'
            : i18nDrawerTarget
              ? `二级 Tab · 多语言（第 ${i18nDrawerTarget.index + 1} 项）`
              : ''
        }
        open={i18nDrawerTarget !== null}
        onClose={closeI18nDrawer}
      >
        {i18nDrawerTarget ? (
          <FieldI18nEditor
            key={i18nDrawerTarget.kind === 'partition' ? 'partition-i18n' : `subtab-i18n-${i18nDrawerTarget.index}`}
            fieldLabel={i18nDrawerTarget.kind === 'partition' ? '分区名称' : '二级 Tab 名称'}
            i18n={drawerInitialI18n}
            compact
            onSave={(next) => {
              if (i18nDrawerTarget.kind === 'partition') applyPartitionI18n(next)
              else applySubTabI18n(i18nDrawerTarget.index, next)
            }}
            onCancel={closeI18nDrawer}
          />
        ) : null}
      </Drawer>
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
