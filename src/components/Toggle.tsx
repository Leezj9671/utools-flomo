interface Props {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  hint?: string
}

export function Toggle({ checked, onChange, label, hint }: Props) {
  return (
    <label className="row toggle-row">
      <span className="row-text">
        <span className="row-label">{label}</span>
        {hint && <span className="row-hint">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className="switch"
        onClick={() => onChange(!checked)}
      >
        <span className="knob" />
      </button>
    </label>
  )
}
