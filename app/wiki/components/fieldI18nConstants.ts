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

export async function mockTranslateFieldI18n(
  text: string,
  sourceLang: LangCode,
  targetLangs: LangCode[],
): Promise<Record<LangCode, string>> {
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
    '骑士':     { zh: '骑士',     'zh-tw': '騎士',      en: 'Knight',      ko: '기사',     ja: '騎士',       es: 'Caballero',   pt: 'Cavaleiro' },
    '法师':     { zh: '法师',     'zh-tw': '法師',      en: 'Mage',        ko: '마법사',    ja: '魔術師',     es: 'Mago',        pt: 'Mago' },
    // Wiki 分类名称（管理页「名称」多语言）
    '道具':     { zh: '道具',     'zh-tw': '道具',      en: 'Items',       ko: '아이템',    ja: 'アイテム',   es: 'Objetos',     pt: 'Itens' },
    '怪物':     { zh: '怪物',     'zh-tw': '怪物',      en: 'Monsters',    ko: '몬스터',    ja: 'モンスター', es: 'Monstruos',   pt: 'Monstros' },
    '卡片':     { zh: '卡片',     'zh-tw': '卡片',      en: 'Cards',       ko: '카드',      ja: 'カード',     es: 'Cartas',      pt: 'Cartas' },
    '宠物':     { zh: '宠物',     'zh-tw': '寵物',      en: 'Pets',        ko: '펫',        ja: 'ペット',     es: 'Mascotas',    pt: 'Mascotes' },
    '箱子':     { zh: '箱子',     'zh-tw': '箱子',      en: 'Boxes',       ko: '상자',      ja: '箱',         es: 'Cajas',       pt: 'Caixas' },
    '箭矢制作': { zh: '箭矢制作', 'zh-tw': '箭矢製作',  en: 'Arrow Crafting', ko: '화살 제작', ja: '矢作り', es: 'Fabricación de flechas', pt: 'Fabricação de flechas' },
    '套装':     { zh: '套装',     'zh-tw': '套裝',      en: 'Equipment Sets', ko: '세트', ja: 'セット', es: 'Conjuntos', pt: 'Conjuntos' },
    '技能模拟': { zh: '技能模拟', 'zh-tw': '技能模擬',  en: 'Skill Simulator', ko: '스킬 시뮬', ja: 'スキルシミュ', es: 'Simulador de habilidades', pt: 'Simulador de habilidades' },
    '地图':     { zh: '地图',     'zh-tw': '地圖',      en: 'Maps',        ko: '맵',        ja: 'マップ',     es: 'Mapas',       pt: 'Mapas' },
  }
  const result = mockMap[text] ?? {}
  const out: Partial<Record<LangCode, string>> = {}
  for (const lang of targetLangs) {
    out[lang] = result[lang] ?? `[${lang}] ${text}`
  }
  return out as Record<LangCode, string>
}
