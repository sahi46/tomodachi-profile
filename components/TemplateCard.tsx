import { Template, CardColors } from '@/lib/templates'

interface Props {
  template: Template
  answers?: Record<string, string>
  editMode?: boolean
}

// ── Field display components (decoration only, no input) ──────────

function PillField({ label, prefix, suffix, answer, colors, fullRow }: {
  label: string; prefix?: string; suffix?: string; answer: string
  colors: CardColors; fullRow?: boolean
}) {
  if (fullRow) {
    return (
      <div style={{ marginBottom: 6 }}>
        <p style={{ fontSize: 9, color: colors.label, marginBottom: 4 }}>
          {prefix}{label}{suffix}
        </p>
        <div style={{ backgroundColor: colors.answerBg, borderRadius: 20, padding: '4px 10px', width: '100%' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: answer ? colors.answerText : 'rgba(0,0,0,0.18)', lineHeight: 1.4, wordBreak: 'break-all' }}>
            {answer || '　'}
          </p>
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
        <p style={{ fontSize: 11, fontWeight: 700, color: answer ? colors.answerText : 'rgba(0,0,0,0.18)', wordBreak: 'break-all' }}>
          {answer || '　'}
        </p>
      </div>
    </div>
  )
}

function UnderlineField({ label, answer, colors }: {
  label: string; answer: string; colors: CardColors
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <p style={{ fontSize: 9, color: colors.label, marginBottom: 2 }}>{label}</p>
      <div style={{ borderBottom: `1.5px solid ${colors.border}`, paddingBottom: 3 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: answer ? colors.answerText : 'rgba(0,0,0,0.18)', wordBreak: 'break-all' }}>
          {answer || '　'}
        </p>
      </div>
    </div>
  )
}

function BoxField({ label, answer, colors }: {
  label: string; answer: string; colors: CardColors
}) {
  return (
    <div style={{ marginBottom: 6 }}>
      <p style={{ fontSize: 9, color: colors.label, marginBottom: 3 }}>{label}</p>
      <div style={{ backgroundColor: colors.answerBg, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '4px 8px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: answer ? colors.answerText : 'rgba(0,0,0,0.18)', wordBreak: 'break-all' }}>
          {answer || '　'}
        </p>
      </div>
    </div>
  )
}

function RibbonField({ label, answer, colors }: {
  label: string; answer: string; colors: CardColors
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
      <p style={{ fontSize: 9, color: colors.label, flexShrink: 0, minWidth: 52 }}>{label}</p>
      <div style={{ flex: 1, backgroundColor: colors.answerBg, borderRadius: 4, padding: '3px 8px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: answer ? colors.answerText : 'rgba(0,0,0,0.18)', wordBreak: 'break-all' }}>
          {answer || '　'}
        </p>
      </div>
    </div>
  )
}

export default function TemplateCard({ template, answers = {} }: Props) {
  const { style, colors, fields, width, title } = template

  const titleEl = (
    <p style={{
      fontSize: 11, fontWeight: 800, color: colors.title,
      marginBottom: 10, letterSpacing: '0.04em',
      textAlign: style === 'ribbon' ? 'center' : 'left',
    }}>
      {title}
    </p>
  )

  if (style === 'pill') {
    return (
      <div style={{ width, backgroundColor: colors.bg, borderRadius: 16, padding: '12px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', pointerEvents: 'none' }}>
        {titleEl}
        {fields.map(f => (
          <PillField key={f.key} label={f.label} prefix={f.prefix} suffix={f.suffix}
            answer={answers[f.key] ?? ''} colors={colors} fullRow={f.fullRow} />
        ))}
      </div>
    )
  }

  if (style === 'underline') {
    return (
      <div style={{ width, backgroundColor: colors.bg, borderRadius: 16, padding: '12px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', pointerEvents: 'none' }}>
        {titleEl}
        {fields.map(f => (
          <UnderlineField key={f.key} label={f.label} answer={answers[f.key] ?? ''} colors={colors} />
        ))}
      </div>
    )
  }

  if (style === 'box') {
    return (
      <div style={{ width, backgroundColor: colors.bg, borderRadius: 16, padding: '12px 14px', border: `1.5px solid ${colors.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.10)', pointerEvents: 'none' }}>
        {titleEl}
        {fields.map(f => (
          <BoxField key={f.key} label={f.label} answer={answers[f.key] ?? ''} colors={colors} />
        ))}
      </div>
    )
  }

  // ribbon
  return (
    <div style={{ width, backgroundColor: colors.bg, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', pointerEvents: 'none' }}>
      <div style={{ backgroundColor: colors.border, padding: '8px 14px', marginBottom: 2 }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: colors.title, textAlign: 'center', letterSpacing: '0.08em' }}>
          {title}
        </p>
      </div>
      <div style={{ padding: '10px 14px' }}>
        {fields.map(f => (
          <RibbonField key={f.key} label={f.label} answer={answers[f.key] ?? ''} colors={colors} />
        ))}
      </div>
    </div>
  )
}
