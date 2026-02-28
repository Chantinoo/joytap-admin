export type TabType = 'guides' | 'official' | 'discussion'

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
  guides: { label: 'Guides', color: '#2563EB', bg: '#DBEAFE' },
  official: { label: 'Official', color: '#D97706', bg: '#FEF3C7' },
  discussion: { label: 'Discussion', color: '#7C3AED', bg: '#F3E8FF' },
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
  /** Display name of the collection */
  name: string
  /** Link / slug to the collection's article list page */
  link: string
  /** Thumbnail image URL — required for Collection Grid, optional for List */
  coverUrl?: string
  articlesCount: number
  viewsCount: number
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
    label: 'Collection List',
    icon: 'list',
    color: '#2563EB',
    bg: '#DBEAFE',
    description: 'Collections in list form — thumbnail · name · link · manage articles',
  },
  'collection-grid': {
    label: 'Collection Grid',
    icon: 'grid-2x2',
    color: '#059669',
    bg: '#D1FAE5',
    description: 'Collections in grid form — editable thumbnail · name · link · manage articles',
  },
  'post-grid': {
    label: 'Post Grid',
    icon: 'layout-grid',
    color: '#D97706',
    bg: '#FEF3C7',
    description: 'Individual posts in 2 / 3 / 6-column grid layout',
  },
}
