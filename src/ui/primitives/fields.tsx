import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cx } from '../cx';
import { Icon, type IconName } from './icon';
import { MoneyInput } from './money-input';

import { FIELD } from './fields-base';

export { FIELD, MoneyInput };

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}
export function Input({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cx(FIELD, className)} />;
}
export function Select({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={cx(FIELD, className)} />;
}
export function Textarea({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={cx(FIELD, 'py-3', className)} />;
}
/** Switch sem JavaScript: checkbox com role="switch". */
export function Switch({
  name,
  defaultChecked,
  label,
}: {
  name: string;
  defaultChecked?: boolean;
  label: string;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="checkbox"
        role="switch"
        name={name}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="relative h-7 w-12 shrink-0 rounded-full bg-border transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary after:absolute after:left-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
      />
    </label>
  );
}

/** Opções em forma de chips, sem JavaScript (radios com estilo). */
export function RadioChips({
  name,
  options,
  defaultValue,
  rotulo,
}: {
  name: string;
  /** Com `icone`, o chip mostra só o ícone; o nome fica para leitor de tela e na dica ao passar o mouse. */
  options: { value: string; label: string; icone?: IconName }[];
  defaultValue?: string | null;
  /** Nome do grupo para leitor de tela. */
  rotulo?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={rotulo}>
      {options.map((o) => (
        <label key={o.value} className="cursor-pointer" title={o.icone ? o.label : undefined}>
          <input
            type="radio"
            name={name}
            value={o.value}
            defaultChecked={o.value === (defaultValue ?? '')}
            className="peer sr-only"
            aria-label={o.icone ? o.label : undefined}
          />
          <span
            className={cx(
              'inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-surface text-sm font-semibold peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-fg peer-focus-visible:ring-2 peer-focus-visible:ring-primary',
              o.icone ? 'w-11' : 'px-4',
            )}
          >
            {o.icone ? <Icon name={o.icone} size={20} /> : o.label}
          </span>
        </label>
      ))}
    </div>
  );
}

/** Escolha de cor: bolinhas com a cor; o nome vai para leitor de tela e para a dica ao passar o mouse. */
export function RadioCores({
  name,
  options,
  defaultValue,
  rotulo,
}: {
  name: string;
  options: readonly { value: string; label: string; cor: string }[];
  defaultValue?: string | null;
  rotulo: string;
}) {
  return (
    <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label={rotulo}>
      {options.map((o) => (
        <label key={o.value} className="cursor-pointer" title={o.label}>
          <input
            type="radio"
            name={name}
            value={o.value}
            defaultChecked={o.value === (defaultValue ?? '')}
            className="peer sr-only"
            aria-label={o.label}
          />
          <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-transparent peer-checked:border-ink peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface">
            <span aria-hidden className="h-8 w-8 rounded-full" style={{ backgroundColor: o.cor }} />
          </span>
        </label>
      ))}
    </div>
  );
}
