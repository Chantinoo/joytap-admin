'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Form, Input, Button, Select, Spin, message } from 'antd'
import { Plus, Trash2, Wand2 } from 'lucide-react'
import {
  LANGUAGES,
  mockTranslateFieldI18n,
  type I18nLabels,
  type LangCode,
} from '../wiki/components/fieldI18nConstants'
import { mergeLinkI18n, mergeNameI18n } from '../lib/collectionPageLocale'
import type { CollectionPageData } from '../types'

const { Option } = Select

type Row = { id: string; lang: LangCode; name: string; link: string }

function rowId() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function langLabel(code: LangCode) {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code
}

function buildRowsFromPage(page: CollectionPageData): Row[] {
  const nameM = mergeNameI18n(page)
  const linkM = mergeLinkI18n(page)
  const langs = new Set<LangCode>()
  for (const l of LANGUAGES) {
    if (nameM[l.code]?.trim() || linkM[l.code]?.trim()) {
      langs.add(l.code)
    }
  }
  if (langs.size === 0) {
    return [
      {
        id: rowId(),
        lang: 'zh',
        name: page.name?.trim() ?? '',
        link: (page.link ?? '').trim(),
      },
    ]
  }
  return LANGUAGES.filter((l) => langs.has(l.code)).map((l) => ({
    id: rowId(),
    lang: l.code,
    name: nameM[l.code]?.trim() ?? '',
    link: linkM[l.code]?.trim() ?? '',
  }))
}

function firstUnusedLang(used: Set<LangCode>): LangCode | null {
  const next = LANGUAGES.find((l) => !used.has(l.code))
  return next?.code ?? null
}

export interface CollectionPageEditFormProps {
  page: CollectionPageData
  onSave: (next: { nameI18n: I18nLabels; linkI18n: I18nLabels }) => void
  onCancel: () => void
}

