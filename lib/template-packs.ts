import { Template } from './templates'

export interface TemplatePack {
  id: string
  name: string
  preview: string
  templates: Template[]
}

export const TEMPLATE_PACKS: TemplatePack[] = [
  {
    id: 'profile',
    name: 'プロフィール',
    preview: '✿',
    templates: [
      {
        id: 'pk_profile',
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
        id: 'pk_selfintro',
        title: '👋 じこしょうかい',
        style: 'box',
        width: 230,
        colors: { bg: '#fff7ed', title: '#f97316', label: '#9ca3af', answerBg: '#fff', answerText: '#111827', border: '#fed7aa' },
        fields: [
          { key: 'name',  label: '名前' },
          { key: 'age',   label: '年齢' },
          { key: 'hobby', label: '趣味' },
          { key: 'charm', label: 'チャームポイント' },
        ],
      },
      {
        id: 'pk_contact',
        title: '📱 れんらく先',
        style: 'pill',
        width: 220,
        colors: { bg: '#f0f9ff', title: '#0ea5e9', label: '#9ca3af', answerBg: '#e0f2fe', answerText: '#374151' },
        fields: [
          { key: 'sns',   label: 'SNSは' },
          { key: 'id',    label: 'ID / ユーザー名' },
          { key: 'line',  label: 'LINEのIDは' },
          { key: 'meet',  label: 'よくいる場所' },
        ],
      },
    ],
  },
  {
    id: 'oshi',
    name: '推し活',
    preview: '💕',
    templates: [
      {
        id: 'pk_oshi',
        title: '// 私の推し //',
        style: 'pill',
        width: 240,
        colors: { bg: '#fff0f5', title: '#f472b6', label: '#9ca3af', answerBg: '#fce7f3', answerText: '#374151' },
        fields: [
          { key: 'name',  label: '私の推しは' },
          { key: 'fav',   label: '推しの', suffix: 'が好き' },
          { key: 'how',   label: '推しと出会ったきっかけは', fullRow: true },
          { key: 'since', label: '推し歴は' },
        ],
      },
      {
        id: 'pk_favorites',
        title: '♡ LOVE LIST ♡',
        style: 'pill',
        width: 220,
        colors: { bg: '#fdf4ff', title: '#a855f7', label: '#9ca3af', answerBg: '#f3e8ff', answerText: '#374151' },
        fields: [
          { key: 'food',   label: '食べ物' },
          { key: 'music',  label: '音楽' },
          { key: 'color',  label: '色' },
          { key: 'season', label: '季節' },
        ],
      },
      {
        id: 'pk_love',
        title: '💕 すきなこと',
        style: 'box',
        width: 230,
        colors: { bg: '#fdf2f8', title: '#ec4899', label: '#9ca3af', answerBg: '#fff', answerText: '#111827', border: '#fbcfe8' },
        fields: [
          { key: 'food',  label: '好きな食べ物' },
          { key: 'drink', label: '好きな飲み物' },
          { key: 'place', label: '好きな場所' },
          { key: 'time',  label: '好きな時間' },
        ],
      },
    ],
  },
  {
    id: 'kimochi',
    name: 'きもち',
    preview: '🌙',
    templates: [
      {
        id: 'pk_mood',
        title: '🌙 今の私',
        style: 'pill',
        width: 220,
        colors: { bg: '#fffbeb', title: '#f59e0b', label: '#9ca3af', answerBg: '#fef3c7', answerText: '#374151' },
        fields: [
          { key: 'mood',   label: '今の気分は' },
          { key: 'hooked', label: 'ハマってること' },
          { key: 'word',   label: '好きな言葉' },
          { key: 'msg',    label: 'ひとこと' },
        ],
      },
      {
        id: 'pk_today',
        title: '✨ TODAY',
        style: 'ribbon',
        width: 220,
        colors: { bg: '#fff', title: '#fff', label: '#6b7280', answerBg: '#f9fafb', answerText: '#111827', border: '#818cf8' },
        fields: [
          { key: 'date', label: '今日の日付' },
          { key: 'feel', label: '今日の気分' },
          { key: 'did',  label: '今日やったこと' },
          { key: 'want', label: '明日やりたいこと' },
        ],
      },
      {
        id: 'pk_secret',
        title: '🤫 ひみつのきもち',
        style: 'ribbon',
        width: 230,
        colors: { bg: '#fff', title: '#fff', label: '#6b7280', answerBg: '#fdf4ff', answerText: '#111827', border: '#c084fc' },
        fields: [
          { key: 'like',  label: '好きな人のタイプ' },
          { key: 'dream', label: '夢' },
          { key: 'worry', label: '最近の悩み' },
          { key: 'happy', label: '幸せを感じる瞬間' },
        ],
      },
    ],
  },
  {
    id: 'school',
    name: 'がっこう',
    preview: '✏️',
    templates: [
      {
        id: 'pk_school',
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
      {
        id: 'pk_lunch',
        title: '🍱 お昼ごはん',
        style: 'box',
        width: 220,
        colors: { bg: '#fefce8', title: '#ca8a04', label: '#9ca3af', answerBg: '#fff', answerText: '#111827', border: '#fde68a' },
        fields: [
          { key: 'type',  label: 'お弁当 / 購買 / 給食' },
          { key: 'fav',   label: '好きな給食メニュー' },
          { key: 'with',  label: '誰と食べる？' },
          { key: 'where', label: 'どこで食べる？' },
        ],
      },
      {
        id: 'pk_test',
        title: '📝 テスト結果',
        style: 'underline',
        width: 220,
        colors: { bg: '#f0fdf4', title: '#16a34a', label: '#6b7280', answerBg: 'transparent', answerText: '#111827', border: '#86efac' },
        fields: [
          { key: 'score', label: '平均点' },
          { key: 'best',  label: '一番よかった科目' },
          { key: 'worst', label: '一番ダメだった科目' },
          { key: 'next',  label: '次の目標' },
        ],
      },
    ],
  },
  {
    id: 'season',
    name: 'きせつ',
    preview: '🌸',
    templates: [
      {
        id: 'pk_spring',
        title: '🌸 春のこと',
        style: 'pill',
        width: 220,
        colors: { bg: '#fff0f5', title: '#f472b6', label: '#9ca3af', answerBg: '#fce7f3', answerText: '#374151' },
        fields: [
          { key: 'cherry',  label: '花見スポットは' },
          { key: 'new',     label: '新しくはじめたいこと' },
          { key: 'clothes', label: '春服コーデは' },
          { key: 'song',    label: '春に聴きたい曲' },
        ],
      },
      {
        id: 'pk_summer',
        title: '☀️ 夏のこと',
        style: 'box',
        width: 220,
        colors: { bg: '#fffbeb', title: '#f59e0b', label: '#9ca3af', answerBg: '#fff', answerText: '#111827', border: '#fde68a' },
        fields: [
          { key: 'sea',    label: '海 / プール / 山？' },
          { key: 'food',   label: '夏といえば食べ物は' },
          { key: 'plan',   label: '夏休みの予定' },
          { key: 'memory', label: '去年の夏の思い出' },
        ],
      },
      {
        id: 'pk_winter',
        title: '❄️ 冬のこと',
        style: 'underline',
        width: 220,
        colors: { bg: '#eff6ff', title: '#3b82f6', label: '#6b7280', answerBg: 'transparent', answerText: '#111827', border: '#bfdbfe' },
        fields: [
          { key: 'hot',    label: '好きな温かい飲み物' },
          { key: 'xmas',   label: 'クリスマスは誰と？' },
          { key: 'nendo',  label: '今年の一字は' },
          { key: 'wish',   label: '年末年始の目標' },
        ],
      },
    ],
  },
]
