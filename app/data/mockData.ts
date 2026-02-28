import { TabRoute, ContentModule } from '../types'

export const initialTabRoutes: TabRoute[] = [
  {
    id: 'fixed-all',
    name: 'All',
    type: 'default',
    status: 'active',
    sortOrder: 0,
    isFixed: true,
    createdAt: '2025-01-10',
    updatedAt: '2025-01-10',
  },
  {
    id: '2',
    name: 'Guides',
    type: 'guides',
    status: 'active',
    sortOrder: 1,
    isFixed: false,
    createdAt: '2025-01-12',
    updatedAt: '2025-02-15',
  },
  {
    id: '3',
    name: 'Official',
    type: 'official',
    status: 'active',
    sortOrder: 2,
    isFixed: false,
    createdAt: '2025-01-14',
    updatedAt: '2025-01-14',
  },
  {
    id: '4',
    name: 'Discussion',
    type: 'discussion',
    status: 'draft',
    sortOrder: 3,
    isFixed: false,
    createdAt: '2025-01-20',
    updatedAt: '2025-01-20',
  },
]

export const guidesModules: ContentModule[] = [
  // ── Module 1: Hot Guides — Collection List (Form 1)
  // Displayed as a left-image right-text list.
  // Each item is a Collection (e.g. "General", "Beginner", "Redeem Codes" …)
  {
    id: 'mod-1',
    type: 'collection-list',
    title: 'Hot Guides',
    sortOrder: 1,
    collections: [
      {
        id: 'cl-1',
        name: 'General',
        link: '/collections/general',
        articlesCount: 156,
        viewsCount: 150000,
      },
      {
        id: 'cl-2',
        name: 'Beginner',
        link: '/collections/beginner',
        articlesCount: 48,
        viewsCount: 89000,
      },
      {
        id: 'cl-3',
        name: 'Redeem Codes',
        link: '/collections/redeem-codes',
        articlesCount: 12,
        viewsCount: 47000,
      },
      {
        id: 'cl-4',
        name: 'New Version',
        link: '/collections/new-version',
        articlesCount: 34,
        viewsCount: 62000,
      },
      {
        id: 'cl-5',
        name: 'Tier List',
        link: '/collections/tier-list',
        articlesCount: 9,
        viewsCount: 38000,
      },
    ],
  },

  // ── Module 2: All Guides — Collection Grid (Form 2)
  // Displayed as a thumbnail grid; coverUrl is editable.
  {
    id: 'mod-2',
    type: 'collection-grid',
    title: 'All Guides',
    sortOrder: 2,
    collections: [
      {
        id: 'cg-1',
        name: 'Weapons',
        link: '/collections/weapons',
        coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&h=120&fit=crop',
        articlesCount: 56,
        viewsCount: 47000,
      },
      {
        id: 'cg-2',
        name: 'Equipment',
        link: '/collections/equipment',
        coverUrl: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=200&h=120&fit=crop',
        articlesCount: 32,
        viewsCount: 29000,
      },
      {
        id: 'cg-3',
        name: 'Modules',
        link: '/collections/modules',
        coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=120&fit=crop',
        articlesCount: 19,
        viewsCount: 47000,
      },
      {
        id: 'cg-4',
        name: 'Anomalies',
        link: '/collections/anomalies',
        coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&h=120&fit=crop',
        articlesCount: 27,
        viewsCount: 28000,
      },
      {
        id: 'cg-5',
        name: 'Star Colors',
        link: '/collections/star-colors',
        coverUrl: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=200&h=120&fit=crop',
        articlesCount: 17,
        viewsCount: 29000,
      },
      {
        id: 'cg-6',
        name: 'Blueprints',
        link: '/collections/blueprints',
        coverUrl: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=200&h=120&fit=crop',
        articlesCount: 11,
        viewsCount: 29000,
      },
      {
        id: 'cg-7',
        name: 'Recipes',
        link: '/collections/recipes',
        coverUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=120&fit=crop',
        articlesCount: 16,
        viewsCount: 6039,
      },
      {
        id: 'cg-8',
        name: 'Dungeons',
        link: '/collections/dungeons',
        coverUrl: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=200&h=120&fit=crop',
        articlesCount: 12,
        viewsCount: 7763,
      },
      {
        id: 'cg-9',
        name: 'Defense',
        link: '/collections/defense',
        coverUrl: 'https://images.unsplash.com/photo-1563207153-f403bf289096?w=200&h=120&fit=crop',
        articlesCount: 1,
        viewsCount: 0,
      },
    ],
  },

  // ── Module 3: Beta Must-See — Post Grid (2 per row)
  {
    id: 'mod-3',
    type: 'post-grid',
    title: 'Beta Must-See',
    sortOrder: 3,
    layout: '2-per-row',
    posts: [
      { id: 'pg1', title: 'Beta Rewards Overview', thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=240&fit=crop', link: '/posts/pg1' },
      { id: 'pg2', title: "Beginner's Pitfall Guide", thumbnailUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=240&fit=crop', link: '/posts/pg2' },
      { id: 'pg3', title: 'Server Selection Guide', thumbnailUrl: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=240&fit=crop', link: '/posts/pg3' },
      { id: 'pg4', title: 'Cross-Platform Rules', thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=240&fit=crop', link: '/posts/pg4' },
    ],
  },

  // ── Module 4: Anomaly Guide — Post Grid (3 per row)
  {
    id: 'mod-4',
    type: 'post-grid',
    title: 'Anomaly Guide',
    sortOrder: 4,
    layout: '3-per-row',
    posts: [
      { id: 'ag1', title: 'Combat Anomalies', thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=180&fit=crop', link: '/posts/ag1' },
      { id: 'ag2', title: 'Territory Anomalies', thumbnailUrl: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=300&h=180&fit=crop', link: '/posts/ag2' },
      { id: 'ag3', title: 'Building Anomalies', thumbnailUrl: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=300&h=180&fit=crop', link: '/posts/ag3' },
    ],
  },

  // ── Module 5: Featured Face Presets — Post Grid (6 per row)
  {
    id: 'mod-5',
    type: 'post-grid',
    title: 'Featured Face Presets',
    sortOrder: 5,
    layout: '6-per-row',
    posts: [
      { id: 'fp1', title: 'Mbappe', thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop', link: '/posts/fp1' },
      { id: 'fp2', title: 'C. Ronaldo', thumbnailUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop', link: '/posts/fp2' },
      { id: 'fp3', title: 'Soft Girl', thumbnailUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop', link: '/posts/fp3' },
      { id: 'fp4', title: 'Cold Beauty', thumbnailUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop', link: '/posts/fp4' },
      { id: 'fp5', title: 'Cyber Girl', thumbnailUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop', link: '/posts/fp5' },
      { id: 'fp6', title: 'Lolita', thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop', link: '/posts/fp6' },
    ],
  },
]
