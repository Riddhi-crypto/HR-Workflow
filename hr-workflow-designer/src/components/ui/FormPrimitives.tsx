import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';
import { Plus, X } from 'lucide-react';

export function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="field-label">
        {label}
        {required && <span className="ml-0.5 text-accent">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-500">{hint}</span>}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx('field-input', props.className)} />;
}

export function TextArea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea {...props} className={clsx('field-textarea', props.className)} />
  );
}

export function NumberInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      type="number"
      className={clsx('field-input', props.className)}
    />
  );
}

export function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="field-input"
    >
      {children}
    </select>
  );
}

export function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-sm hover:bg-ink-50"
    >
      <span className="text-ink-900">{label}</span>
      <span
        className={clsx(
          'relative h-4 w-7 rounded-full transition-colors',
          value ? 'bg-accent' : 'bg-ink-200',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform',
            value ? 'translate-x-3.5' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  );
}

/**
 * Key-value editor used for metadata and custom fields.
 */
export function KeyValueList({
  items,
  onChange,
}: {
  items: Array<{ key: string; value: string }>;
  onChange: (items: Array<{ key: string; value: string }>) => void;
}) {
  const update = (idx: number, patch: Partial<{ key: string; value: string }>) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const add = () => onChange([...items, { key: '', value: '' }]);

  return (
    <div className="space-y-1.5">
      {items.map((it, idx) => (
        <div key={idx} className="flex gap-1.5">
          <input
            placeholder="key"
            value={it.key}
            onChange={(e) => update(idx, { key: e.target.value })}
            className="field-input w-1/3 font-mono text-[12px]"
          />
          <input
            placeholder="value"
            value={it.value}
            onChange={(e) => update(idx, { value: e.target.value })}
            className="field-input flex-1 text-[12px]"
          />
          <button
            onClick={() => remove(idx)}
            className="rounded-md p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Remove"
          >
            <X size={13} />
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-1 text-[12px] font-medium text-accent hover:text-accent-hover"
      >
        <Plus size={12} strokeWidth={2.5} /> Add row
      </button>
    </div>
  );
}

/**
 * Chip editor for keyword lists (ATS required keywords).
 */
export function ChipEditor({
  items,
  onChange,
  placeholder = 'Add keyword…',
}: {
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="rounded-md border border-ink-200 bg-white p-1.5">
      <div className="flex flex-wrap gap-1">
        {items.map((item, idx) => (
          <span
            key={`${item}-${idx}`}
            className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700"
          >
            {item}
            <button
              onClick={() => onChange(items.filter((_, i) => i !== idx))}
              className="text-emerald-500 hover:text-emerald-900"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              const v = (e.currentTarget.value || '').trim().replace(/,$/, '');
              if (v && !items.includes(v)) onChange([...items, v]);
              e.currentTarget.value = '';
            } else if (
              e.key === 'Backspace' &&
              !e.currentTarget.value &&
              items.length
            ) {
              onChange(items.slice(0, -1));
            }
          }}
          className="min-w-[100px] flex-1 bg-transparent px-1 py-0.5 text-[12px] outline-none placeholder:text-ink-400"
        />
      </div>
    </div>
  );
}
