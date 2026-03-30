'use client'

import React, { useMemo, useState } from 'react'
import { Table, Button, Switch, Popconfirm, message, Input } from 'antd'
import { Plus, Search } from 'lucide-react'
import type { RichTableMockRow } from '../utils/richTableMockData'
import { emptyCellsForFieldKeys } from '../utils/richTableMockData'

type ColField = { key: string; label: string; type: string }

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

  const paddedRows = useMemo(
    () => rows.map((r) => padCells(r, fieldKeys)),
    [rows, fieldKeys],
  )

  const dataSource = useMemo(() => {
    const q = searchKeyword.trim().toLowerCase()
    if (!q) return paddedRows
    return paddedRows.filter((r) =>
      fieldKeys.some((k) => (r.cells[k] ?? '').toLowerCase().includes(q)),
    )
  }, [paddedRows, fieldKeys, searchKeyword])

  const setRows = (next: RichTableMockRow[]) => onChange(next.map((r) => padCells(r, fieldKeys)))

  const updateCell = (rowKey: string, cellKey: string, value: string) => {
    setRows(
      paddedRows.map((r) =>
        r.key === rowKey ? { ...r, cells: { ...r.cells, [cellKey]: value } } : r,
      ),
    )
  }

  const dynamicColumns = fieldKeys.map((fk) => {
    const meta = colFields.find((c) => c.key === fk)
    return {
      title: meta?.label ?? fk,
      key: fk,
      ellipsis: true,
      render: (_: unknown, record: RichTableMockRow) => (
        <Input
          size="small"
          value={record.cells[fk] ?? ''}
          placeholder="MOCK 展示文案"
          onChange={(e) => updateCell(record.key, fk, e.target.value)}
        />
      ),
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
    </div>
  )
}
