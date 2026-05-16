export type CardStyle = 'pill' | 'underline' | 'box' | 'ribbon'

export interface TemplateField {
  key: string
  label: string
  prefix?: string   // label前のテキスト
  suffix?: string   // label後のテキスト (例: "が好き")
  fullRow?: boolean // trueならlabelを上行に出してanswerを次行に
  placeholder?: string
}

export interface CardColors {
  bg: string
  title: string
  label: string
  answerBg: string
  answerText: string
  border?: string
}

export interface Template {
  id: string
  title: string
  style: CardStyle
  colors: CardColors
  fields: TemplateField[]
  width: number
}

export const TEMPLATE_THEMES: { color: string; style: CardStyle; colors: CardColors }[] = [
  { color: '#f472b6', style: 'pill',      colors: { bg: '#fff0f5', title: '#f472b6', label: '#9ca3af', answerBg: '#fce7f3', answerText: '#374151' } },
  { color: '#a855f7', style: 'pill',      colors: { bg: '#fdf4ff', title: '#a855f7', label: '#9ca3af', answerBg: '#f3e8ff', answerText: '#374151' } },
  { color: '#f59e0b', style: 'pill',      colors: { bg: '#fffbeb', title: '#f59e0b', label: '#9ca3af', answerBg: '#fef3c7', answerText: '#374151' } },
  { color: '#10b981', style: 'underline', colors: { bg: '#f0fdf4', title: '#10b981', label: '#6b7280', answerBg: 'transparent', answerText: '#111827', border: '#a7f3d0' } },
  { color: '#3b82f6', style: 'underline', colors: { bg: '#eff6ff', title: '#3b82f6', label: '#6b7280', answerBg: 'transparent', answerText: '#111827', border: '#bfdbfe' } },
  { color: '#f97316', style: 'box',       colors: { bg: '#fff7ed', title: '#f97316', label: '#9ca3af', answerBg: '#fff', answerText: '#111827', border: '#fed7aa' } },
]

export const TEMPLATES: Template[] = [
  // ── ピルスタイル ──
  {
    id: 'oshi',
    title: '// 私の推し //',
    style: 'pill',
    width: 240,
    colors: { bg: '#fff0f5', title: '#f472b6', label: '#9ca3af', answerBg: '#fce7f3', answerText: '#374151' },
    fields: [
      { key: 'name',    label: '私の推しは' },
      { key: 'fav',     label: '推しの', suffix: 'が好き' },
      { key: 'how',     label: '推しと出会ったきっかけは', fullRow: true },
      { key: 'since',   label: '推し歴は' },
    ],
  },
  {
    id: 'mood',
    title: '🌙 今の私',
    style: 'pill',
    width: 220,
    colors: { bg: '#fffbeb', title: '#f59e0b', label: '#9ca3af', answerBg: '#fef3c7', answerText: '#374151' },
    fields: [
      { key: 'mood',    label: '今の気分は' },
      { key: 'hooked',  label: 'ハマってること' },
      { key: 'word',    label: '好きな言葉' },
      { key: 'msg',     label: 'ひとこと' },
    ],
  },
  {
    id: 'favorites',
    title: '♡ LOVE LIST ♡',
    style: 'pill',
    width: 220,
    colors: { bg: '#fdf4ff', title: '#a855f7', label: '#9ca3af', answerBg: '#f3e8ff', answerText: '#374151' },
    fields: [
      { key: 'food',    label: '食べ物' },
      { key: 'music',   label: '音楽' },
      { key: 'color',   label: '色' },
      { key: 'season',  label: '季節' },
    ],
  },

  // ── アンダーラインスタイル ──
  {
    id: 'profile',
    title: '✿ プロフィール ✿',
    style: 'underline',
    width: 220,
    colors: { bg: '#f0fdf4', title: '#10b981', label: '#6b7280', answerBg: 'transparent', answerText: '#111827', border: '#a7f3d0' },
    fields: [
      { key: 'name',     label: '名前' },
      { key: 'birthday', label: '誕生日' },
      { key: 'blood',    label: '血液型' },
      { key: 'from',     label: '出身地' },
    ],
  },
  {
    id: 'school',
    title: '✏️ 学校のこと',
    style: 'underline',
    width: 220,
    colors: { bg: '#eff6ff', title: '#3b82f6', label: '#6b7280', answerBg: 'transparent', answerText: '#111827', border: '#bfdbfe' },
    fields: [
      { key: 'grade',   label: '学年・クラス' },
      { key: 'club',    label: '部活' },
      { key: 'subject', label: '得意科目' },
      { key: 'dream',   label: '将来の夢' },
    ],
  },

  // ── ボックススタイル ──
  {
    id: 'selfintro',
    title: '👋 じこしょうかい',
    style: 'box',
    width: 230,
    colors: { bg: '#fff7ed', title: '#f97316', label: '#9ca3af', answerBg: '#fff', answerText: '#111827', border: '#fed7aa' },
    fields: [
      { key: 'name',   label: '名前' },
      { key: 'age',    label: '年齢' },
      { key: 'hobby',  label: '趣味' },
      { key: 'charm',  label: 'チャームポイント' },
    ],
  },
  {
    id: 'love',
    title: '💕 すきなこと',
    style: 'box',
    width: 230,
    colors: { bg: '#fdf2f8', title: '#ec4899', label: '#9ca3af', answerBg: '#fff', answerText: '#111827', border: '#fbcfe8' },
    fields: [
      { key: 'food',   label: '好きな食べ物' },
      { key: 'drink',  label: '好きな飲み物' },
      { key: 'place',  label: '好きな場所' },
      { key: 'time',   label: '好きな時間' },
    ],
  },

  // ── リボンスタイル ──
  {
    id: 'today',
    title: '✨ TODAY',
    style: 'ribbon',
    width: 220,
    colors: { bg: '#fff', title: '#fff', label: '#6b7280', answerBg: '#f9fafb', answerText: '#111827', border: '#818cf8' },
    fields: [
      { key: 'date',   label: '今日の日付' },
      { key: 'feel',   label: '今日の気分' },
      { key: 'did',    label: '今日やったこと' },
      { key: 'want',   label: '明日やりたいこと' },
    ],
  },
]
