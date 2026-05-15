interface Props {
  question: string
  answer: string
  style: Record<string, string>
}

const designs: Record<string, { card: string; label: string; value: string }> = {
  pink: {
    card: 'bg-white border-2 border-pink-300 rounded-2xl p-3 w-52 shadow-md',
    label: 'text-xs text-pink-400 font-bold mb-1',
    value: 'text-sm text-gray-700 font-semibold',
  },
  purple: {
    card: 'bg-purple-50 border-2 border-purple-300 rounded-2xl p-3 w-52 shadow-md',
    label: 'text-xs text-purple-400 font-bold mb-1',
    value: 'text-sm text-gray-700 font-semibold',
  },
  mint: {
    card: 'bg-teal-50 border-2 border-teal-300 rounded-2xl p-3 w-52 shadow-md',
    label: 'text-xs text-teal-500 font-bold mb-1',
    value: 'text-sm text-gray-700 font-semibold',
  },
  yellow: {
    card: 'bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-3 w-52 shadow-md',
    label: 'text-xs text-yellow-500 font-bold mb-1',
    value: 'text-sm text-gray-700 font-semibold',
  },
}

export default function QuestionCard({ question, answer, style }: Props) {
  const design = designs[style.design ?? 'pink']

  return (
    <div className={design.card}>
      <p className={design.label}>{question}</p>
      <p className={design.value}>{answer || '未入力'}</p>
    </div>
  )
}
