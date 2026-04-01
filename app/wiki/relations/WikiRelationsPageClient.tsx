'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  message,
  Tooltip,
} from 'antd'
import { Plus, Edit2, Trash2, Languages, Database } from 'lucide-react'
import PageBreadcrumb from '../../components/PageBreadcrumb'
import ForumSelectRequired from '../../components/ForumSelectRequired'
import FieldI18nModal, { type I18nLabels, LANGUAGES } from '../components/FieldI18nModal'
import RelationFieldSelectOptionsEditor from '../components/RelationFieldSelectOptionsEditor'
import type {
  WikiRelationDefinition,
  WikiRelationFieldDef,
  WikiRelationFieldType,
  WikiRelationSelectOption,
} from '../config/wikiRelationDefinitions'
import {
  SCHEMA_ID_SELECT_OPTIONS,
  formatWikiSchemaIdCell,
  relationDisplayName,
  WIKI_RELATION_FIELD_TYPE_OPTIONS,
} from '../config/wikiRelationDefinitions'
import { useWikiRelationsRegistry } from '../config/WikiRelationsRegistry'

function emptyRelation(): WikiRelationDefinition {
  return {
    key: '',
    nameI18n: { zh: '' },
    sourceSchemaId: 'items',
    targetSchemaId: 'monsters',
    fields: [{ key: 'id', label: 'ID', type: 'number' }],
  }
}

