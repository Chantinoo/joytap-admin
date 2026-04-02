import type { CollectionPageData, Article } from '../types'
import { LANGUAGES, type LangCode, type I18nLabels } from '../wiki/components/fieldI18nConstants'

/** 合并 articlesByLocale 与旧版顶层 articles（视为 zh） */
export function mergeArticlesBuckets(page: CollectionPageData): Partial<Record<LangCode, Article[]>> {
  const buckets: Partial<Record<LangCode, Article[]>> = { ...(page.articlesByLocale ?? {}) }
  const legacy = page.articles
  if (legacy?.length && (!buckets.zh || buckets.zh.length === 0)) {
    buckets.zh = legacy
  }
  return buckets
}

export function getArticlesForLocale(page: CollectionPageData, locale: LangCode): Article[] {
  return mergeArticlesBuckets(page)[locale] ?? []
}

/** 各语种帖子数量（仅包含有帖子的语种） */
export function localeArticleCounts(page: CollectionPageData): Partial<Record<LangCode, number>> {
  const buckets = mergeArticlesBuckets(page)
  const out: Partial<Record<LangCode, number>> = {}
  for (const l of LANGUAGES) {
    const n = buckets[l.code]?.length ?? 0
    if (n > 0) out[l.code] = n
  }
  return out
}

export function totalArticlesCount(page: CollectionPageData): number {
  const buckets = mergeArticlesBuckets(page)
  return LANGUAGES.reduce((sum, l) => sum + (buckets[l.code]?.length ?? 0), 0)
}

/** 可选语种：名称已配置或该语种下已有帖子（按 LANGUAGES 顺序） */
export function selectableLocalesForCollection(page: CollectionPageData): LangCode[] {
  const merged: Record<string, string | undefined> = {
    ...(page.nameI18n ?? {}),
    zh: page.nameI18n?.zh ?? page.name,
  }
  const buckets = mergeArticlesBuckets(page)
  const pick = new Set<LangCode>()
  for (const l of LANGUAGES) {
    const hasName = (merged[l.code] ?? '').trim().length > 0
    const hasPosts = (buckets[l.code]?.length ?? 0) > 0
    if (hasName || hasPosts) pick.add(l.code)
  }
  if (pick.size === 0) pick.add('zh')
  return LANGUAGES.map((x) => x.code).filter((c) => pick.has(c))
}

/** 详情页标题：优先当前语种 nameI18n，否则回退到 zh / 主名称 / 任意已填语种 */
export function collectionDisplayNameForLocale(page: CollectionPageData, locale: LangCode): string {
  const direct = page.nameI18n?.[locale]?.trim()
  if (direct) return direct
  const zhOrPrimary = page.nameI18n?.zh?.trim() || page.name?.trim()
  if (zhOrPrimary) return zhOrPrimary
  for (const l of LANGUAGES) {
    const v = page.nameI18n?.[l.code]?.trim()
    if (v) return v
  }
  return '集合页'
}

/**
 * 该语种是否视为「已配置展示名称」。
 * - 非 zh：仅看 nameI18n 对应字段
 * - zh：nameI18n.zh 或列表主名称 name 任一有值即可
 */
export function localeHasDisplayName(page: CollectionPageData, locale: LangCode): boolean {
  const fromI18n = (page.nameI18n?.[locale] ?? '').trim()
  if (fromI18n) return true
  if (locale === 'zh') return !!(page.name?.trim())
  return false
}

/** 是否存在「有帖子但该语种无展示名称」的分支（数据仍保留，仅前台不应用该语种名称） */
export function hasOrphanLocaleArticles(page: CollectionPageData): boolean {
  for (const l of LANGUAGES) {
    if (getArticlesForLocale(page, l.code).length === 0) continue
    if (!localeHasDisplayName(page, l.code)) return true
  }
  return false
}

/** 当前语种是否处于「仅有帖子、无展示名称」状态 */
export function isLocaleUnnamedWithPosts(page: CollectionPageData, locale: LangCode): boolean {
  return getArticlesForLocale(page, locale).length > 0 && !localeHasDisplayName(page, locale)
}

export function mergeNameI18n(page: CollectionPageData): I18nLabels {
  return {
    ...(page.nameI18n ?? {}),
    zh: page.nameI18n?.zh ?? page.name,
  }
}

export function mergeLinkI18n(page: CollectionPageData): I18nLabels {
  return {
    ...(page.linkI18n ?? {}),
    zh: page.linkI18n?.zh ?? page.link,
  }
}

/** 按运营常用顺序取第一个非空文案，用于列表主展示字段 */
export function pickPrimaryI18nValue(i18n: I18nLabels, fallback: string): string {
  const order: LangCode[] = ['zh', 'zh-tw', 'en', 'ko', 'ja', 'es', 'pt']
  for (const k of order) {
    const v = i18n[k]?.trim()
    if (v) return v
  }
  const first = Object.values(i18n).find((v) => v?.trim())
  return (first?.trim() || fallback).trim() || fallback
}

export function primaryCollectionLink(page: CollectionPageData): string {
  return pickPrimaryI18nValue(mergeLinkI18n(page), page.link ?? '')
}

/** 分区模块里配置的 `link` 是否与该集合页任一语种路径一致 */
export function collectionPageMatchesPublicLink(page: CollectionPageData, href: string): boolean {
  const h = href.trim()
  if (!h) return false
  const merged = mergeLinkI18n(page)
  for (const l of LANGUAGES) {
    const v = merged[l.code]?.trim()
    if (v === h) return true
  }
  return false
}

/** 扫描路径中的 `/collection/<n>` 序号（含 `/zh/collection/N`、`/en/collection/N` 等），用于新建集合页时递增 */
export function maxCollectionNumericSuffix(pages: CollectionPageData[]): number {
  let max = 0
  for (const p of pages) {
    const urls = [p.link, ...Object.values(p.linkI18n ?? {})]
    for (const raw of urls) {
      if (!raw?.trim()) continue
      for (const m of raw.matchAll(/\/collection\/(\d+)/g)) {
        max = Math.max(max, parseInt(m[1], 10))
      }
    }
  }
  return max
}
