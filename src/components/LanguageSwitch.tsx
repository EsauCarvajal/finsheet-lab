import type { KeyboardEvent } from 'react';
import { Globe2 } from 'lucide-react';
import type { Language } from '../types';
import s from '../styles/LanguageSwitch.module.css';

export default function LanguageSwitch({
  id,
  label,
  value,
  onChange,
  disabled = false,
  compact = false,
}: {
  id: string;
  label: string;
  value: Language;
  onChange: (language: Language) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button');
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : value === 'es' ? 1 : 0;
    buttons[index]?.focus();
    onChange(index === 0 ? 'es' : 'en');
  };
  return (
    <div
      id={id}
      role="group"
      aria-label={label}
      className={`${s.switch} ${compact ? s.compact : ''}`}
      onKeyDown={keyboard}
    >
      {!compact && <Globe2 size={16} aria-hidden="true" className={s.icon} />}
      <span className={s.track}>
        {(['es', 'en'] as const).map((language) => (
          <button
            key={language}
            type="button"
            lang={language}
            aria-label={language === 'es' ? 'Español' : 'English'}
            aria-pressed={value === language}
            tabIndex={value === language ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(language)}
            className={value === language ? s.active : ''}
          >
            <span className={s.full} aria-hidden="true">
              {language === 'es' ? 'Español' : 'English'}
            </span>
            <span className={s.short} aria-hidden="true">
              {language.toUpperCase()}
            </span>
          </button>
        ))}
      </span>
    </div>
  );
}
