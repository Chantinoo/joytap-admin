'use client'

import React, { useState, useRef } from 'react'
import { Table, Button, Tag, Space, Input, Select, Switch, Modal, Form, Tooltip, Popconfirm, message, Checkbox } from 'antd'
import { Plus, Search, Edit2, Trash2, Eye, GripVertical, Languages } from 'lucide-react'
import PageBreadcrumb from '../../components/PageBreadcrumb'
import ForumSelectRequired from '../../components/ForumSelectRequired'
import FieldI18nModal, { type I18nLabels, LANGUAGES } from '../components/FieldI18nModal'
import ListStylePreview, { LIST_STYLES, type ListStyle } from '../components/ListStylePreview'

const { Option } = Select

type FieldType = 'text' | 'number' | 'image' | 'tag' | 'rich-table'

interface WikiField {
  key: string
  label: string
  i18n: I18nLabels
  type: FieldType
  visible: boolean
  listDisplay: boolean
  sortable: boolean
  filterable: boolean
  required: boolean
  order: number
}

interface GameMap {
  id: number; name: string; icon: string; region: string
  level_range: string; type: string; monsters: string; npcs: string
  teleport: string; visible: boolean
  [key: string]: unknown
}

const initialFields: WikiField[] = [
  { key: 'icon',        label: '图标',     i18n: { zh: '图标',     en: 'Icon'        }, type: 'image',      visible: true,  listDisplay: true,  sortable: false, filterable: false, required: true,  order: 1 },
  { key: 'id',          label: 'ID',       i18n: { zh: 'ID',       en: 'ID'          }, type: 'number',     visible: true,  listDisplay: true,  sortable: true,  filterable: false, required: true,  order: 2 },
  { key: 'name',        label: '名称',     i18n: { zh: '名称',     en: 'Name'        }, type: 'text',       visible: true,  listDisplay: true,  sortable: false, filterable: true,  required: true,  order: 3 },
  { key: 'region',      label: '所属区域', i18n: { zh: '所属区域', en: 'Region'      }, type: 'tag',        visible: true,  listDisplay: true,  sortable: false, filterable: true,  required: true,  order: 4 },
  { key: 'level_range', label: '等级范围', i18n: { zh: '等级范围', en: 'Level Range' }, type: 'text',       visible: true,  listDisplay: true,  sortable: false, filterable: false, required: false, order: 5 },
  { key: 'type',        label: '地图类型', i18n: { zh: '地图类型', en: 'Map Type'    }, type: 'tag',        visible: true,  listDisplay: true,  sortable: false, filterable: true,  required: false, order: 6 },
  { key: 'monsters',    label: '出没怪物', i18n: { zh: '出没怪物', en: 'Monsters'    }, type: 'text',       visible: true,  listDisplay: false, sortable: false, filterable: false, required: false, order: 7 },
  { key: 'npcs',        label: 'NPC',      i18n: { zh: 'NPC',      en: 'NPCs'        }, type: 'text',       visible: true,  listDisplay: false, sortable: false, filterable: false, required: false, order: 8 },
  { key: 'teleport',    label: '传送点',   i18n: { zh: '传送点',   en: 'Teleport'    }, type: 'rich-table', visible: true,  listDisplay: false, sortable: false, filterable: false, required: false, order: 9 },
  { key: 'description', label: '描述',     i18n: { zh: '描述',     en: 'Description' }, type: 'text',       visible: false, listDisplay: false, sortable: false, filterable: false, required: false, order: 10 },
]

