'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, message, Alert } from 'antd'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import PageBreadcrumb from '../../../../components/PageBreadcrumb'
import type { WikiRelationDefinition, WikiRelationInstanceRow } from '../../../config/wikiRelationDefinitions'
import { relationDisplayName, relationSelectOptionDisplayLabel } from '../../../config/wikiRelationDefinitions'
import { useWikiRelationsRegistry, type WikiRelationsRegistryValue } from '../../../config/WikiRelationsRegistry'

function RelationDataNotFound({ relationKey }: { relationKey: string }) {
  return (
    <div style={{ padding: 24 }}>
      <PageBreadcrumb
        items={[
          { label: 'Wiki 管理', href: '/wiki' },
          { label: '关联关系', href: '/wiki/relations' },
          { label: '数据' },
        ]}
      />
      <Alert type="error" showIcon title="未找到关联关系" description={`key: ${relationKey}`} style={{ marginTop: 16 }} />
      <Link href="/wiki/relations" style={{ display: 'inline-block', marginTop: 16 }}>
        <Button>返回</Button>
      </Link>
    </div>
  )
}

function WikiRelationDataInner({
  relation,
  relationKey,
  instanceRows,
  updateInstanceRows,
}: {
  relation: WikiRelationDefinition
  relationKey: string
  instanceRows: WikiRelationInstanceRow[]
  updateInstanceRows: WikiRelationsRegistryValue['updateInstanceRows']
}) {
  const [messageApi, contextHolder] = message.useMessage()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm()

  const rows = useMemo(
    () => instanceRows.filter((r) => r.relationKey === relationKey),
    [instanceRows, relationKey],
  )

  const openAdd = () => {
    setEditingId(null)
    form.resetFields()
    const init: Record<string, unknown> = {
      sourceCardId: '',
      targetCardId: '',
    }
    relation.fields.forEach((f) => {
      if (f.type === 'number') init[f.key] = 0
      else if (f.type === 'select') init[f.key] = undefined
      else init[f.key] = ''
    })
    form.setFieldsValue(init)
    setModalOpen(true)
  }

  const openEdit = (row: WikiRelationInstanceRow) => {
    setEditingId(row.id)
    form.setFieldsValue({
      sourceCardId: row.sourceCardId ?? '',
      targetCardId: row.targetCardId ?? '',
      ...row.extraValues,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    try {
      const v = await form.validateFields()
      const extraValues: Record<string, string | number | boolean> = {}
      relation.fields.forEach((f) => {
        const val = v[f.key]
        if (f.type === 'number') extraValues[f.key] = Number(val) || 0
        else extraValues[f.key] = val == null ? '' : String(val)
      })
      const base: WikiRelationInstanceRow = {
        id: editingId ?? `inst_${Date.now()}`,
        relationKey,
        sourceCardId: String(v.sourceCardId ?? '').trim() || undefined,
        targetCardId: String(v.targetCardId ?? '').trim() || undefined,
        extraValues,
      }
      if (editingId) {
        updateInstanceRows((prev) => prev.map((r) => (r.id === editingId ? base : r)))
        messageApi.success('已更新')
      } else {
        updateInstanceRows((prev) => [...prev, base])
        messageApi.success('已新增')
      }
      setModalOpen(false)
    } catch {
      /* validate */
    }
  }

  const handleDelete = (id: string) => {
    updateInstanceRows((prev) => prev.filter((r) => r.id !== id))
    messageApi.success('已删除')
  }

  const columns = [
    { title: '实例 ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: '源卡片 ID', dataIndex: 'sourceCardId', key: 'src', width: 100 },
    { title: '目标卡片 ID', dataIndex: 'targetCardId', key: 'tgt', width: 100 },
    ...relation.fields.map((f) => ({
      title: f.label,
      key: `opt_${f.key}`,
      width: 120,
      render: (_: unknown, r: WikiRelationInstanceRow) => {
        const val = r.extraValues[f.key]
        if (f.type === 'select' && f.selectOptions?.length && val != null && val !== '') {
          const opt = f.selectOptions.find((o) => o.value === String(val))
          return opt ? relationSelectOptionDisplayLabel(opt) : String(val)
        }
        return val === undefined || val === null ? '—' : String(val)
      },
    })),
    {
      title: '操作',
      key: 'act',
      width: 140,
      render: (_: unknown, r: WikiRelationInstanceRow) => (
        <Space>
          <Button type="text" size="small" icon={<Edit2 size={13} />} onClick={() => openEdit(r)} />
          <Button type="text" size="small" danger icon={<Trash2 size={13} />} onClick={() => handleDelete(r.id)} />
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 20px 32px' }}>
      {contextHolder}
      <PageBreadcrumb
        items={[
          { label: 'Wiki 管理', href: '/wiki' },
          { label: '关联关系', href: '/wiki/relations' },
          { label: `${relationDisplayName(relation)} · 关联数据` },
        ]}
      />
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{relationDisplayName(relation)}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
              <code>{relation.key}</code> · 可配置字段 {relation.fields.length} 个（MOCK）
            </div>
          </div>
          <Space>
            <Link href="/wiki/relations">
              <Button>返回列表</Button>
            </Link>
            <Button type="primary" icon={<Plus size={14} />} onClick={openAdd}>
              新增实例
            </Button>
          </Space>
        </div>
        <Table rowKey="id" size="small" dataSource={rows} columns={columns} pagination={false} scroll={{ x: true }} />
      </div>

      <Modal
        title={editingId ? '编辑实例' : '新增实例'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        width={520}
        forceRender
        destroyOnHidden={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="sourceCardId" label="源卡片 ID（可选）">
            <Input placeholder="如 1001" />
          </Form.Item>
          <Form.Item name="targetCardId" label="目标卡片 ID（可选）">
            <Input placeholder="如 2003" />
          </Form.Item>
          {relation.fields.map((f) => {
            if (f.type === 'number') {
              return (
                <Form.Item key={f.key} name={f.key} label={f.label}>
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              )
            }
            if (f.type === 'select' && f.selectOptions?.length) {
              return (
                <Form.Item key={f.key} name={f.key} label={f.label}>
                  <Select
                    allowClear
                    options={f.selectOptions.map((o) => ({
                      label: relationSelectOptionDisplayLabel(o),
                      value: o.value,
                    }))}
                  />
                </Form.Item>
              )
            }
            return (
              <Form.Item key={f.key} name={f.key} label={f.label}>
                <Input />
              </Form.Item>
            )
          })}
        </Form>
      </Modal>
    </div>
  )
}

export default function WikiRelationDataPageClient({ relationKey }: { relationKey: string }) {
  const { relations, instanceRows, updateInstanceRows } = useWikiRelationsRegistry()
  const relation = useMemo(() => relations.find((r) => r.key === relationKey), [relations, relationKey])

  if (!relation) {
    return <RelationDataNotFound relationKey={relationKey} />
  }

  return (
    <WikiRelationDataInner
      relation={relation}
      relationKey={relationKey}
      instanceRows={instanceRows}
      updateInstanceRows={updateInstanceRows}
    />
  )
}
