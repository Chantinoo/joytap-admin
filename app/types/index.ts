export type TabType = 'guides' | 'official' | 'discussion'

import type { I18nLabels, LangCode } from '../wiki/components/fieldI18nConstants'

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
  /** 集合页名称多语言；未填语种可省略 */
  nameI18n?: I18nLabels
  /** 列表与分区模块默认展示的「主链接」（通常与简体中文路径一致） */
  link: string
  /** 各语种前台访问路径；未填语种前台可约定回退到主链接或 `link` */
  linkI18n?: I18nLabels
  coverUrl?: string
  /** 按语种的帖子列表（各语言互相独立） */
  articlesByLocale?: Partial<Record<LangCode, Article[]>>
  /**
   * @deprecated 仅兼容旧 mock；读取时视为与 `articlesByLocale.zh` 合并，保存按语种帖子后会移除
   */
  articles?: Article[]
  /** 为 true 时前台不展示（后台仍可管理） */
  hidden?: boolean
}

/** 分区下内容在前台的布局形态（与业务 `type` 独立，仅约束展示样式） */
export type TabPartitionLayoutType = 'feeds' | 'normal-card' | 'activity-card'

export const TAB_PARTITION_LAYOUT_CONFIG: Record<
  TabPartitionLayoutType,
  { label: string; shortLabel: string; hint: string }
> = {
  feeds: {
    label: 'Feeds 流',
    shortLabel: 'Feeds',
    hint: '纵向信息流：列表行式，常见为左缩略图 + 标题/元信息',
  },
  'normal-card': {
    label: '普通卡片',
    shortLabel: '普通卡片',
    hint: '常规卡片式布局，适合图文内容、专题入口等',
  },
  'activity-card': {
    label: '活动卡片',
    shortLabel: '活动卡片',
    hint: '活动专用卡片布局，适合运营活动、限时内容等',
  },
}

/** 列表「官方」列问号提示：开启后仅官方账号可在该范围发帖 */
export const OFFICIAL_POST_ONLY_TOOLTIP =
  '开启后，普通用户无法在该分区下发帖，仅官方认证账号可以发帖。'

/** 一级分区下的二级 Tab（如「官方」下的 综合/资讯/活动…）；有此项时一级不再使用 layoutType */
export interface TabSubRoute {
  id: string
  /** 主展示名（通常与简体中文一致，兼容旧数据与列表默认列） */
  name: string
  /** 各语种名称；未配置的语种可回退到 `name` / `zh` */
  nameI18n?: I18nLabels
  layoutType: TabPartitionLayoutType
  sortOrder: number
  /** 为 true 时该子 Tab 下仅允许官方账号发帖 */
  officialPostOnly?: boolean
  /** 该二级 Tab 下的内容模块（与一级无二级 Tab 时的 modules 结构相同） */
  modules?: ContentModule[]
}

export interface TabRoute {
  id: string
  /** 主展示名（通常与简体中文一致） */
  name: string
  /** 各语种分区名称 */
  nameI18n?: I18nLabels
  type: TabType | 'default'
  status: 'active' | 'draft'
  sortOrder: number
  isFixed: boolean
  /**
   * 一级分区的前台布局；**若配置了 `subTabs` 且非空，则一级不展示分区类型，本字段应省略**（由各子 Tab 的 layoutType 决定）
   */
  layoutType?: TabPartitionLayoutType
  /** 二级 Tab；存在且非空时，分区类型在子级配置 */
  subTabs?: TabSubRoute[]
  /**
   * 无二级 Tab 时：为 true 表示该一级分区仅允许官方发帖。
   * 有二级 Tab 时此项应省略，由各 `TabSubRoute.officialPostOnly` 控制。
   */
  officialPostOnly?: boolean
  /** 无二级 Tab 时，一级分区下的内容模块 */
  modules?: ContentModule[]
  createdAt: string
  updatedAt: string
}

export function tabRouteHasSecondaryTabs(tab: TabRoute): boolean {
  return Array.isArray(tab.subTabs) && tab.subTabs.length > 0
}

export const TAB_TYPE_CONFIG: Record<TabType, { label: string; color: string; bg: string }> = {
  guides: { label: '攻略', color: '#2563EB', bg: '#DBEAFE' },
  official: { label: '官方', color: '#D97706', bg: '#FEF3C7' },
  discussion: { label: '交流', color: '#7C3AED', bg: '#F3E8FF' },
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