const mockMaps: GameMap[] = [
  { id: 1,  name: '普隆德拉',     icon: '🏰', region: '卢恩-米德加兹', level_range: '—',      type: '城镇', monsters: '—',                 npcs: '卡普拉、铁匠、商人', teleport: '伊兹鲁德、吉芬', visible: true },
  { id: 2,  name: '普隆德拉周边', icon: '🌿', region: '卢恩-米德加兹', level_range: '1~15',   type: '野外', monsters: '波利、史莱姆、蜂王', npcs: '—',                 teleport: '普隆德拉',       visible: true },
  { id: 3,  name: '普隆德拉墓地', icon: '⚰️', region: '卢恩-米德加兹', level_range: '15~30',  type: '地下城', monsters: '骷髅、骷髅战士',   npcs: '—',                 teleport: '普隆德拉',       visible: true },
  { id: 4,  name: '伊兹鲁德',     icon: '🏝️', region: '卢恩-米德加兹', level_range: '—',      type: '城镇', monsters: '—',                 npcs: '卡普拉、商人',       teleport: '普隆德拉、亚尔伯塔', visible: true },
  { id: 5,  name: '吉芬',         icon: '🔮', region: '卢恩-米德加兹', level_range: '—',      type: '城镇', monsters: '—',                 npcs: '卡普拉、魔法商人',   teleport: '普隆德拉',       visible: true },
  { id: 6,  name: '吉芬地下城',   icon: '🕳️', region: '卢恩-米德加兹', level_range: '30~50',  type: '地下城', monsters: '蜥蜴战士、奥克',   npcs: '—',                 teleport: '吉芬',           visible: true },
  { id: 7,  name: '沙漠',         icon: '🏜️', region: '卢恩-米德加兹', level_range: '25~40',  type: '野外', monsters: '蜥蜴战士',           npcs: '—',                 teleport: '摩洛克',         visible: true },
  { id: 8,  name: '冰雪地带',     icon: '❄️', region: '卢恩-米德加兹', level_range: '50~70',  type: '野外', monsters: '冰霜精灵',           npcs: '—',                 teleport: '拉赫',           visible: false },
]

const fieldTypeColors: Record<string, string> = {
  text: 'blue', number: 'green', image: 'purple', tag: 'orange', 'rich-table': 'geekblue',
}

