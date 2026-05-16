import { Template, CardColors } from '@/lib/templates'

interface Props {
  template: Template
  answers: Record<string, string>
  editMode?: boolean
  isEditing?: boolean
  onAnswerChange?: (key: string, value: string) => void
}

const inputStyle = (colors: CardColors): React.CSSProperties => ({
  fontSize: 11,
  fontWeight: 700,
  color: colors.answerText,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  width: '100%',
  padding: 0,
  lineHeight: 1.4,
  wordBreak: 'break-all',
  fontFamily: 'inherit',
})

function PillField({ label, prefix, suffix, answer, colors, fullRow, editMode, isEditing, fieldKey, onAnswerChange }: {
  label: string; prefix?: string; suffix?: string; answer: string
  colors: CardColors; fullRow?: boolean; editMode?: boolean
  isEditing?: boolean; fieldKey: string; onAnswerChange?: (k: string, v: string) => void
}) {
  const placeholder = editMode || isEditing ? '入力...' : '—'
  if (fullRow) {
    return (
      <div style={{ marginBottom: 6 }}>
        <p style={{ fontSize: 9, color: colors.label, marginBottom: 4 }}>
          {prefix}{label}{suffix}
        </p>
        <div style={{ backgroundColor: colors.answerBg, borderRadius: 20, padding: '4px 10px', width: '100%' }}>
          {isEditing ? (
            <input
              type="text"
              value={answer}
              placeholder={placeholder}
              onChange={e => onAnswerChange?.(fieldKey, e.target.value)}
              onClick={e => e.stopPropagation()}
              style={{ ...inputStyle(colors), minWidth: 0 }}
            />
          ) : (
            <p style={{ fontSize: 11, fontWeight: 700, color: answer ? colors.answerText : '#9ca3af', lineHeight: 1.4, wordBreak: 'break-all' }}>
              {answer || placeholder}
            </p>
          )}
        </div>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
      <p style={{ fontSize: 9, color: colors.label, flexShrink: 0 }}>
        {prefix}{label}{suffix}
      </p>
      <div style={{ backgroundColor: colors.answerBg, borderRadius: 20, padding: '3px 10px', flex: 1, minWidth: 60 }}>
        {isEditing ? (
          <input
            type="text"
            value={answer}
            placeholder={placeholder}
            onChange={e => onAnswerChange?.(fieldKey, e.target.value)}
            onClick={e => e.stopPropagation()}
            style={inputStyle(colors)}
          />
        ) : (
          <p style={{ fontSize: 11, fontWeight: 700, color: answer ? colors.answerText : '#9ca3af', wordBreak: 'break-all' }}>
            {answer || placeholder}
          </p>
        )}
      </div>
    </div>
  )
}

function UnderlineField({ label, answer, colors, editMode, isEditing, fieldKey, onAnswerChange }: {
  label: string; answer: string; colors: CardColors; editMode?: boolean
  isEditing?: boolean; fieldKey: string; onAnswerChange?: (k: string, v: string) => void
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <p style={{ fontSize: 9, color: colors.label, marginBottom: 2 }}>{label}</p>
      <div style={{ borderBottom: `1.5px solid ${colors.border}`, paddingBottom: 3 }}>
        {isEditing ? (
          <input
            type="text"
            value={answer}
            placeholder="入力..."
            onChange={e => onAnswerChange?.(fieldKey, e.target.value)}
            onClick={e => e.stopPropagation()}
            style={{ ...inputStyle(colors), fontSize: 12 }}
          />
        ) : (
          <p style={{ fontSize: 12, fontWeight: 700, color: answer ? colors.answerText : '#9ca3af', wordBreak: 'break-all' }}>
            {answer || (editMode ? 'タップして入力' : '—')}
          </p>
        )}
      </div>
    </div>
  )
}

function BoxField({ label, answer, colors, editMode, isEditing, fieldKey, onAnswerChange }: {
  label: string; answer: string; colors: CardColors; editMode?: boolean
  isEditing?: boolean; fieldKey: string; onAnswerChange?: (k: string, v: string) => void
}) {
  return (
    <div style={{ marginBottom: 6 }}>
      <p style={{ fontSize: 9, color: colors.label, marginBottom: 3 }}>{label}</p>
      <div style={{ backgroundColor: colors.answerBg, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '4px 8px' }}>
        {isEditing ? (
          <input
            type="text"
            value={answer}
            placeholder="入力..."
            onChange={e => onAnswerChange?.(fieldKey, e.target.value)}
            onClick={e => e.stopPropagation()}
            style={inputStyle(colors)}
          />
        ) : (
          <p style={{ fontSize: 11, fontWeight: 700, color: answer ? colors.answerText : '#9ca3af', wordBreak: 'break-all' }}>
            {answer || (editMode ? 'タップして入力' : '—')}
          </p>
        )}
      </div>
    </div>
  )
}

function RibbonField({ label, answer, colors, editMode, isEditing, fieldKey, onAnswerChange }: {
  label: string; answer: string; colors: CardColors; editMode?: boolean
  isEditing?: boolean; fieldKey: string; onAnswerChange?: (k: string, v: string) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
      <p style={{ fontSize: 9, color: colors.label, flexShrink: 0, minWidth: 52 }}>{label}</p>
      <div style={{ flex: 1, backgroundColor: colors.answerBg, borderRadius: 4, padding: '3px 8px' }}>
        {isEditing ? (
          <input
            type="text"
            value={answer}
            placeholder="入力..."
            onChange={e => onAnswerChange?.(fieldKey, e.target.value)}
            onClick={e => e.stopPropagation()}
            style={inputStyle(colors)}
          />
        ) : (
          <p style={{ fontSize: 11, fontWeight: 700, color: answer ? colors.answerText : '#9ca3af', wordBreak: 'break-all' }}>
            {answer || (editMode ? 'タップして入力' : '—')}
          </p>
        )}
      </div>
    </div>
  )
}

export default function TemplateCard({ template, answers, editMode, isEditing, onAnswerChange }: Props) {
  const { style, colors, fields, width, title } = template

  const titleEl = (
    <p style={{
      fontSize: 11,
      fontWeight: 800,
      color: colors.title,
      marginBottom: 10,
      letterSpacing: '0.04em',
      textAlign: style === 'ribbon' ? 'center' : 'left',
    }}>
      {title}
    </p>
  )

  const pe: React.CSSProperties = { pointerEvents: isEditing ? 'auto' : 'none' }

  if (style === 'pill') {
    return (
      <div style={{ width, backgroundColor: colors.bg, borderRadius: 16, padding: '12px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', ...pe }}>
        {titleEl}
        {fields.map(f => (
          <PillField
            key={f.key}
            fieldKey={f.key}
            label={f.label}
            prefix={f.prefix}
            suffix={f.suffix}
            answer={answers[f.key] ?? ''}
            colors={colors}
            fullRow={f.fullRow}
            editMode={editMode}
            isEditing={isEditing}
            onAnswerChange={onAnswerChange}
          />
        ))}
      </div>
    )
  }

  if (style === 'underline') {
    return (
      <div style={{ width, backgroundColor: colors.bg, borderRadius: 16, padding: '12px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', ...pe }}>
        {titleEl}
        {fields.map(f => (
          <UnderlineField
            key={f.key}
            fieldKey={f.key}
            label={f.label}
            answer={answers[f.key] ?? ''}
            colors={colors}
            editMode={editMode}
            isEditing={isEditing}
            onAnswerChange={onAnswerChange}
          />
        ))}
      </div>
    )
  }

  if (style === 'box') {
    return (
      <div style={{ width, backgroundColor: colors.bg, borderRadius: 16, padding: '12px 14px', border: `1.5px solid ${colors.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.10)', ...pe }}>
        {titleEl}
        {fields.map(f => (
          <BoxField
            key={f.key}
            fieldKey={f.key}
            label={f.label}
            answer={answers[f.key] ?? ''}
            colors={colors}
            editMode={editMode}
            isEditing={isEditing}
            onAnswerChange={onAnswerChange}
          />
        ))}
      </div>
    )
  }

  // ribbon
  return (
    <div style={{ width, backgroundColor: colors.bg, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', ...pe }}>
      <div style={{ backgroundColor: colors.border, padding: '8px 14px', marginBottom: 2 }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: colors.title, textAlign: 'center', letterSpacing: '0.08em' }}>
          {title}
        </p>
      </div>
      <div style={{ padding: '10px 14px' }}>
        {fields.map(f => (
          <RibbonField
            key={f.key}
            fieldKey={f.key}
            label={f.label}
            answer={answers[f.key] ?? ''}
            colors={colors}
            editMode={editMode}
            isEditing={isEditing}
            onAnswerChange={onAnswerChange}
          />
        ))}
      </div>
    </div>
  )
}