export default function WikiRelationsPageClient() {
  const { relations, updateRelations, updateInstanceRows } = useWikiRelationsRegistry()
  const [messageApi, contextHolder] = message.useMessage()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<WikiRelationDefinition | null>(null)
  const [form] = Form.useForm()
  const [nameI18nModalOpen, setNameI18nModalOpen] = useState(false)
  const [pendingNameI18n, setPendingNameI18n] = useState<I18nLabels>({})
  /** 可扩展字段「显示名称」多语言：Form.List 行下标 */
  const [fieldLabelI18nModalIndex, setFieldLabelI18nModalIndex] = useState<number | null>(null)
  const [pendingFieldLabelI18n, setPendingFieldLabelI18n] = useState<I18nLabels>({})

  const sorted = useMemo(
    () => [...relations].sort((a, b) => a.key.localeCompare(b.key)),
    [relations],
  )

  const openAdd = () => {
    setEditing(null)
    const blank = emptyRelation()
    form.setFieldsValue({
      key: '',
      labelZh: '',
      sourceSchemaId: blank.sourceSchemaId,
      targetSchemaId: blank.targetSchemaId,
      fields: blank.fields.map((f) => ({
        key: f.key,
        label: f.label,
        labelI18n: { zh: f.label },
        type: f.type,
        selectOptions: f.selectOptions ? [...f.selectOptions] : [],
      })),
    })
    setPendingNameI18n({})
    setModalOpen(true)
  }

  const openEdit = (r: WikiRelationDefinition) => {
    setEditing(r)
    form.setFieldsValue({
      key: r.key,
      labelZh: r.nameI18n.zh ?? '',
      sourceSchemaId: r.sourceSchemaId,
      targetSchemaId: r.targetSchemaId,
      fields: r.fields.map((f) => ({
        key: f.key,
        label: f.label,
        labelI18n:
          f.labelI18n && Object.keys(f.labelI18n).length > 0
            ? { ...f.labelI18n }
            : { zh: f.label },
        type: f.type,
        selectOptions: f.selectOptions ? [...f.selectOptions] : [],
      })),
    })
    setPendingNameI18n({
      ...r.nameI18n,
      zh: r.nameI18n.zh ?? relationDisplayName(r),
    })
    setModalOpen(true)
  }

  const handleNameI18nSave = (i18n: I18nLabels) => {
    const zh = (i18n.zh ?? '').trim()
    setPendingNameI18n(i18n)
    form.setFieldsValue({ labelZh: zh || form.getFieldValue('labelZh') })
    setNameI18nModalOpen(false)
    messageApi.success('多语言已保存')
  }

  const openFieldLabelI18nModal = (fieldIndex: number) => {
    const lab = (form.getFieldValue(['fields', fieldIndex, 'label']) as string | undefined)?.trim() ?? ''
    const li = form.getFieldValue(['fields', fieldIndex, 'labelI18n']) as I18nLabels | undefined
    setPendingFieldLabelI18n({ ...(li || {}), ...(lab ? { zh: lab } : {}) })
    setFieldLabelI18nModalIndex(fieldIndex)
  }

  const handleFieldLabelI18nSave = (i18n: I18nLabels) => {
    if (fieldLabelI18nModalIndex === null) return
    const idx = fieldLabelI18nModalIndex
    const zh = (i18n.zh ?? '').trim()
    form.setFieldValue(['fields', idx, 'labelI18n'], i18n)
    form.setFieldValue(['fields', idx, 'label'], zh || (form.getFieldValue(['fields', idx, 'label']) as string) || '')
    setFieldLabelI18nModalIndex(null)
    messageApi.success('字段名称多语言已保存')
  }

  const handleSave = async () => {
    try {
      const v = await form.validateFields()
      const relKey = String(v.key ?? '').trim()
      const zh = String(v.labelZh ?? '').trim()
      if (!relKey) {
        messageApi.error('请填写关联关系 key')
        return
      }
      const nameI18n: I18nLabels = { ...pendingNameI18n, zh }
      const rawRows = (v.fields ?? []) as {
        key: string
        label: string
        labelI18n?: I18nLabels
        type: WikiRelationFieldType
        selectOptions?: WikiRelationSelectOption[]
      }[]
      const seen = new Set<string>()
      for (const row of rawRows) {
        const k = String(row.key ?? '').trim()
        if (!k) {
          messageApi.error('字段 key 不能为空')
          return
        }
        if (seen.has(k)) {
          messageApi.error(`字段 key 重复：${k}`)
          return
        }
        seen.add(k)
      }
      const fields: WikiRelationFieldDef[] = []
      for (const row of rawRows) {
        const k = String(row.key ?? '').trim()
        const label = String(row.label ?? '').trim()
        const mergedLabelI18n: I18nLabels = {
          ...(row.labelI18n && typeof row.labelI18n === 'object' ? row.labelI18n : {}),
          zh: label || (row.labelI18n?.zh ?? ''),
        }
        const type = row.type
        if (type === 'select') {
          const rawOpts = Array.isArray(row.selectOptions) ? row.selectOptions : []
          if (!rawOpts.length) {
            messageApi.error(`下拉类型字段「${label || k}」请至少添加一个选项`)
            return
          }
          const seenVal = new Set<string>()
          for (const o of rawOpts) {
            const vv = String(o?.value ?? '').trim()
            if (!vv) {
              messageApi.error(`下拉字段「${label || k}」存在空技术值，请在抽屉中补全`)
              return
            }
            if (seenVal.has(vv)) {
              messageApi.error(`下拉字段「${label || k}」选项技术值重复：${vv}`)
              return
            }
            seenVal.add(vv)
          }
          const selectOptions: WikiRelationSelectOption[] = rawOpts.map((o) => {
            const zh = (o.labelI18n?.zh ?? o.label ?? '').trim() || String(o.value).trim()
            return {
              value: String(o.value).trim(),
              label: zh,
              labelI18n: { ...o.labelI18n, zh },
            }
          })
          fields.push({
            key: k,
            label,
            labelI18n: mergedLabelI18n,
            type,
            selectOptions,
          })
        } else {
          fields.push({
            key: k,
            label,
            labelI18n: mergedLabelI18n,
            type,
          })
        }
      }
      if (fields.length === 0) {
        messageApi.error('请至少保留一个字段')
        return
      }
      const row: WikiRelationDefinition = {
        key: relKey,
        nameI18n,
        sourceSchemaId: editing ? editing.sourceSchemaId : v.sourceSchemaId,
        targetSchemaId: editing ? editing.targetSchemaId : v.targetSchemaId,
        fields,
      }
      if (editing) {
        if (editing.key !== relKey) {
          messageApi.error('编辑时不允许修改 key')
          return
        }
        updateRelations((prev) => prev.map((x) => (x.key === relKey ? row : x)))
        messageApi.success('已更新')
      } else {
        if (relations.some((x) => x.key === relKey)) {
          messageApi.error('key 已存在')
          return
        }
        updateRelations((prev) => [...prev, row])
        messageApi.success('已新增')
      }
      setModalOpen(false)
      setPendingNameI18n({})
      setFieldLabelI18nModalIndex(null)
    } catch {
      /* validateFields */
    }
  }

  const handleDelete = (key: string) => {
    updateRelations((prev) => prev.filter((r) => r.key !== key))
    updateInstanceRows((prev) => prev.filter((r) => r.relationKey !== key))
    messageApi.success('已删除')
  }

  const columns = [
    {
      title: '关联关系 Key',
      dataIndex: 'key',
      key: 'k',
      width: 160,
      render: (k: string) => (
        <code style={{ fontSize: 12, background: '#F3F4F6', padding: '2px 6px', borderRadius: 4 }}>{k}</code>
      ),
    },
    {
      title: '名称',
      key: 'nm',
      width: 200,
      render: (_: unknown, r: WikiRelationDefinition) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 500 }}>{relationDisplayName(r)}</span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {LANGUAGES.filter((l) => r.nameI18n?.[l.code]?.trim()).map((l) => (
                <span
                  key={l.code}
                  style={{
                    fontSize: 10,
                    color: '#6B7280',
                    background: '#F3F4F6',
                    padding: '1px 5px',
                    borderRadius: 3,
                  }}
                >
                  {l.code}
                </span>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '源 schema',
      dataIndex: 'sourceSchemaId',
      key: 'src',
      width: 168,
      render: (v: string) => <span style={{ fontSize: 13, color: '#374151' }}>{formatWikiSchemaIdCell(v)}</span>,
    },
    {
      title: '目标 schema',
      dataIndex: 'targetSchemaId',
      key: 'tgt',
      width: 168,
      render: (v: string) => <span style={{ fontSize: 13, color: '#374151' }}>{formatWikiSchemaIdCell(v)}</span>,
    },
    {
      title: '字段数',
      key: 'fc',
      width: 80,
      align: 'center' as const,
      render: (_: unknown, r: WikiRelationDefinition) => r.fields.length,
    },
    {
      title: '操作',
      key: 'act',
      width: 220,
      render: (_: unknown, r: WikiRelationDefinition) => (
        <Space size={4} wrap>
          <Tooltip title="维护每条关联实例上的字段值（MOCK）">
            <Link href={`/wiki/relations/${encodeURIComponent(r.key)}/data`}>
              <Button size="small" type="link" icon={<Database size={13} />}>
                关联数据
              </Button>
            </Link>
          </Tooltip>
          <Button size="small" type="text" icon={<Edit2 size={13} />} onClick={() => openEdit(r)}>
            编辑
          </Button>
          <Popconfirm title="删除该关联关系？" description="将同时移除本地 MOCK 关联数据行。" onConfirm={() => handleDelete(r.key)}>
            <Button size="small" type="text" danger icon={<Trash2 size={13} />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {contextHolder}
      <PageBreadcrumb items={[{ label: 'Wiki 管理', href: '/wiki' }, { label: '关联关系' }]} />

      <ForumSelectRequired>
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
              维护关联定义：源/目标 schema 与本关联下全部<strong>可扩展字段</strong>。这些字段在 Wiki 详情配置的关联表格中由用户<strong>勾选展示哪些列</strong>；「关联数据」页维护每条关联实例上的字段值（MOCK）。
            </p>
            <Button type="primary" icon={<Plus size={14} />} style={{ borderRadius: 6 }} onClick={openAdd}>
              新增关联关系
            </Button>
          </div>
          <div style={{ padding: 16 }}>
            <Table rowKey="key" size="small" pagination={false} dataSource={sorted} columns={columns} />
          </div>
        </div>
      </ForumSelectRequired>

      <Modal
        title={editing ? '编辑关联关系' : '新增关联关系'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => {
          setModalOpen(false)
          setPendingNameI18n({})
          setFieldLabelI18nModalIndex(null)
        }}
        width={760}
        forceRender
        destroyOnHidden={false}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="key"
            label="关联关系 Key"
            rules={[
              { required: true, message: '必填' },
              { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '字母数字下划线，不以数字开头' },
            ]}
          >
            <Input placeholder="如 drop_from" disabled={!!editing} />
          </Form.Item>
          <Form.Item label="关联关系名称" required style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Form.Item name="labelZh" noStyle rules={[{ required: true, message: '请输入名称' }]}>
                <Input
                  placeholder="默认简体中文"
                  style={{ flex: 1 }}
                  onChange={(e) => setPendingNameI18n((p) => ({ ...p, zh: e.target.value }))}
                />
              </Form.Item>
              <Tooltip title="多语言">
                <Button
                  type="text"
                  icon={<Languages size={16} />}
                  style={{ color: '#1677FF', marginTop: 4 }}
                  onClick={() => {
                    const z = (form.getFieldValue('labelZh') as string | undefined)?.trim() ?? ''
                    setPendingNameI18n((p) => ({ ...p, ...(z ? { zh: z } : {}) }))
                    setNameI18nModalOpen(true)
                  }}
                />
              </Tooltip>
            </div>
          </Form.Item>
          <Form.Item name="sourceSchemaId" label="源Wiki" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={SCHEMA_ID_SELECT_OPTIONS}
              disabled={!!editing}
            />
          </Form.Item>
          <Form.Item name="targetSchemaId" label="目标Wiki" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={SCHEMA_ID_SELECT_OPTIONS}
              disabled={!!editing}
            />
          </Form.Item>

          <div style={{ fontSize: 13, fontWeight: 600, margin: '12px 0 8px' }}>
            可扩展字段
          </div>
          <Form.List name="fields">
            {(fields, { add, remove }) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {fields.map(({ key, name }) => (
                  <div
                    key={key}
                    style={{
                      paddingBottom: 10,
                      borderBottom: '1px dashed #E5E7EB',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'nowrap',
                        alignItems: 'center',
                        gap: 8,
                        overflowX: 'auto',
                      }}
                    >
                      <Form.Item
                        name={[name, 'key']}
                        rules={[{ required: true, message: 'key' }]}
                        style={{ marginBottom: 0, flexShrink: 0 }}
                      >
                        <Input placeholder="字段 key" style={{ width: 120 }} />
                      </Form.Item>
                      <Form.Item style={{ marginBottom: 0, flexShrink: 0 }}>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <Form.Item name={[name, 'label']} noStyle rules={[{ required: true, message: '名称' }]}>
                            <Input
                              placeholder="默认简体中文"
                              style={{ width: 140 }}
                              onChange={(e) => {
                                const v = e.target.value
                                const li = form.getFieldValue(['fields', name, 'labelI18n']) as
                                  | I18nLabels
                                  | undefined
                                form.setFieldValue(['fields', name, 'labelI18n'], {
                                  ...(li && typeof li === 'object' ? li : {}),
                                  zh: v,
                                })
                              }}
                            />
                          </Form.Item>
                          <Tooltip title="多语言">
                            <Button
                              type="text"
                              size="small"
                              icon={<Languages size={14} />}
                              style={{ color: '#1677FF', flexShrink: 0 }}
                              onClick={() => openFieldLabelI18nModal(name)}
                            />
                          </Tooltip>
                        </div>
                      </Form.Item>
                      <Form.Item
                        name={[name, 'type']}
                        rules={[{ required: true }]}
                        style={{ marginBottom: 0, flexShrink: 0 }}
                      >
                        <Select options={WIKI_RELATION_FIELD_TYPE_OPTIONS} style={{ width: 220 }} />
                      </Form.Item>
                      <Button
                        type="text"
                        danger
                        size="small"
                        style={{ flexShrink: 0 }}
                        onClick={() => remove(name)}
                      >
                        删
                      </Button>
                    </div>
                    <Form.Item noStyle dependencies={[['fields', name, 'type']]}>
                      {() =>
                        form.getFieldValue(['fields', name, 'type']) === 'select' ? (
                          <Form.Item
                            name={[name, 'selectOptions']}
                            style={{ marginTop: 6, marginBottom: 0 }}
                            rules={[
                              {
                                validator: async (_, val) => {
                                  const t = form.getFieldValue(['fields', name, 'type'])
                                  if (t !== 'select') return
                                  const opts = Array.isArray(val) ? val : []
                                  if (!opts.length) throw new Error('请至少添加一个选项')
                                },
                              },
                            ]}
                          >
                            <RelationFieldSelectOptionsEditor />
                          </Form.Item>
                        ) : null
                      }
                    </Form.Item>
                  </div>
                ))}
                <Button
                  type="dashed"
                  size="small"
                  onClick={() =>
                    add({ type: 'text', key: '', label: '', labelI18n: { zh: '' }, selectOptions: [] })
                  }
                >
                  + 字段
                </Button>
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>

      <FieldI18nModal
        open={nameI18nModalOpen}
        fieldKey="relation_name"
        fieldLabel={
          (pendingNameI18n.zh ?? (modalOpen ? String(form.getFieldValue('labelZh') ?? '') : '') ?? '').trim() ||
          '名称'
        }
        i18n={pendingNameI18n}
        onSave={handleNameI18nSave}
        onCancel={() => setNameI18nModalOpen(false)}
      />

      {fieldLabelI18nModalIndex !== null ? (
        <FieldI18nModal
          key={`field-label-i18n-${fieldLabelI18nModalIndex}`}
          open
          fieldKey={String(form.getFieldValue(['fields', fieldLabelI18nModalIndex, 'key']) ?? '').trim() || `field_${fieldLabelI18nModalIndex}`}
          fieldLabel={
            (pendingFieldLabelI18n.zh ?? '').trim() ||
            String(form.getFieldValue(['fields', fieldLabelI18nModalIndex, 'label']) ?? '').trim() ||
            '显示名称'
          }
          i18n={pendingFieldLabelI18n}
          onSave={handleFieldLabelI18nSave}
          onCancel={() => setFieldLabelI18nModalIndex(null)}
        />
      ) : null}
    </div>
  )
}
