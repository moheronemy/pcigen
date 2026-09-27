import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export const Field = ({ label, children, className }: FieldProps) => (
  <label className={`field ${className ?? ''}`}>
    <span className="field-label">{label}</span>
    {children}
  </label>
);

interface TextProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  list?: string;
  className?: string;
  inputMode?: 'numeric' | 'text';
}

export const TextField = ({ label, value, onChange, className, ...rest }: TextProps) => (
  <Field label={label} className={className}>
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
  </Field>
);

export const TextArea = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) => (
  <Field label={label}>
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  </Field>
);

export function Select<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <Field label={label}>
      <select
        value={String(value)}
        onChange={(e) => {
          const found = options.find((o) => String(o.value) === e.target.value);
          if (found) onChange(found.value);
        }}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
