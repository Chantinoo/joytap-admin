import { TabRoute, ContentModule, CollectionPageData } from '../types'

export const initialTabRoutes: TabRoute[] = [
  {
    id: 'fixed-all',
    name: '全部',
    type: 'default',
    layoutType: 'feeds',
    status: 'active',
    sortOrder: 0,
    isFixed: true,
    createdAt: '2025-01-10',
    updatedAt: '2025-01-10',
  },
  {
    id: '2',
    name: '攻略',
    type: 'guides',
    layoutType: 'feeds',
    status: 'active',
    sortOrder: 1,
    isFixed: false,
    createdAt: '2025-01-12',
    updatedAt: '2025-02-15',
  },
  {
    id: '3',
    name: '官方',
    type: 'official',
    status: 'active',
    sortOrder: 2,
    isFixed: false,
    subTabs: [
      { id: 'sub-official-1', name: '综合', layoutType: 'feeds', sortOrder: 1 },
      { id: 'sub-official-2', name: '资讯', layoutType: 'feeds', sortOrder: 2 },
      { id: 'sub-official-3', name: '活动', layoutType: 'feeds', sortOrder: 3 },
      { id: 'sub-official-4', name: '公告', layoutType: 'feeds', sortOrder: 4 },
      { id: 'sub-official-5', name: '制作人的一封信', layoutType: 'feeds', sortOrder: 5 },
    ],
    createdAt: '2025-01-14',
    updatedAt: '2025-01-14',
  },
  {
    id: '4',
    name: '交流',
    type: 'discussion',
    layoutType: 'feeds',
    status: 'draft',
    sortOrder: 3,
    isFixed: false,
    createdAt: '2025-01-20',
    updatedAt: '2025-01-20',
  },
  {
    id: '5',
    name: '求助',
    type: 'discussion',
    layoutType: 'feeds',
    status: 'draft',
    sortOrder: 4,
    isFixed: false,
    createdAt: '2025-01-20',
    updatedAt: '2025-01-20',
  },
]

