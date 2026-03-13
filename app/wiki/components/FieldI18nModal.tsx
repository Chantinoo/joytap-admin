'use client'

import React, { useState } from 'react'
import { Modal, Form, Input, Button, Select, Tag, Spin, message } from 'antd'
import { Languages, Wand2 } from 'lucide-react'

const { Option } = Select

export type LangCode = 'zh' | 'zh-tw' | 'en' | 'ko' | 'ja' | 'es' | 'pt'

export const LANGUAGES: { code: LangCode; label: string; flag: string }[] = [
  { code: 'zh',    label: '简体中文',   flag: '🇨🇳' },
  { code: 'zh-tw', label: '繁體中文',   flag: '🇹🇼' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ko', label: '한국어',  flag: '🇰🇷' },
  { code: 'ja', label: '日本語',  flag: '🇯🇵' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
]

export type I18nLabels = Partial<Record<LangCode, string>>

// 模拟 AI 翻译（实际接入 API 时替换此函数）
const mockTranslate = async (text: string, sourceLang: LangCode, targetLangs: LangCode[]): Promise<Record<LangCode, string>> => {
  await new Promise(r => setTimeout(r, 1200))
  const mockMap: Record<string, Record<LangCode, string>> = {
    '图标':     { zh: '图标',     'zh-tw': '圖示',     en: 'Icon',        ko: '아이콘',    ja: 'アイコン',   es: 'Ícono',       pt: 'Ícone' },
    'ID':       { zh: 'ID',       'zh-tw': 'ID',        en: 'ID',          ko: 'ID',        ja: 'ID',         es: 'ID',          pt: 'ID' },
    '名称':     { zh: '名称',     'zh-tw': '名稱',      en: 'Name',        ko: '이름',      ja: '名前',       es: 'Nombre',      pt: 'Nome' },
    '类型':     { zh: '类型',     'zh-tw': '類型',      en: 'Type',        ko: '유형',      ja: 'タイプ',     es: 'Tipo',        pt: 'Tipo' },
    '重量':     { zh: '重量',     'zh-tw': '重量',      en: 'Weight',      ko: '무게',      ja: '重量',       es: 'Peso',        pt: 'Peso' },
    '价格':     { zh: '价格',     'zh-tw': '價格',      en: 'Price',       ko: '가격',      ja: '価格',       es: 'Precio',      pt: 'Preço' },
    '攻击力':   { zh: '攻击力',   'zh-tw': '攻擊力',    en: 'ATK',         ko: '공격력',    ja: '攻撃力',     es: 'ATQ',         pt: 'ATQ' },
    '防御力':   { zh: '防御力',   'zh-tw': '防禦力',    en: 'DEF',         ko: '방어력',    ja: '防御力',     es: 'DEF',         pt: 'DEF' },
    '卡槽数':   { zh: '卡槽数',   'zh-tw': '卡槽數',    en: 'Slots',       ko: '카드 슬롯', ja: 'スロット数', es: 'Ranuras',     pt: 'Slots' },
    '职业限制': { zh: '职业限制', 'zh-tw': '職業限制',  en: 'Job Limit',   ko: '직업 제한', ja: '職業制限',   es: 'Clase',       pt: 'Classe' },
    '描述':     { zh: '描述',     'zh-tw': '描述',      en: 'Description', ko: '설명',      ja: '説明',       es: 'Descripción', pt: 'Descrição' },
  }
  const result = mockMap[text] ?? {}
  const out: Partial<Record<LangCode, string>> = {}
  for (const lang of targetLangs) {
    out[lang] = result[lang] ?? `[${lang}] ${text}`
  }
  return out as Record<LangCode, string>
}

interface Props {
  open: boolean
  fieldKey: string
  fieldLabel: string
  i18n: I18nLabels
  onSave: (i18n: I18nLabels) => void
  onCancel: () => void
}

export default function FieldI18nModal({ open, fieldKey, fieldLabel, i18n, onSave, onCancel }: Props) {
  const [values, setValues] = useState<I18nLabels>({ ...i18n })
  const [sourceLang, setSourceLang] = useState<LangCode>('zh')
  const [translating, setTranslating] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  React.useEffect(() => {
    if (open) setValues({ ...i18n })
  }, [open, i18n])

  const handleTranslate = async () => {
    const sourceText = values[sourceLang] || fieldLabel
    if (!sourceText) { messageApi.warning('请先填写源语言内容'); return }
    const targetLangs = LANGUAGES.map(l => l.code).filter(c => c !== sourceLang) as LangCode[]
    setTranslating(true)
    try {
      const result = await mockTranslate(sourceText, sourceLang, targetLangs)
      setValues(prev => ({ ...prev, ...result }))
      messageApi.success('AI 翻译完成')
    } finally {
      setTranslating(false)
    }
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Languages size={16} style={{ color: '#1677FF' }} />
          <span>多语言配置</span>
          <Tag style={{ marginLeft: 4, fontSize: 12 }}>{fieldKey}</Tag>
        </div>
      }
      open={open}
      onOk={() => onSave(values)}
      onCancel={onCancel}
      okText="保存"
      cancelText="取消"
      width={520}
    >
      {contextHolder}
      <div style={{ marginTop: 16 }}>
        {/* AI 翻译工具栏 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '10px 14px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 8 }}>
          <Wand2 size={14} style={{ color: '#0369A1', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#0369A1', flex: 1 }}>选择源语言，一键 AI 翻译其他语种</span>
          <Select value={sourceLang} onChange={setSourceLang} size="small" style={{ width: 110 }}>
            {LANGUAGES.map(l => (
              <Option key={l.code} value={l.code}>{l.flag} {l.label}</Option>
            ))}
          </Select>
          <Button
            size="small"
            type="primary"
            icon={translating ? <Spin size="small" /> : <Wand2 size={12} />}
            onClick={handleTranslate}
            disabled={translating}
            style={{ borderRadius: 6 }}
          >
            {translating ? '翻译中…' : 'AI 翻译'}
          </Button>
        </div>

        {/* 各语言输入框 */}
        <Form layout="vertical">
          {LANGUAGES.map(lang => (
            <Form.Item
              key={lang.code}
              label={
                <span style={{ fontSize: 13 }}>
                  {lang.flag} {lang.label}
                  {lang.code === sourceLang && <Tag color="blue" style={{ marginLeft: 6, fontSize: 11 }}>源语言</Tag>}
                </span>
              }
              style={{ marginBottom: 12 }}
            >
              <Input
                value={values[lang.code] ?? ''}
                onChange={e => setValues(prev => ({ ...prev, [lang.code]: e.target.value }))}
                placeholder={`请输入${lang.label}名称`}
                suffix={translating && lang.code !== sourceLang ? <Spin size="small" /> : null}
              />
            </Form.Item>
          ))}
        </Form>
      </div>
    </Modal>
  )
}