export default function CollectionPageEditForm({ page, onSave, onCancel }: CollectionPageEditFormProps) {
  const [rows, setRows] = useState<Row[]>(() => buildRowsFromPage(page))
  const [sourceLang, setSourceLang] = useState<LangCode>('zh')
  const [translating, setTranslating] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  useEffect(() => {
    setRows(buildRowsFromPage(page))
    setSourceLang('zh')
  }, [page])

  const usedLangs = useMemo(() => new Set(rows.map((r) => r.lang)), [rows])

  const updateRow = (id: string, patch: Partial<Pick<Row, 'lang' | 'name' | 'link'>>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const removeRow = (id: string) => {
    setRows((prev) => {
      if (prev.length <= 1) {
        messageApi.warning('至少保留一行')
        return prev
      }
      return prev.filter((r) => r.id !== id)
    })
  }

  const addRow = () => {
    const lang = firstUnusedLang(usedLangs)
    if (!lang) {
      messageApi.warning('已添加全部支持语种')
      return
    }
    setRows((prev) => [...prev, { id: rowId(), lang, name: '', link: '' }])
  }

  const handleTranslate = async () => {
    const sourceRow = rows.find((r) => r.lang === sourceLang)
    const sourceText = sourceRow?.name?.trim() ?? ''
    if (!sourceText) {
      messageApi.warning(`请先在「${langLabel(sourceLang)}」行填写名称`)
      return
    }
    const targetLangs = LANGUAGES.map((l) => l.code).filter((c) => c !== sourceLang) as LangCode[]
    setTranslating(true)
    try {
      const result = await mockTranslateFieldI18n(sourceText, sourceLang, targetLangs)
      setRows((prev) => {
        const next = [...prev]
        const byLang = new Map(next.map((r) => [r.lang, r] as const))
        for (const code of targetLangs) {
          const text = result[code]?.trim()
          if (!text) continue
          const existing = byLang.get(code)
          if (existing) {
            const idx = next.findIndex((r) => r.id === existing.id)
            if (idx >= 0) next[idx] = { ...next[idx], name: text }
          } else {
            const id = rowId()
            next.push({ id, lang: code, name: text, link: '' })
            byLang.set(code, next[next.length - 1])
          }
        }
        return next
      })
      messageApi.success('AI 翻译完成')
    } finally {
      setTranslating(false)
    }
  }

  const handleSubmit = () => {
    const seen = new Set<LangCode>()
    for (const r of rows) {
      if (seen.has(r.lang)) {
        messageApi.error(`语种「${langLabel(r.lang)}」重复，请每行选择不同语种`)
        return
      }
      seen.add(r.lang)
    }
    const prunedName: I18nLabels = {}
    const prunedLink: I18nLabels = {}
    for (const r of rows) {
      const t = r.name.trim()
      const u = r.link.trim()
      if (t) prunedName[r.lang] = t
      if (u) prunedLink[r.lang] = u
    }
    if (Object.keys(prunedName).length === 0) {
      messageApi.error('请至少填写一行集合页名称')
      return
    }
    if (Object.keys(prunedLink).length === 0) {
      messageApi.error('请至少填写一行前台链接路径')
      return
    }
    onSave({ nameI18n: prunedName, linkI18n: prunedLink })
  }

  return (
    <div style={{ marginTop: 4 }}>
      {contextHolder}

      <div
        style={{
          marginBottom: 14,
          padding: '12px 14px',
          background: '#F0F9FF',
          border: '1px solid #BAE6FD',
          borderRadius: 8,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 12, color: '#0C4A6E', flex: '1 1 200px' }}>
          名称可一键翻译到其它已选语种；<strong>链接</strong>请按行手动填写（各语种可不同）。
        </span>
        <Select
          value={sourceLang}
          onChange={setSourceLang}
          size="small"
          style={{ width: 160 }}
          popupMatchSelectWidth={false}
        >
          {LANGUAGES.map((l) => (
            <Option key={l.code} value={l.code}>
              {l.label}
            </Option>
          ))}
        </Select>
        <Button
          size="small"
          type="primary"
          icon={translating ? <Spin size="small" /> : <Wand2 size={12} />}
          onClick={handleTranslate}
          disabled={translating}
        >
          {translating ? '翻译中…' : 'AI 翻译名称'}
        </Button>
      </div>

      <Form layout="vertical" requiredMark>
        <Form.Item
          label="集合页配置"
          required
          style={{ marginBottom: 10 }}
          tooltip="每行选择一个语种，填写该语种下的展示名称与前台路径"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map((r) => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  background: '#FAFAFA',
                  borderRadius: 8,
                  border: '1px solid #F0F0F0',
                }}
              >
                <Select
                  value={r.lang}
                  onChange={(code: LangCode) => {
                    if (rows.some((x) => x.id !== r.id && x.lang === code)) {
                      messageApi.warning('该语种已在其它行使用')
                      return
                    }
                    updateRow(r.id, { lang: code })
                  }}
                  style={{ width: 148, flexShrink: 0 }}
                  popupMatchSelectWidth={false}
                >
                  {LANGUAGES.map((l) => (
                    <Option
                      key={l.code}
                      value={l.code}
                      disabled={usedLangs.has(l.code) && l.code !== r.lang}
                    >
                      {l.label}
                    </Option>
                  ))}
                </Select>
                <Input
                  value={r.name}
                  onChange={(e) => updateRow(r.id, { name: e.target.value })}
                  placeholder="展示名称"
                  style={{ flex: '1 1 140px', minWidth: 120 }}
                />
                <Input
                  value={r.link}
                  onChange={(e) => updateRow(r.id, { link: e.target.value })}
                  placeholder="如 /zh/collection/6、/zh-tw/collection/6、/en/collection/6"
                  style={{ flex: '1 1 180px', minWidth: 160 }}
                />
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<Trash2 size={16} />}
                  onClick={() => removeRow(r.id)}
                  style={{ flexShrink: 0 }}
                  aria-label="删除该行"
                />
              </div>
            ))}
          </div>
        </Form.Item>

        <Button type="dashed" block icon={<Plus size={14} />} onClick={addRow} style={{ marginBottom: 8 }}>
          添加语种
        </Button>
      </Form>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid #F0F0F0' }}>
        <Button onClick={onCancel}>取消</Button>
        <Button type="primary" onClick={handleSubmit}>
          确定
        </Button>
      </div>
    </div>
  )
}
