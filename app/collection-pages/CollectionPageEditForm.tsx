'use client'

import React, { useEffect, useState } from 'react'
import { Form, Input, Button, Select, Tag, Spin, message } from 'antd'
import { Wand2 } from 'lucide-react'
import {
  LANGUAGES,
  mockTranslateFieldI18n,
  type I18nLabels,
  type LangCode,
} from '../wiki/components/fieldI18nConstants'
import { mergeLinkI18n, mergeNameI18n } from '../lib/collectionPageLocale'
import type { CollectionPageData } from '../types'

const { Option } = Select

export interface CollectionPageEditFormProps {
  page: CollectionPageData
  onSave: (next: { nameI18n: I18nLabels; linkI18n: I18nLabels }) => void
  onCancel: () => void
}

export default function CollectionPageEditForm({ page, onSave, onCancel }: CollectionPageEditFormProps) {
  const [nameValues, setNameValues] = useState<I18nLabels>(() => ({ ...mergeNameI18n(page) }))
  const [linkValues, setLinkValues] = useState<I18nLabels>(() => ({ ...mergeLinkI18n(page) }))
  const [sourceLang, setSourceLang] = useState<LangCode>('zh')
  const [translating, setTranslating] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  useEffect(() => {
    setNameValues({ ...mergeNameI18n(page) })
    setLinkValues({ ...mergeLinkI18n(page) })
  }, [page])

  const handleTranslate = async () => {
    const sourceText = nameValues[sourceLang] ?? ''
    if (!sourceText.trim()) {
      messageApi.warning('请先填写源语言名称')
      return
    }
    const targetLangs = LANGUAGES.map((l) => l.code).filter((c) => c !== sourceLang) as LangCode[]
    setTranslating(true)
    try {
      const result = await mockTranslateFieldI18n(sourceText, sourceLang, targetLangs)
      setNameValues((prev) => ({ ...prev, ...result }))
      messageApi.success('AI 翻译完成')
    } finally {
      setTranslating(false)
    }
  }

  const handleSubmit = () => {
    const prunedName: I18nLabels = {}
    const prunedLink: I18nLabels = {}
    for (const l of LANGUAGES) {
      const t = nameValues[l.code]?.trim()
      if (t) prunedName[l.code] = t
      const u = linkValues[l.code]?.trim()
      if (u) prunedLink[l.code] = u
    }
    if (Object.keys(prunedName).length === 0) {
      messageApi.error('请至少填写一个语种的集合页名称')
      return
    }
    if (Object.keys(prunedLink).length === 0) {
      messageApi.error('请至少填写一个语种的前台链接路径（建议先填简体中文）')
      return
    }
    onSave({ nameI18n: prunedName, linkI18n: prunedLink })
  }

  const gap = 16
  const itemMb = 12

  return (
    <div style={{ marginTop: 8 }}>
      {contextHolder}
      <div
        style={{
          marginBottom: gap,
          padding: '14px 16px',
          background: '#F0F9FF',
          border: '1px solid #BAE6FD',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <p style={{ margin: 0, fontSize: 13, color: '#0C4A6E', lineHeight: 1.55 }}>
          名称支持 AI 翻译；各语种<strong>链接需手动填写</strong>（可与前台路由约定，如 <code>/en/collection/6</code>）。
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', rowGap: 10 }}>
          <span style={{ fontSize: 13, color: '#0369A1', fontWeight: 500, flexShrink: 0 }}>名称 · 源语言</span>
          <Select
            value={sourceLang}
            onChange={setSourceLang}
            size="small"
            style={{ minWidth: 148, flex: '1 1 132px', maxWidth: 220 }}
            popupMatchSelectWidth={false}
          >
            {LANGUAGES.map((l) => (
              <Option key={l.code} value={l.code}>
                <span style={{ fontFamily: 'monospace', fontSize: 12, marginRight: 4 }}>{l.code}</span> {l.label}
              </Option>
            ))}
          </Select>
          <Button
            size="small"
            type="primary"
            icon={translating ? <Spin size="small" /> : <Wand2 size={12} />}
            onClick={handleTranslate}
            disabled={translating}
            style={{ borderRadius: 6, flexShrink: 0, marginLeft: 'auto' }}
          >
            {translating ? '翻译中…' : 'AI 翻译名称'}
          </Button>
        </div>
      </div>

      <Form layout="vertical">
        {LANGUAGES.map((lang) => (
          <Form.Item
            key={lang.code}
            style={{ marginBottom: itemMb }}
            label={
              <span style={{ fontSize: 13 }}>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 12,
                    color: '#6B7280',
                    background: '#F3F4F6',
                    padding: '1px 5px',
                    borderRadius: 3,
                    marginRight: 6,
                  }}
                >
                  {lang.code}
                </span>
                {lang.label}
                {lang.code === sourceLang ? (
                  <Tag color="blue" style={{ marginLeft: 6, fontSize: 11 }}>
                    名称源语言
                  </Tag>
                ) : null}
              </span>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Input
                value={nameValues[lang.code] ?? ''}
                onChange={(e) => setNameValues((prev) => ({ ...prev, [lang.code]: e.target.value }))}
                placeholder={`${lang.label}下的展示名称`}
                suffix={
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 18,
                      minHeight: 18,
                    }}
                  >
                    {translating && lang.code !== sourceLang ? <Spin size="small" /> : '\u00a0'}
                  </span>
                }
              />
              <Input
                value={linkValues[lang.code] ?? ''}
                onChange={(e) => setLinkValues((prev) => ({ ...prev, [lang.code]: e.target.value }))}
                placeholder="前台路径，如 /collection/6 或 /en/collection/6"
              />
            </div>
          </Form.Item>
        ))}
      </Form>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          marginTop: 16,
          paddingTop: 8,
          borderTop: '1px solid #F3F4F6',
        }}
      >
        <Button onClick={onCancel}>取消</Button>
        <Button type="primary" onClick={handleSubmit}>
          保存
        </Button>
      </div>
    </div>
  )
}