export const guidesModules: ContentModule[] = [
  // ── Module 1: All Guides — Collection Grid (Form 2)（默认在上）
  {
    id: 'mod-2',
    type: 'collection-grid',
    title: '',
    sortOrder: 1,
    collections: [
      { id: 'cg-1', name: '武器攻略',  link: '/zh/collection/6',  coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&h=120&fit=crop', articlesCount: 56, viewsCount: 47000, addedAt: '2025-01-10', operator: 'Admin' },
      { id: 'cg-2', name: '装备攻略',  link: '/zh/collection/7',  coverUrl: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=200&h=120&fit=crop', articlesCount: 32, viewsCount: 29000, addedAt: '2025-01-11', operator: 'Admin' },
      { id: 'cg-3', name: '模组系统',  link: '/zh/collection/8',  coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=120&fit=crop', articlesCount: 19, viewsCount: 47000, addedAt: '2025-01-13', operator: 'User01' },
      { id: 'cg-4', name: '异常状态',  link: '/zh/collection/9',  coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&h=120&fit=crop', articlesCount: 27, viewsCount: 28000, addedAt: '2025-01-15', operator: 'User01' },
      { id: 'cg-5', name: '星级配色',  link: '/zh/collection/10', coverUrl: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=200&h=120&fit=crop', articlesCount: 17, viewsCount: 29000, addedAt: '2025-01-20', operator: 'Admin' },
      { id: 'cg-6', name: '蓝图集合页', link: '/zh/collection/11', coverUrl: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=200&h=120&fit=crop', articlesCount: 11, viewsCount: 29000, addedAt: '2025-01-22', operator: 'Admin' },
      { id: 'cg-7', name: '合成配方',  link: '/zh/collection/12', coverUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=120&fit=crop', articlesCount: 16, viewsCount: 6039,  addedAt: '2025-02-01', operator: 'User01' },
      { id: 'cg-8', name: '副本攻略',  link: '/zh/collection/13', coverUrl: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=200&h=120&fit=crop', articlesCount: 12, viewsCount: 7763,  addedAt: '2025-02-05', operator: 'User01' },
      { id: 'cg-9', name: '防守技巧',  link: '/zh/collection/14', coverUrl: 'https://images.unsplash.com/photo-1563207153-f403bf289096?w=200&h=120&fit=crop', articlesCount: 1,  viewsCount: 0,     addedAt: '2025-02-10', operator: 'Admin' },
    ],
  },

  // ── Module 2: 单篇集合页（仅允许一个集合页）
  {
    id: 'mod-1',
    type: 'collection-list',
    title: '热门攻略',
    sortOrder: 2,
    collections: [
      { id: 'cl-1', name: '综合攻略', link: '/zh/collection/1', articlesCount: 156, viewsCount: 150000, addedAt: '2025-01-10', operator: 'Admin' },
    ],
  },

  // ── Module 3: Beta Must-See — Post Grid (2 per row)
  {
    id: 'mod-3',
    type: 'post-grid',
    title: '测试必看',
    sortOrder: 3,
    layout: '2-per-row',
    posts: [
      { id: 'pg1', title: '测试奖励一览', thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=240&fit=crop', link: '/posts/pg1' },
      { id: 'pg2', title: '新手常见误区', thumbnailUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=240&fit=crop', link: '/posts/pg2' },
      { id: 'pg3', title: '服务器选择指南', thumbnailUrl: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=240&fit=crop', link: '/posts/pg3' },
      { id: 'pg4', title: '跨平台游戏规则', thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=240&fit=crop', link: '/posts/pg4' },
    ],
  },

  // ── Module 4: Anomaly Guide — Post Grid (3 per row)
  {
    id: 'mod-4',
    type: 'post-grid',
    title: '异常状态指南',
    sortOrder: 4,
    layout: '3-per-row',
    posts: [
      { id: 'ag1', title: '战斗异常解析', thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=180&fit=crop', link: '/posts/ag1' },
      { id: 'ag2', title: '领地异常处理', thumbnailUrl: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=300&h=180&fit=crop', link: '/posts/ag2' },
      { id: 'ag3', title: '建筑异常修复', thumbnailUrl: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=300&h=180&fit=crop', link: '/posts/ag3' },
    ],
  },

  {
    id: 'mod-5',
    type: 'post-grid',
    title: '精选捏脸方案',
    sortOrder: 5,
    layout: '6-per-row',
    posts: [
      { id: 'fp1', title: '姆巴佩', thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop', link: '/posts/fp1' },
      { id: 'fp2', title: 'C罗', thumbnailUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop', link: '/posts/fp2' },
      { id: 'fp3', title: '甜系少女', thumbnailUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop', link: '/posts/fp3' },
      { id: 'fp4', title: '冷艳美人', thumbnailUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop', link: '/posts/fp4' },
      { id: 'fp5', title: '赛博女孩', thumbnailUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop', link: '/posts/fp5' },
      { id: 'fp6', title: '洛丽塔', thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop', link: '/posts/fp6' },
    ],
  },
]

export const collectionPages: CollectionPageData[] = [
  {
    id: 'cp-1',
    name: '武器攻略',
    /** 演示「有未命名语种」：韩语下已配帖子，但 nameI18n 未配置 ko 展示名称 */
    nameI18n: {
      zh: '武器攻略',
      'zh-tw': '武器攻略',
      en: 'Weapon guides',
    },
    link: '/zh/collection/6',
    linkI18n: {
      zh: '/zh/collection/6',
      'zh-tw': '/zh-tw/collection/6',
      en: '/en/collection/6',
      ko: '/ko/collection/6',
    },
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&h=120&fit=crop',
    articlesByLocale: {
      zh: [
      { id: 'a1-1', title: '【武器选择】新手必看：五大武器类型全面对比', author: 'Bekty', link: '/posts/a1-1', coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=240&fit=crop', viewsCount: 15420, publishedAt: '2025-01-21' },
      { id: 'a1-2', title: '满星武器获取路线——最省资源的刷取方式', author: 'StarHunter', link: '/posts/a1-2', coverUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=240&fit=crop', viewsCount: 9830, publishedAt: '2025-01-28' },
      { id: 'a1-3', title: '武器词条优先级排行（2025版）', author: 'Bekty', link: '/posts/a1-3', coverUrl: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=240&fit=crop', viewsCount: 22100, publishedAt: '2025-02-03' },
      { id: 'a1-4', title: '远程 vs 近战——不同副本的武器选择思路', author: 'NightWolf', link: '/posts/a1-4', coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=240&fit=crop', viewsCount: 7640, publishedAt: '2025-02-10' },
      { id: 'a1-5', title: '武器强化避坑指南：哪些材料不要提前消耗', author: 'GuideMaster', link: '/posts/a1-5', coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=240&fit=crop', viewsCount: 11200, publishedAt: '2025-02-15' },
      ],
      ko: [
      { id: 'a1-ko-1', title: '[KO] 무기 타입 입문 가이드', author: 'Bekty', link: '/posts/a1-ko-1', coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=240&fit=crop', viewsCount: 2100, publishedAt: '2025-02-01' },
      { id: 'a1-ko-2', title: '[KO] 강화 재료 절약 팁', author: 'GuideMaster', link: '/posts/a1-ko-2', coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=240&fit=crop', viewsCount: 980, publishedAt: '2025-02-08' },
      ],
    }  },
  {
    id: 'cp-2',
    name: '综合攻略',
    link: '/zh/collection/1',
    coverUrl: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=200&h=120&fit=crop',
    articlesByLocale: { zh: [
      { id: 'a2-1', title: '多图片帖子', author: 'Bekty', link: '/posts/a2-1', coverUrl: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&h=240&fit=crop', viewsCount: 308, publishedAt: '2025-01-21' },
      { id: 'a2-2', title: '三张以上图片效果展示', author: 'Bekty', link: '/posts/a2-2', coverUrl: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=240&fit=crop', viewsCount: 68, publishedAt: '2025-01-21' },
      { id: 'a2-3', title: '开服第一周：资源规划完整思路', author: 'PlannerX', link: '/posts/a2-3', coverUrl: 'https://images.unsplash.com/photo-1563207153-f403bf289096?w=400&h=240&fit=crop', viewsCount: 18900, publishedAt: '2025-01-15' },
      { id: 'a2-4', title: '每日任务最优完成顺序（省时30分钟）', author: 'TimeSaver', link: '/posts/a2-4', coverUrl: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400&h=240&fit=crop', viewsCount: 34600, publishedAt: '2025-01-18' },
      { id: 'a2-5', title: '活动币怎么花最划算？全商店性价比对比', author: 'GuideMaster', link: '/posts/a2-5', coverUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=240&fit=crop', viewsCount: 12300, publishedAt: '2025-02-01' },
      { id: 'a2-6', title: 'ads', author: 'User999641', link: '/posts/a2-6', coverUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=240&fit=crop', viewsCount: 157, publishedAt: '2025-12-30' },
    ] }  },
  {
    id: 'cp-3',
    name: '新手入门',
    link: '/zh/collection/2',
    coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=120&fit=crop',
    articlesByLocale: { zh: [
      { id: 'a3-1', title: '零基础入门：前5天应该做什么', author: 'NewbieGuide', link: '/posts/a3-1', coverUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=240&fit=crop', viewsCount: 56200, publishedAt: '2025-01-10' },
      { id: 'a3-2', title: '属性面板详解——每个数值代表什么意思', author: 'StatNerd', link: '/posts/a3-2', coverUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=240&fit=crop', viewsCount: 29800, publishedAt: '2025-01-12' },
      { id: 'a3-3', title: '服务器选择建议：国服 vs 国际服延迟对比', author: 'NetworkPro', link: '/posts/a3-3', coverUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=240&fit=crop', viewsCount: 18400, publishedAt: '2025-01-14' },
      { id: 'a3-4', title: '公会系统详解：加入公会有什么好处', author: 'GuildMaster', link: '/posts/a3-4', coverUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=240&fit=crop', viewsCount: 13700, publishedAt: '2025-01-20' },
    ] }  },
  {
    id: 'cp-4',
    name: '版本更新',
    link: '/zh/collection/4',
    coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&h=120&fit=crop',
    articlesByLocale: { zh: [
      { id: 'a4-1', title: '2.1版本更新内容汇总——新地图、新武器全解析', author: 'PatchNotes', link: '/posts/a4-1', coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=240&fit=crop', viewsCount: 88400, publishedAt: '2025-02-18' },
      { id: 'a4-2', title: '版本平衡调整：哪些职业被削/加强了', author: 'BalanceWatch', link: '/posts/a4-2', coverUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=240&fit=crop', viewsCount: 41200, publishedAt: '2025-02-19' },
      { id: 'a4-3', title: '新限定活动攻略：全奖励领取路线', author: 'EventHunter', link: '/posts/a4-3', coverUrl: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=240&fit=crop', viewsCount: 33600, publishedAt: '2025-02-20' },
    ] }  },
  {
    id: 'cp-5',
    name: '兑换码汇总',
    link: '/zh/collection/3',
    articlesByLocale: { zh: [
      { id: 'a5-1', title: '最新兑换码整理（持续更新）', author: 'CodeHunter', link: '/posts/a5-1', coverUrl: 'https://images.unsplash.com/photo-1563207153-f403bf289096?w=400&h=240&fit=crop', viewsCount: 32100, publishedAt: '2025-01-15' },
      { id: 'a5-2', title: '官方活动兑换码领取攻略', author: 'EventPro', link: '/posts/a5-2', coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=240&fit=crop', viewsCount: 18600, publishedAt: '2025-01-20' },
    ] }  },
  {
    id: 'cp-6',
    name: '强度排行',
    link: '/zh/collection/5',
    articlesByLocale: { zh: [
      { id: 'a6-1', title: 'T0 阵容强度排行（2025赛季）', author: 'MetaAnalyst', link: '/posts/a6-1', coverUrl: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400&h=240&fit=crop', viewsCount: 45200, publishedAt: '2025-02-10' },
      { id: 'a6-2', title: '各职业强度横评：谁是版本答案', author: 'TierMaster', link: '/posts/a6-2', coverUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=240&fit=crop', viewsCount: 28900, publishedAt: '2025-02-12' },
    ] }  },
  {
    id: 'cp-7',
    name: '装备攻略',
    link: '/zh/collection/7',
    coverUrl: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=200&h=120&fit=crop',
    articlesByLocale: { zh: [
      { id: 'a7-1', title: '装备词条优先级完全指南', author: 'GearPro', link: '/posts/a7-1', coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=240&fit=crop', viewsCount: 19300, publishedAt: '2025-01-11' },
      { id: 'a7-2', title: '装备强化材料最优获取路线', author: 'FarmGuide', link: '/posts/a7-2', coverUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=240&fit=crop', viewsCount: 14700, publishedAt: '2025-01-18' },
    ] }  },
  {
    id: 'cp-8',
    name: '模组系统',
    link: '/zh/collection/8',
    coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=120&fit=crop',
    articlesByLocale: { zh: [
      { id: 'a8-1', title: '模组系统入门：核心机制全解析', author: 'ModExpert', link: '/posts/a8-1', coverUrl: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=240&fit=crop', viewsCount: 11200, publishedAt: '2025-01-13' },
      { id: 'a8-2', title: '高阶模组搭配思路', author: 'BuildMaster', link: '/posts/a8-2', coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=240&fit=crop', viewsCount: 8900, publishedAt: '2025-01-19' },
    ] }  },
  {
    id: 'cp-9',
    name: '异常状态',
    link: '/zh/collection/9',
    coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&h=120&fit=crop',
    articlesByLocale: { zh: [
      { id: 'a9-1', title: '所有异常状态效果详解', author: 'StatusNerd', link: '/posts/a9-1', coverUrl: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&h=240&fit=crop', viewsCount: 16800, publishedAt: '2025-01-15' },
      { id: 'a9-2', title: '异常状态抵抗与利用策略', author: 'TacticsGuru', link: '/posts/a9-2', coverUrl: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=240&fit=crop', viewsCount: 9400, publishedAt: '2025-01-22' },
    ] }  },
  {
    id: 'cp-10',
    name: '星级配色',
    link: '/zh/collection/10',
    coverUrl: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=200&h=120&fit=crop',
    articlesByLocale: { zh: [
      { id: 'a10-1', title: '星级配色系统完全指南', author: 'ColorPro', link: '/posts/a10-1', coverUrl: 'https://images.unsplash.com/photo-1563207153-f403bf289096?w=400&h=240&fit=crop', viewsCount: 12300, publishedAt: '2025-01-20' },
    ] }  },
  {
    id: 'cp-11',
    name: '蓝图集合页',
    link: '/zh/collection/11',
    coverUrl: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=200&h=120&fit=crop',
    articlesByLocale: { zh: [
      { id: 'a11-1', title: '稀有蓝图获取位置汇总', author: 'BlueprintHunt', link: '/posts/a11-1', coverUrl: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400&h=240&fit=crop', viewsCount: 7800, publishedAt: '2025-01-22' },
    ] }  },
  {
    id: 'cp-12',
    name: '合成配方',
    link: '/zh/collection/12',
    coverUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=120&fit=crop',
    articlesByLocale: { zh: [
      { id: 'a12-1', title: '全合成配方速查表', author: 'CraftMaster', link: '/posts/a12-1', coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=240&fit=crop', viewsCount: 5600, publishedAt: '2025-02-01' },
    ] }  },
  {
    id: 'cp-13',
    name: '副本攻略',
    link: '/zh/collection/13',
    coverUrl: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=200&h=120&fit=crop',
    articlesByLocale: { zh: [
      { id: 'a13-1', title: '精英副本通关技巧合集', author: 'DungeonPro', link: '/posts/a13-1', coverUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=240&fit=crop', viewsCount: 9100, publishedAt: '2025-02-05' },
      { id: 'a13-2', title: '首领机制解析与打法建议', author: 'BossFighter', link: '/posts/a13-2', coverUrl: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=240&fit=crop', viewsCount: 6700, publishedAt: '2025-02-08' },
    ] }  },
  {
    id: 'cp-14',
    name: '防守技巧',
    link: '/zh/collection/14',
    coverUrl: 'https://images.unsplash.com/photo-1563207153-f403bf289096?w=200&h=120&fit=crop',
    articlesByLocale: { zh: [] },
    hidden: true,
  },
]
