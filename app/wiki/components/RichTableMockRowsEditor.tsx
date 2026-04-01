'use client'

import React, { useMemo, useState } from 'react'
import { Table, Button, Switch, Popconfirm, message, Input, Tooltip, Select } from 'antd'
import { Plus, Search, Languages } from 'lucide-react'
import type { RichTableMockRow } from '../utils/richTableMockData'
import { emptyCellsForFieldKeys, richTableCellSearchText } from '../utils/richTableMockData'
import { LINKED_TABLE_TARGET_WIKI_COLUMN_TYPE } from '../utils/linkedTableColumns'
import FieldI18nModal, { type I18nLabels } from './FieldI18nModal'
import { WIKI_META, WIKI_RELATION_OPTIONS } from '../config/wikiFieldSeed'

type ColField = { key: string; label: string; type: string }

function isMockTextColumnType(t: string): boolean {
  return t === 'text' || t === 'rich-text'
}

function padCells(row: RichTableMockRow, fieldKeys: string[]): RichTableMockRow {
  const cells = { ...row.cells }
  for (const k of fieldKeys) {
    if (cells[k] === undefined) cells[k] = ''
  }
  return { ...row, cells }
}

export default function RichTableMockRowsEditor({
  fieldKeys,
  colFields,
  rows,
  onChange,
}: {
  fieldKeys: string[]
  colFields: ColField[]
  rows: RichTableMockRow[]
  onChange: (next: RichTableMockRow[]) => void
}) {
  const [messageApi, contextHolder] = message.useMessage()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [i18nModal, setI18nModal] = useState<{
    rowKey: string
    colKey: string
    colLabel: string
  } | null>(null)

  const paddedRows = useMemo(
    () => rows.map((r) => padCells(r, fieldKeys)),
    [rows, fieldKeys],
  )

  const dataSource = useMemo(() => {
    const q = searchKeyword.trim().toLowerCase()
    if (!q) return paddedRows
    return paddedRows.filter((r) =>
      fieldKeys.some((k) => {
        const meta = colFields.find((c) => c.key === k)
        let blob = richTableCellSearchText(r, k)
        if (meta?.type === LINKED_TABLE_TARGET_WIKI_COLUMN_TYPE) {
          const wk = (r.cells[k] ?? '').trim()
          if (wk && WIKI_META[wk]) blob += ` ${WIKI_META[wk].label}`
        }
        return blob.toLowerCase().includes(q)
      }),
    )
  }, [paddedRows, fieldKeys, searchKeyword, colFields])

  const setRows = (next: RichTableMockRow[]) => onChange(next.map((r) => padCells(r, fieldKeys)))

  const updateCell = (rowKey: string, cellKey: string, value: string, opts?: { clearCellI18n?: boolean }) => {
    setRows(
      paddedRows.map((r) => {
        if (r.key !== rowKey) return r
        const nextCells = { ...r.cells, [cellKey]: value }
        if (opts?.clearCellI18n && r.cellI18n?.[cellKey]) {
          const { [cellKey]: _drop, ...restI18n } = r.cellI18n
          return {
            ...r,
            cells: nextCells,
            cellI18n: Object.keys(restI18n).length > 0 ? restI18n : undefined,
          }
        }
        if (!r.cellI18n?.[cellKey]) {
          return { ...r, cells: nextCells }
        }
        return {
          ...r,
          cells: nextCells,
          cellI18n: {
            ...r.cellI18n,
            [cellKey]: { ...r.cellI18n[cellKey], zh: value },
          },
        }
      }),
    )
  }

  const i18nModalRow = i18nModal
    ? paddedRows.find((r) => r.key === i18nModal.rowKey)
    : undefined
  const i18nModalInitial: I18nLabels =
    i18nModal && i18nModalRow
      ? {
          ...(i18nModalRow.cellI18n?.[i18nModal.colKey] ?? {}),
          zh: i18nModalRow.cellI18n?.[i18nModal.colKey]?.zh ?? i18nModalRow.cells[i18nModal.colKey] ?? '',
        }
      : {}

  const wikiSelectOptions = useMemo(
    () => WIKI_RELATION_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    [],
  )

  const dynamicColumns = fieldKeys.map((fk) => {
    const meta = colFields.find((c) => c.key === fk)
    const textCol = meta ? isMockTextColumnType(meta.type) : false
    const targetWikiCol = meta?.type === LINKED_TABLE_TARGET_WIKI_COLUMN_TYPE
    return {
      title: meta?.label ?? fk,
      key: fk,
      ellipsis: true,
      render: (_: unknown, record: RichTableMockRow) => {
        if (targetWikiCol) {
          return (
            <Select
              size="small"
              allowClear
              showSearch
              placeholder="选择目标 Wiki（MOCK）"
              style={{ width: '100%', minWidth: 160 }}
              options={wikiSelectOptions}
              value={record.cells[fk] || undefined}
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase()) ||
                String(option?.value ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              onChange={(v) =>
                updateCell(record.key, fk, (v as string) ?? '', { clearCellI18n: true })
              }
            />
          )
        }
        if (!textCol) {
          return (
            <Input
              size="small"
              value={record.cells[fk] ?? ''}
              placeholder="MOCK 展示文案"
              onChange={(e) => updateCell(record.key, fk, e.target.value)}
            />
          )
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
            <Input
              size="small"
              value={record.cells[fk] ?? ''}
              placeholder="MOCK 展示文案（默认简体）"
              style={{ flex: 1, minWidth: 0 }}
              onChange={(e) => updateCell(record.key, fk, e.target.value)}
            />
            <Tooltip title="多语言配置">
              <Button
                type="text"
                size="small"
                icon={<Languages size={14} />}
                aria-label="多语言"
                style={{ color: '#1677FF', flexShrink: 0, padding: '0 4px' }}
                onClick={() =>
                  setI18nModal({
                    rowKey: record.key,
                    colKey: fk,
                    colLabel: meta?.label ?? fk,
                  })
                }
              />
            </Tooltip>
          </div>
        )
      },
    }
  })

  const columns = [
    ...dynamicColumns,
    {
      title: '隐藏',
      key: 'hidden',
      width: 72,
      align: 'center' as const,
      render: (_: unknown, record: RichTableMockRow) => (
        <Switch
          checked={record.hidden}
          onChange={(checked) => {
            setRows(paddedRows.map((r) => (r.key === record.key ? { ...r, hidden: checked } : r)))
            messageApi.success(checked ? '已标记为隐藏' : '已取消隐藏')
          }}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 88,
      render: (_: unknown, record: RichTableMockRow) => (
        <Popconfirm
          title="确认删除该行？"
          description="当前为本地 MOCK，删除后仅影响本模块与预览。"
          okText="删除"
          cancelText="取消"
          okButtonProps={{ danger: true }}
          onConfirm={() => {
            setRows(paddedRows.filter((r) => r.key !== record.key))
            messageApi.success('已删除')
          }}
        >
          <Button size="small" danger type="link">
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ]

  const addRow = () => {
    setRows([
      ...paddedRows,
      { key: `rich_${Date.now()}`, hidden: false, cells: emptyCellsForFieldKeys(fieldKeys) },
    ])
    messageApi.success('已新增一行')
  }

  if (fieldKeys.length === 0) {
    return (
      <div style={{ color: '#9CA3AF', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
        请先在 Wiki 配置页为该普通表格勾选至少一列，再编辑行数据。
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {contextHolder}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <Input
          allowClear
          placeholder="搜索任意列内容"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          prefix={<Search size={16} style={{ color: '#9ca3af' }} />}
          style={{ flex: '1 1 220px', maxWidth: 400, minWidth: 200 }}
        />
        <Button type="primary" icon={<Plus size={14} />} onClick={addRow}>
          新增行
        </Button>
      </div>
      <Table<RichTableMockRow>
        rowKey="key"
        size="small"
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />

      {i18nModal ? (
        <FieldI18nModal
          open
          fieldKey={i18nModal.colKey}
          fieldLabel={i18nModal.colLabel}
          i18n={i18nModalInitial}
          onSave={(i18n) => {
            const zh = (i18n.zh ?? '').trim()
            setRows(
              paddedRows.map((r) => {
                if (r.key !== i18nModal.rowKey) return r
                return {
                  ...r,
                  cells: { ...r.cells, [i18nModal.colKey]: zh || (r.cells[i18nModal.colKey] ?? '') },
                  cellI18n: { ...r.cellI18n, [i18nModal.colKey]: i18n },
                }
              }),
            )
            setI18nModal(null)
            messageApi.success('多语言已保存')
          }}
          onCancel={() => setI18nModal(null)}
        />
      ) : null}
    </div>
  )
}