export default function WikiMapsPage() {
  const [fields, setFields] = useState<WikiField[]>(initialFields)
  const [activeTab, setActiveTab] = useState<'data' | 'fields'>('data')
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [regionFilter, setRegionFilter] = useState<string>('all')

  const [fieldModalOpen, setFieldModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<WikiField | null>(null)
  const [form] = Form.useForm()

  const [i18nModalOpen, setI18nModalOpen] = useState(false)
  const [i18nTarget, setI18nTarget] = useState<WikiField | null>(null)

  const [selectedStyle, setSelectedStyle] = useState<ListStyle>('card-list')
  const [listFieldKeys, setListFieldKeys] = useState<string[]>(
    initialFields.filter(f => f.listDisplay).map(f => f.key)
  )

  const dragIndex = useRef<number | null>(null)
  const dragOverIndex = useRef<number | null>(null)
  const [messageApi, contextHolder] = message.useMessage()

  const sortedFields = [...fields].sort((a, b) => a.order - b.order)
  const filteredMaps = mockMaps.filter(m => {
    const matchSearch = m.name.includes(searchText) || String(m.id).includes(searchText)
    const matchType = typeFilter === 'all' || m.type === typeFilter
    const matchRegion = regionFilter === 'all' || m.region === regionFilter
    return matchSearch && matchType && matchRegion
  })
  const visibleFields = sortedFields.filter(f => f.visible)

  const currentStyleConfig = LIST_STYLES.find(s => s.id === selectedStyle)!
  const allowedFieldKeys = sortedFields
    .filter(f => f.visible && currentStyleConfig.allowedTypes.includes(f.type))
    .map(f => f.key)
  const validListFieldKeys = listFieldKeys.filter(k => allowedFieldKeys.includes(k))

  const openAddModal = () => {
    setEditingField(null)
    form.resetFields()
    form.setFieldsValue({ visible: true, listDisplay: true, sortable: false, filterable: false, required: false, type: 'text' })
    setFieldModalOpen(true)
  }

  const openEditModal = (record: WikiField) => {
    setEditingField(record)
    form.setFieldsValue(record)
    setFieldModalOpen(true)
  }

  const handleFieldSave = () => {
    form.validateFields().then(values => {
      if (editingField) {
        setFields(prev => prev.map(f => f.key === editingField.key ? { ...f, ...values } : f))
        messageApi.success('字段已更新')
      } else {
        if (fields.some(f => f.key === values.key)) { messageApi.error('字段 Key 已存在'); return }
        const maxOrder = Math.max(...fields.map(f => f.order), 0)
        setFields(prev => [...prev, { ...values, i18n: { zh: values.label }, order: maxOrder + 1 }])
        messageApi.success('字段已新增')
      }
      setFieldModalOpen(false)
    })
  }

  const handleDeleteField = (key: string) => {
    setFields(prev => prev.filter(f => f.key !== key))
    setListFieldKeys(prev => prev.filter(k => k !== key))
    messageApi.success('字段已删除')
  }

  const openI18nModal = (record: WikiField) => {
    setI18nTarget(record)
    setI18nModalOpen(true)
  }

  const handleI18nSave = (i18n: I18nLabels) => {
    if (!i18nTarget) return
    setFields(prev => prev.map(f => f.key === i18nTarget.key ? { ...f, i18n, label: i18n.zh || f.label } : f))
    setI18nModalOpen(false)
    messageApi.success('多语言配置已保存')
  }

  const handleDragStart = (index: number) => { dragIndex.current = index }
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); dragOverIndex.current = index }
  const handleDrop = () => {
    if (dragIndex.current === null || dragOverIndex.current === null || dragIndex.current === dragOverIndex.current) return
    const reordered = [...sortedFields]
    const [moved] = reordered.splice(dragIndex.current, 1)
    reordered.splice(dragOverIndex.current, 0, moved)
    setFields(reordered.map((f, i) => ({ ...f, order: i + 1 })))
    dragIndex.current = null; dragOverIndex.current = null
  }

  const dataColumns = [
    ...visibleFields.map(field => ({
      title: field.label,
      dataIndex: field.key,
      key: field.key,
      sorter: field.sortable ? true : undefined,
      render: (val: unknown) => {
        if (field.type === 'image') return <span style={{ fontSize: 20 }}>{val as string}</span>
        if (field.type === 'tag') return <Tag>{val as string}</Tag>
        if (field.type === 'rich-table') return <Tag color="geekblue" style={{ fontSize: 11 }}>富媒体表</Tag>
        return <span style={{ fontSize: 13 }}>{String(val ?? '—')}</span>
      },
    })),
    { title: '前台显示', dataIndex: 'visible', key: 'visible', render: (val: boolean) => <Tag color={val ? 'green' : 'default'}>{val ? '显示' : '隐藏'}</Tag> },
    { title: '操作', key: 'action', render: () => (
      <Space size={4}>
        <Tooltip title="查看"><Button size="small" type="text" icon={<Eye size={13} />} /></Tooltip>
        <Tooltip title="编辑"><Button size="small" type="text" icon={<Edit2 size={13} />} /></Tooltip>
        <Tooltip title="删除"><Button size="small" type="text" danger icon={<Trash2 size={13} />} /></Tooltip>
      </Space>
    )},
  ]

  const fieldColumns = [
    {
      title: '字段 Key', dataIndex: 'key', key: 'key',
      render: (v: string) => <code style={{ fontSize: 12, background: '#F3F4F6', padding: '2px 6px', borderRadius: 4, color: '#374151' }}>{v}</code>,
    },
    {
      title: '显示名称', dataIndex: 'label', key: 'label',
      render: (v: string, record: WikiField) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13 }}>{v}</span>
          <Tooltip title="配置多语言">
            <Button size="small" type="text" icon={<Languages size={12} />} style={{ color: '#1677FF', padding: '0 4px', height: 20 }}
              onClick={() => openI18nModal(record)} />
          </Tooltip>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {LANGUAGES.filter(l => record.i18n?.[l.code]).map(l => (
              <Tooltip key={l.code} title={`${l.label}: ${record.i18n?.[l.code]}`}>
                <span style={{ fontSize: 11, color: '#6B7280', background: '#F3F4F6', padding: '1px 5px', borderRadius: 3, cursor: 'default', lineHeight: '18px' }}>{l.code}</span>
              </Tooltip>
            ))}
          </div>
        </div>
      ),
    },
    { title: '类型', dataIndex: 'type', key: 'type', render: (v: string) => <Tag color={fieldTypeColors[v]}>{v}</Tag> },
    {
      title: '操作', key: 'action',
      render: (_: unknown, record: WikiField) => (
        <Space size={4}>
          <Button size="small" type="text" icon={<Edit2 size={13} />} onClick={() => openEditModal(record)}>编辑</Button>
          <Popconfirm title="确认删除该字段？" description="删除后前台将不再展示此字段数据。"
            onConfirm={() => handleDeleteField(record.key)} okText="删除" cancelText="取消" okButtonProps={{ danger: true }}>
            <Button size="small" type="text" danger icon={<Trash2 size={13} />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {contextHolder}
      <PageBreadcrumb items={[{ label: 'Wiki 管理', href: '/wiki' }, { label: '地图管理' }]} />

      <ForumSelectRequired>
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>地图管理</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>管理前台 Wiki 地图页面的数据与字段配置</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button style={{ borderRadius: 6 }} onClick={() => setActiveTab(activeTab === 'data' ? 'fields' : 'data')}>
              {activeTab === 'data' ? '⚙️ 字段配置' : '📋 数据列表'}
            </Button>
            {activeTab === 'data'
              ? <Button type="primary" icon={<Plus size={14} />} style={{ borderRadius: 6 }}>新增地图</Button>
              : <Button type="primary" icon={<Plus size={14} />} style={{ borderRadius: 6 }} onClick={openAddModal}>新增字段</Button>
            }
          </div>
        </div>

        {activeTab === 'data' && (
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <Input placeholder="搜索地图名称或 ID" prefix={<Search size={14} style={{ color: '#9CA3AF' }} />}
                value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 220, borderRadius: 6 }} />
              <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 120 }}>
                <Option value="all">全部类型</Option>
                <Option value="城镇">城镇</Option>
                <Option value="野外">野外</Option>
                <Option value="地下城">地下城</Option>
              </Select>
              <Select value={regionFilter} onChange={setRegionFilter} style={{ width: 160 }}>
                <Option value="all">全部区域</Option>
                <Option value="卢恩-米德加兹">卢恩-米德加兹</Option>
              </Select>
              <div style={{ marginLeft: 'auto', fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center' }}>共 {filteredMaps.length} 条</div>
            </div>
            <Table dataSource={filteredMaps} columns={dataColumns} rowKey="id" size="small"
              pagination={{ pageSize: 10, showSizeChanger: false }} scroll={{ x: 'max-content' }} />
          </div>
        )}

        {activeTab === 'fields' && (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div style={{ marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>字段配置</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  配置前台页面展示的字段及其属性。点击名称旁的
                  <Languages size={13} style={{ color: '#1677FF', flexShrink: 0, verticalAlign: 'middle' }} />
                  图标可配置多语言，支持 AI 一键翻译。
                </p>
              </div>
              <Table dataSource={sortedFields} columns={fieldColumns} rowKey="key" size="small" pagination={false} />
            </div>

            <div style={{ borderTop: '1px solid #E5E7EB' }} />

            <div>
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>列表样式</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
                  选择前台列表页的展示样式，不同样式支持的字段数量和类型不同。
                </p>
              </div>

              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 320, flexShrink: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {LIST_STYLES.map(s => (
                      <div key={s.id} onClick={() => {
                        setSelectedStyle(s.id)
                        let valid = listFieldKeys.filter(k => {
                          const f = fields.find(ff => ff.key === k)
                          return f && s.allowedTypes.includes(f.type)
                        }).slice(0, s.maxFields)
                        if (s.requireImage) {
                          const firstImageField = sortedFields.find(f => f.visible && f.type === 'image')
                          if (firstImageField && !valid.includes(firstImageField.key)) {
                            valid = [firstImageField.key, ...valid].slice(0, s.maxFields)
                          }
                        }
                        setListFieldKeys(valid)
                      }} style={{
                        padding: '10px 14px',
                        border: `2px solid ${selectedStyle === s.id ? '#1677FF' : '#E5E7EB'}`,
                        borderRadius: 8, cursor: 'pointer',
                        background: selectedStyle === s.id ? '#EFF6FF' : '#fff',
                        transition: 'all 0.15s',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{s.icon}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{s.label}</div>
                            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{s.description}</div>
                          </div>
                          {selectedStyle === s.id && <Tag color="blue" style={{ marginLeft: 'auto', fontSize: 11 }}>已选</Tag>}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 12, color: '#9CA3AF' }}>
                          {s.requireImage
                            ? `图片必选 + 最多 ${s.maxTextFields ?? (s.maxFields - 1)} 个文本/数字`
                            : `最多 ${s.maxFields} 个字段`}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: '12px 14px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#FAFAFA' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                      选择展示字段
                      <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 6 }}>
                        ({validListFieldKeys.length}/{currentStyleConfig.maxFields})
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {sortedFields.filter(f => f.visible).map(f => {
                        const allowed = currentStyleConfig.allowedTypes.includes(f.type)
                        const checked = validListFieldKeys.includes(f.key)
                        const isImage = f.type === 'image'
                        const checkedImageKeys = validListFieldKeys.filter(k => {
                          const ff = sortedFields.find(x => x.key === k)
                          return ff?.type === 'image'
                        })
                        const checkedTextKeys = validListFieldKeys.filter(k => {
                          const ff = sortedFields.find(x => x.key === k)
                          return ff && ff.type !== 'image'
                        })
                        const firstImageField = sortedFields.find(ff => ff.visible && ff.type === 'image')
                        const isLockedImage = currentStyleConfig.requireImage && isImage && firstImageField?.key === f.key
                        let disabled = !allowed
                        if (isLockedImage) {
                          disabled = true
                        } else if (!disabled && !checked) {
                          if (currentStyleConfig.requireImage) {
                            if (isImage && checkedImageKeys.length >= 1) disabled = true
                            if (!isImage && checkedTextKeys.length >= (currentStyleConfig.maxTextFields ?? (currentStyleConfig.maxFields - 1))) disabled = true
                          } else {
                            if (validListFieldKeys.length >= currentStyleConfig.maxFields) disabled = true
                          }
                        }
                        return (
                          <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Checkbox
                              checked={checked || isLockedImage}
                              disabled={disabled}
                              onChange={e => {
                                if (e.target.checked) {
                                  setListFieldKeys(prev => [...prev, f.key])
                                } else {
                                  setListFieldKeys(prev => prev.filter(k => k !== f.key))
                                }
                              }}
                            />
                            <span style={{ fontSize: 13, color: allowed ? '#374151' : '#9CA3AF' }}>{f.label}</span>
                            <Tag color={fieldTypeColors[f.type]} style={{ fontSize: 11, padding: '0 4px' }}>{f.type}</Tag>
                            {!allowed && <span style={{ fontSize: 11, color: '#9CA3AF' }}>不支持此样式</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 10 }}>
                    前端预览
                    <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>仅供参考</Tag>
                  </div>
                  <div style={{ padding: 16, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8 }}>
                    {validListFieldKeys.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '24px 0' }}>
                        请在左侧勾选至少一个字段
                      </div>
                    ) : (
                      <ListStylePreview
                        style={selectedStyle}
                        fields={sortedFields}
                        selectedFieldKeys={validListFieldKeys}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        title={editingField ? '编辑字段' : '新增字段'}
        open={fieldModalOpen}
        forceRender
        onOk={handleFieldSave}
        onCancel={() => setFieldModalOpen(false)}
        okText="保存"
        cancelText="取消"
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="key" label="字段 Key"
            rules={[
              { required: true, message: '请输入字段 Key' },
              { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '只能包含字母、数字和下划线' },
            ]}
          >
            <Input placeholder="如：map_level" disabled={!!editingField} />
          </Form.Item>
          <Form.Item name="label" label="显示名称（中文）" rules={[{ required: true, message: '请输入显示名称' }]}>
            <Input placeholder="如：地图等级" />
          </Form.Item>
          <Form.Item name="type" label="字段类型" rules={[{ required: true }]}>
            <Select>
              <Option value="text">text — 文本</Option>
              <Option value="number">number — 数字</Option>
              <Option value="image">image — 图片/图标</Option>
              <Option value="tag">tag — 标签</Option>
              <Option value="rich-table">rich-table — 富媒体表</Option>
            </Select>
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <Form.Item name="visible" label="前台显示" valuePropName="checked"><Switch /></Form.Item>
            <Form.Item name="listDisplay" label="列表展示" valuePropName="checked"><Switch /></Form.Item>
            <Form.Item name="sortable" label="可排序" valuePropName="checked"><Switch /></Form.Item>
            <Form.Item name="filterable" label="可筛选" valuePropName="checked"><Switch /></Form.Item>
            <Form.Item name="required" label="必填" valuePropName="checked">
              <Switch disabled={!!editingField && editingField.required} />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {i18nTarget && (
        <FieldI18nModal
          open={i18nModalOpen}
          fieldKey={i18nTarget.key}
          fieldLabel={i18nTarget.label}
          i18n={i18nTarget.i18n}
          onSave={handleI18nSave}
          onCancel={() => setI18nModalOpen(false)}
        />
      )}
      </ForumSelectRequired>
    </div>
  )
}
