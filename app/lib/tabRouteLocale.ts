import { LANGUAGES, type I18nLabels, type LangCode } from '../wiki/components/fieldI18nConstants'
import type { TabRoute, TabSubRoute } from '../types'

/** 合并主名称：与集合页一致，`zh` 可与 `name` 互为回退 */
export function mergeTabNameI18n(tab: Pick<TabRoute, 'name' | 'nameI18n'>): I18nLabels {
  return {
    ...(tab.nameI18n ?? {}),
    zh: tab.nameI18n?.zh ?? tab.name,
  }
}

/** 列表/默认 UI 展示用（主文案 = 简体中文或主名称） */
export function tabPrimaryDisplayName(tab: Pick<TabRoute, 'name' | 'nameI18n'>): string {
  const m = mergeTabNameI18n(tab)
  return (m.zh ?? tab.name ?? '').trim() || '未命名分区'
}

export function mergeSubTabNameI18n(st: Pick<TabSubRoute, 'name' | 'nameI18n'>): I18nLabels {
  return {
    ...(st.nameI18n ?? {}),
    zh: st.nameI18n?.zh ?? st.name,
  }
}

export function subTabPrimaryDisplayName(st: Pick<TabSubRoute, 'name' | 'nameI18n'>): string {
  const m = mergeSubTabNameI18n(st)
  return (m.zh ?? st.name ?? '').trim() || '未命名'
}

/** 去掉空白项；全空返回 undefined */
export function pruneTabNameI18n(i: I18nLabels | undefined): I18nLabels | undefined {
  if (!i) return undefined
  const out: I18nLabels = {}
  for (const l of LANGUAGES) {
    const v = i[l.code]?.trim()
    if (v) out[l.code] = v
  }
  return Object.keys(out).length > 0 ? out : undefined
}

/** 取某语种展示名，缺省时回退 zh → name */
export function tabDisplayNameForLocale(
  tab: Pick<TabRoute, 'name' | 'nameI18n'>,
  locale: LangCode,
): string {
  const m = mergeTabNameI18n(tab)
  if (locale === 'zh') return (m.zh ?? tab.name ?? '').trim() || '未命名分区'
  const direct = m[locale]?.trim()
  if (direct) return direct
  return (m.zh ?? tab.name ?? '').trim() || '未命名分区'
}

export function subTabDisplayNameForLocale(
  st: Pick<TabSubRoute, 'name' | 'nameI18n'>,
  locale: LangCode,
): string {
  const m = mergeSubTabNameI18n(st)
  if (locale === 'zh') return (m.zh ?? st.name ?? '').trim() || '未命名'
  const direct = m[locale]?.trim()
  if (direct) return direct
  return (m.zh ?? st.name ?? '').trim() || '未命名'
}
