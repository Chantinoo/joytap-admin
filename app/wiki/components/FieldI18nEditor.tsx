'use client'

import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Select, Tag, Spin, message } from 'antd'
import { Wand2 } from 'lucide-react'
import { LANGUAGES, mockTranslateFieldI18n, type I18nLabels, type LangCode } from './fieldI18nConstants'

const { Option } = Select

export interface FieldI18nEditorProps {
  i18n: I18nLabels
  fieldLabel: string
  onSave: (next: I18nLabels) => void
  onCancel: () => void
  /** 紧凑布局（气泡内） */
  compact?: boolean
}

/**
 * 多语言表单本体（无 Modal 外壳），供弹窗 / 抽屉 / 气泡 / 行内展开复用。
 */
export default function FieldI18nEditor({ i18n, fieldLabel, onSave, onCancel, compact }: FieldI18nEditorProps) {
  const [values, setValues] = useState<I18nLabels>({ ...i18n })
  const [sourceLang, setSourceLang] = useState<LangCode>('zh')
  const [translating, setTranslating] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  useEffect(() => {
    setValues({ ...i18n })
  }, [i18n])

  const handleTranslate = async () => {
    const sourceText = values[sourceLang] || fieldLabel
    if (!sourceText) { messageApi.warning('请先填写源语言内容'); return }
    const targetLangs = LANGUAGES.map(l => l.code).filter(c => c !== sourceLang) as LangCode[]
    setTranslating(true)
    try {
      const result = await mockTranslateFieldI18n(sourceText, sourceLang, targetLangs)
      setValues(prev => ({ ...prev, ...result }))
      messageApi.success('AI 翻译完成')
    } finally {
      setTranslating(false)
    }
  }

  const gap = compact ? 10 : 16
  const itemMb = compact ? 8 : 12
  const aiCardPad = compact ? '10px 12px' : '14px 16px'
  const aiInnerGap = compact ? 10 : 12

  return (
    <div style={{ marginTop: compact ? 0 : 8 }}>
      {contextHolder}
      {/* AI 翻译：上下分层，说明与操作区分离，避免窄屏下挤成一团 */}
      <div
        style={{
          marginBottom: gap,
          padding: aiCardPad,
          background: '#F0F9FF',
          border: '1px solid #BAE6FD',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: aiInnerGap,
        }}
      >
        <p style={{ margin: 0, fontSize: compact ? 12 : 13, color: '#0C4A6E', lineHeight: 1.55 }}>
          选择源语言后，可一键将文案翻译到其余语种（基于当前已填内容）。
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            rowGap: 10,
          }}
        >
          <span style={{ fontSize: compact ? 12 : 13, color: '#0369A1', fontWeight: 500, flexShrink: 0 }}>
            源语言
          </span>
          <Select
            value={sourceLang}
            onChange={setSourceLang}
            size="small"
            style={{ minWidth: compact ? 132 : 148, flex: '1 1 132px', maxWidth: 220 }}
            popupMatchSelectWidth={false}
          >
            {LANGUAGES.map(l => (
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
            {translating ? '翻译中…' : 'AI 翻译'}
          </Button>
        </div>
      </div>

      <Form layout="vertical">
        {LANGUAGES.map(lang => (
          <Form.Item
            key={lang.code}
            label={
              <span style={{ fontSize: compact ? 12 : 13 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6B7280', background: '#F3F4F6', padding: '1px 5px', borderRadius: 3, marginRight: 6 }}>{lang.code}</span>
                {lang.label}
                {lang.code === sourceLang && <Tag color="blue" style={{ marginLeft: 6, fontSize: 11 }}>源语言</Tag>}
              </span>
            }
            style={{ marginBottom: itemMb }}
          >
            <Input
              value={values[lang.code] ?? ''}
              onChange={e => setValues(prev => ({ ...prev, [lang.code]: e.target.value }))}
              placeholder={`请输入${lang.label}名称`}
              size={compact ? 'small' : 'middle'}
              suffix={
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, minHeight: 18 }}>
                  {translating && lang.code !== sourceLang ? <Spin size="small" /> : '\u00a0'}
                </span>
              }
            />
          </Form.Item>
        ))}
      </Form>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: compact ? 8 : 16, paddingTop: 8, borderTop: '1px solid #F3F4F6' }}>
        <Button onClick={onCancel}>取消</Button>
        <Button type="primary" onClick={() => onSave(values)}>保存</Button>
      </div>
    </div>
  )
}
