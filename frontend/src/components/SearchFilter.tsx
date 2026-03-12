type SearchFilterProps = {
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}

export function SearchFilter({ label, value, placeholder, onChange }: SearchFilterProps) {
  return (
    <div className="login-field">
      <label>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

