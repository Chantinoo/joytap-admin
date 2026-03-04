export type TabType = 'guides' | 'official' | 'discussion'

export interface Article {
  id: string
  title: string
  author: string
  coverUrl: string
  link: string
  viewsCount: number
  publishedAt: string
}

export interface CollectionPageData {
  id: string
  name: string
  link: string
  coverUrl?: string
  articles: Article[]
}

export interface TabRoute {
  id: string
  name: string
  type: TabType | 'default'
  status: 'active' | 'draft'
  sortOrder: number
  isFixed: boolean
  createdAt: string
  updatedAt: string
}

export const TAB_TYPE_CONFIG: Record<TabType, { label: string; color: string; bg: string }> = {
  guides: { label: '攻略', color: '#2563EB', bg: '#DBEAFE' },
  official: { label: '官方', color: '#D97706', bg: '#FEF3C7' },
  discussion: { label: '讨论', color: '#7C3AED', bg: '#F3E8FF' },
}

// ── Module types for Level 2 page ──

export type PostGridLayout = '2-per-row' | '3-per-row' | '6-per-row'

/**
 * A Collection is a named grouping of articles.
 * Used by both CollectionList and CollectionGrid modules.
 * CollectionGrid additionally supports a coverUrl (thumbnail).
 */
export interface CollectionEntry {
  id: string
  name: string
  link: string
  coverUrl?: string
  articlesCount: number
  viewsCount: number
  addedAt?: string   // 添加时间，ISO 日期字符串
  operator?: string  // 操作人
}

/** Individual post entry used by PostGrid */
export interface PostEntry {
  id: string
  title: string
  thumbnailUrl: string
  link: string
}

interface ModuleBase {
  id: string
  title: string
  sortOrder: number
  collapsed?: boolean
}

/**
 * Form 1 — Collections displayed as a vertical list.
 * Each row: thumbnail (optional) · name · edit button → Level 3
 */
export interface CollectionListModule extends ModuleBase {
  type: 'collection-list'
  collections: CollectionEntry[]
}

/**
 * Form 2 — Collections displayed as a grid with thumbnails.
 * Same as List but thumbnail is mandatory and editable.
 */
export interface CollectionGridModule extends ModuleBase {
  type: 'collection-grid'
  collections: CollectionEntry[]
}

/**
 * Post Grid — individual posts displayed as a configurable-column grid.
 * (e.g. Beta Must-See, Anomaly Guide, Featured Face Presets)
 */
export interface PostGridModule extends ModuleBase {
  type: 'post-grid'
  layout: PostGridLayout
  posts: PostEntry[]
}

export type ContentModule = CollectionListModule | CollectionGridModule | PostGridModule

export const MODULE_TYPE_CONFIG: Record<
  ContentModule['type'],
  { label: string; icon: string; color: string; bg: string; description: string }
> = {
  'collection-list': {
    label: '单篇集合页',
    icon: 'list',
    color: '#2563EB',
    bg: '#DBEAFE',
    description: '仅配置一个集合页，直接使用集合页名称',
  },
  'collection-grid': {
    label: '集合页网格',
    icon: 'grid-2x2',
    color: '#059669',
    bg: '#D1FAE5',
    description: '以网格形式展示集合页 — 选填，可不添加；可编辑封面 · 名称 · 链接 · 管理文章',
  },
  'post-grid': {
    label: '帖子网格',
    icon: 'layout-grid',
    color: '#D97706',
    bg: '#FEF3C7',
    description: '帖子以 2 / 3 / 6 列网格布局展示',
  },
}

// ── 下载按钮配置（按渠道） ──

/** 预约用户信息（由前台预约时写入，用于名单展示与群发） */
export interface ReservedUserInfo {
  id: string
  nickname?: string
  avatar?: string
}

export interface DownloadChannelConfig {
  id: string
  /** 渠道标识，默认渠道为 google-play | app-store | pc，自定义为 custom-xxx */
  key: string
  /** 渠道显示名称（如 Google Play、App Store、官方 PC 客户端、Steam） */
  channelName: string
  /** 类型：Android / iOS / PC / 鸿蒙，与渠道对应 */
  channelType?: 'Android' | 'iOS' | 'PC' | '鸿蒙'
  /** 状态：预约 / 获取。预约时可填跳转链接与定时，定时到达后视为「获取」并开放链接 */
  buttonName: string
  /** 跳转链接。类型为「获取」时必填；类型为「预约」时选填，可与定时配合使用 */
  jumpLink: string
  /** 定时转为「获取」的时间（仅类型为「预约」时有效），格式 YYYY-MM-DD HH:mm */
  scheduledTime?: string
  /** 已预约用户列表（用户在前台点击预约时写入，定时到达后按此列表群发通知；含昵称、头像等展示信息） */
  reservedUsers?: ReservedUserInfo[]
  /** 定时转为「获取」后群发通知的标题（仅类型为「预约」时使用） */
  notificationTitle?: string
  /** 定时转为「获取」后群发通知的描述/正文（仅类型为「预约」时使用） */
  notificationMessage?: string
  /** 操作人 */
  operator?: string
  /** 操作时间（最后修改时间） */
  updatedAt?: string
  /** 是否系统默认渠道（不可删除） */
  isDefault?: boolean
}
