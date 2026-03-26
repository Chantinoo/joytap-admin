/** 浏览器内覆盖前台域名（解决 dev 时社区占用 3001 等与默认不一致） */
export const RO_COMMUNITY_ORIGIN_STORAGE_KEY = 'joytap_ro_community_origin'

/** 前台社区 ro-community 基址（无环境变量时默认 3001，因常与后台错开端口） */
export function getRoCommunityOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_RO_COMMUNITY_URL || 'http://localhost:3001'
  return raw.replace(/\/$/, '')
}

/** 与 ro-community 中论坛 slug 一致，爱如初见为 classic */
export function getRoCommunityForumSlug(): string {
  return process.env.NEXT_PUBLIC_RO_COMMUNITY_FORUM_SLUG || 'classic'
}

/** 道具详情页完整 URL，例如 http://localhost:3001/forum/classic/wiki/items/1001 */
export function buildWikiItemDetailUrl(origin: string, itemId: number): string {
  const o = origin.replace(/\/$/, '')
  const slug = getRoCommunityForumSlug()
  return `${o}/forum/${slug}/wiki/items/${itemId}`
}

export function getWikiItemFrontUrl(itemId: number): string {
  return buildWikiItemDetailUrl(getRoCommunityOrigin(), itemId)
}
