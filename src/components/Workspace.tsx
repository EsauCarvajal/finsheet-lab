import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DataGrid, type Column, type RenderEditCellProps } from 'react-data-grid';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileSpreadsheet,
  Lightbulb,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { challenges, cellLabels, modules } from '../content/catalog';
import { WorkerEngine } from '../engine/client';
import { DifficultyTag } from '../App';
import {
  pointsFor,
  type ActivityProgress,
  type Cells,
  type ChallengeDefinition,
  type EngineView,
  type EvaluationResult,
  type Language,
} from '../types';
import s from '../styles/App.module.css';
import w from '../styles/Workspace.module.css';
import LanguageSwitch from './LanguageSwitch';

const EMPTY: Cells = {};
type Row = { id: number; [key: string]: string | number };
function CellEditor({ row, column, onRowChange }: RenderEditCellProps<Row>) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);
  return (
    <input
      ref={input}
      className={w.cellEditor}
      aria-label={`Formula ${column.key}${row.id}`}
      maxLength={512}
      value={String(row[column.key] ?? '')}
      onChange={(e) => onRowChange({ ...row, [column.key]: e.target.value })}
    />
  );
}
function formatted(value: string | undefined, format: string | undefined, lang: Language) {
  if (value === undefined || value === '') return '';
  if (value.startsWith('#')) return value;
  if (Number.isFinite(Number(value))) {
    const n = Number(value);
    if (format === 'date') {
      return new Intl.DateTimeFormat(lang === 'es' ? 'es-CO' : 'en-US', { timeZone: 'UTC' }).format(
        new Date(Date.UTC(1899, 11, 30) + n * 86400000),
      );
    }
    return new Intl.NumberFormat(
      lang === 'es' ? 'es-CO' : 'en-US',
      format === 'percent'
        ? { style: 'percent', maximumFractionDigits: 2 }
        : {
            maximumFractionDigits: format === 'money' ? 2 : 6,
            minimumFractionDigits: format === 'money' ? 2 : 0,
          },
    ).format(n);
  }
  return cellLabels[value]?.[lang] ?? value;
}

export default function Workspace({
  challenge: c,
  activity,
  lang,
  defaultFormulaLanguage,
  onUpdate,
  onFormulaLanguage,
  saving,
  storageError,
}: {
  challenge: ChallengeDefinition;
  activity: ActivityProgress | undefined;
  lang: Language;
  defaultFormulaLanguage: Language;
  onUpdate: (patch: Partial<ActivityProgress>) => void;
  onFormulaLanguage: (lang: Language) => void;
  saving: boolean;
  storageError: boolean;
}) {
  const { t } = useTranslation();
  useLayoutEffect(() => {
    document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true });
  }, [c]);
  const [engine] = useState(() => new WorkerEngine());
  const draft = activity?.draft ?? EMPTY;
  const formulaLang = activity?.formulaLanguage ?? defaultFormulaLanguage;
  const [view, setView] = useState<EngineView>({ values: {}, formulas: {}, solutions: {} });
  const [solutions, setSolutions] = useState<Cells>({});
  const [selected, setSelected] = useState(c.targets[0].cell);
  const [input, setInput] = useState(draft[c.targets[0].cell] ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [tab, setTab] = useState<'instructions' | 'sheet'>('instructions');
  const interpretation = activity?.interpretation;
  const targetCells = useMemo(() => new Set(c.targets.map((v) => v.cell)), [c]);
  const isEditable = targetCells.has(selected);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const inputRef = useRef(input);
  inputRef.current = input;
  useEffect(() => () => engine.dispose(), [engine]);
  useEffect(() => {
    let active = true;
    engine
      .calculate(c, {}, formulaLang)
      .then((value) => {
        if (active) setSolutions(value.solutions);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [c, engine, formulaLang]);
  useEffect(() => {
    let active = true;
    setReady(false);
    const timer = setTimeout(() => {
      engine
        .calculate(c, draft, formulaLang)
        .then((value) => {
          if (active) {
            setView(value);
            setError('');
          }
        })
        .catch((e) => {
          if (active) {
            setView({ values: { ...c.seed }, formulas: draft, solutions: {} });
            setError(e.message === 'ENGINE_TIMEOUT' ? 'timeout' : 'engineError');
          }
        })
        .finally(() => {
          if (active) setReady(true);
        });
    }, 120);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [c, draft, engine, formulaLang]);
  useEffect(() => {
    setInput(draft[selected] ?? c.seed[selected] ?? '');
  }, [draft, selected, c]);
  const updateDraft = (next: Cells) => {
    setResult(null);
    onUpdate({ draft: next, formulaLanguage: formulaLang });
  };
  const pendingDraft = () =>
    targetCells.has(selectedRef.current) &&
    inputRef.current !== (draftRef.current[selectedRef.current] ?? '')
      ? { ...draftRef.current, [selectedRef.current]: inputRef.current }
      : draftRef.current;
  const commit = () => {
    const next = pendingDraft();
    if (next !== draftRef.current) updateDraft(next);
    return next;
  };
  const setCell = (cell: string) => {
    commit();
    setSelected(cell);
    setInput(draftRef.current[cell] ?? c.seed[cell] ?? '');
  };
  const check = async () => {
    const next = commit();
    setBusy(true);
    setError('');
    onUpdate({
      draft: next,
      formulaLanguage: formulaLang,
      attempts: Math.min((activity?.attempts ?? 0) + 1, 1000000),
    });
    try {
      const evaluated = await engine.evaluate(c, next, formulaLang, interpretation);
      setResult(evaluated);
      if (evaluated.passed)
        onUpdate({
          completed: true,
          assisted: activity?.completed ? activity.assisted : !!activity?.solutionViewed,
          completedAt: activity?.completedAt ?? new Date().toISOString(),
        });
    } catch (e) {
      setError(e instanceof Error && e.message === 'ENGINE_TIMEOUT' ? 'timeout' : 'engineError');
    } finally {
      setBusy(false);
    }
  };
  const changeFormulaLanguage = async (to: Language) => {
    if (to === formulaLang) return;
    const next = commit();
    setBusy(true);
    try {
      const converted = await engine.translate(c, next, formulaLang, to);
      onUpdate({ draft: converted, formulaLanguage: to });
      onFormulaLanguage(to);
      setInput(converted[selected] ?? c.seed[selected] ?? '');
      setResult(null);
      setError('');
    } catch {
      setError('engineError');
    } finally {
      setBusy(false);
    }
  };
  const rows = useMemo(
    () =>
      Array.from(
        {
          length: Math.max(
            14,
            ...Object.keys(c.seed).map((k) => Number(k.slice(1))),
            ...c.targets.map((t) => Number(t.cell.slice(1))),
          ),
        },
        (_, i) => {
          const row: Row = { id: i + 1 };
          for (let col = 0; col < 6; col++) {
            const key = String.fromCharCode(65 + col),
              cell = `${key}${i + 1}`;
            row[key] = draft[cell] ?? c.seed[cell] ?? '';
          }
          return row;
        },
      ),
    [c, draft],
  );
  const columns = useMemo<Column<Row>[]>(
    () => [
      {
        key: 'id',
        name: '',
        width: 42,
        frozen: true,
        renderCell: ({ row }) => <span className={w.rowNumber}>{row.id}</span>,
        cellClass: w.rowNumberCell,
      },
      ...Array.from({ length: 6 }, (_, i) => {
        const key = String.fromCharCode(65 + i);
        return {
          key,
          name: key,
          width: i === 0 ? 160 : 142,
          resizable: true,
          editable: (row: Row) => targetCells.has(`${key}${row.id}`),
          renderEditCell: CellEditor,
          cellClass: (row: Row) => {
            const cell = `${key}${row.id}`;
            return [
              w.gridCell,
              row.id === 1 ? w.headerCell : '',
              targetCells.has(cell) ? w.editableCell : '',
              result?.checks.some((v) => v.cell === cell && !v.passed) ? w.invalidCell : '',
            ].join(' ');
          },
          renderCell: ({ row }: { row: Row }) => {
            const cell = `${key}${row.id}`,
              target = c.targets.find((t) => t.cell === cell),
              value =
                view.values[cell] ??
                (!draft[cell]?.startsWith('=') ? draft[cell] : undefined) ??
                c.seed[cell];
            const isDate = !target && c.seed[cell]?.startsWith('=DATE(');
            return (
              <span
                title={draft[cell] ?? c.seed[cell] ?? ''}
                className={Number.isFinite(Number(value)) && value !== '' ? w.numeric : ''}
              >
                {formatted(value, target?.format ?? (isDate ? 'date' : undefined), lang)}
                {targetCells.has(cell) && !draft[cell] && (
                  <span className={w.emptyCellMark}>ƒx</span>
                )}
              </span>
            );
          },
        };
      }),
    ],
    [c, targetCells, view, result, lang, draft],
  );
  const next = challenges[challenges.findIndex((item) => item.id === c.id) + 1] ?? challenges[0];
  const module = modules.find((m) => m.id === c.module);
  const reasonKeys = {
    correct: 'correct',
    formula: 'formulaRequired',
    error: 'formulaError',
    value: 'wrongValue',
    variant: 'wrongVariant',
    reference: 'wrongReference',
  };
  return (
    <>
      <a href={c.difficulty === 'case' ? '#cases' : '#catalog'} className={w.back}>
        <ArrowLeft size={15} />
        {t('back')}
      </a>
      <div className={w.titleRow}>
        <div>
          <span className={s.pageKicker}>{module?.title[lang] ?? 'FP&A LAB'}</span>
          <h1 tabIndex={-1}>{c.title[lang]}</h1>
          <div className={s.challengeMeta}>
            <DifficultyTag difficulty={c.difficulty} />
            <span>
              <Clock3 size={13} /> {c.minutes} {t('minutes')}
            </span>
            <span>
              <Sparkles size={13} /> {pointsFor(c.difficulty)} XP
            </span>
            {activity?.completed && (
              <span className={s.completedLabel}>
                <CheckCircle2 size={15} />
                {t('completed')}
              </span>
            )}
          </div>
        </div>
        <div className={w.saved}>
          <span className={s.statusDot} />
          {storageError
            ? lang === 'es'
              ? 'Solo esta sesión'
              : 'This session only'
            : t(saving ? 'saving' : 'saved')}
        </div>
      </div>
      <div className={w.mobileTabs}>
        <button
          className={tab === 'instructions' ? w.tabActive : ''}
          onClick={() => setTab('instructions')}
        >
          {t('instructions')}
        </button>
        <button className={tab === 'sheet' ? w.tabActive : ''} onClick={() => setTab('sheet')}>
          {t('sheet')}
        </button>
      </div>
      <div className={w.workspace}>
        <section className={`${w.instructions} ${tab === 'instructions' ? w.mobileVisible : ''}`}>
          <div className={w.instructionsHeader}>
            <BookLabel />
            {t('instructions')}
          </div>
          <div className={w.instructionsBody}>
            <div className={w.mission}>
              <span className={s.tinyLabel}>{t('task')}</span>
              <p>{c.task[lang]}</p>
            </div>
            <div className={w.targets}>
              {c.targets.map((target) => (
                <button
                  key={target.cell}
                  onClick={() => {
                    setCell(target.cell);
                    setTab('sheet');
                  }}
                >
                  <code>{target.cell}</code>
                  <span>{target.label[lang]}</span>
                  {result?.checks.find((v) => v.cell === target.cell)?.passed && (
                    <Check size={14} />
                  )}
                </button>
              ))}
            </div>
            <details className={w.concept}>
              <summary>
                {t('lesson')}
                <ChevronDown size={14} />
              </summary>
              <p>{c.lesson[lang]}</p>
            </details>
            <div className={w.hints}>
              {Array.from({ length: activity?.hints ?? 0 }, (_, i) => (
                <div key={i} className={w.hintBox}>
                  <Lightbulb size={16} />
                  <p>{c.hints[i][lang]}</p>
                </div>
              ))}
              <button
                className={s.secondary}
                disabled={(activity?.hints ?? 0) >= 2}
                onClick={() => onUpdate({ hints: Math.min((activity?.hints ?? 0) + 1, 2) })}
              >
                <Lightbulb size={16} />
                {t('hint')}
                <span>{activity?.hints ?? 0}/2</span>
              </button>
            </div>
            <button
              className={w.solutionButton}
              onClick={() => {
                setShowSolution((v) => !v);
                onUpdate({ solutionViewed: true });
              }}
            >
              {t('solution')}
              <ChevronDown size={15} />
            </button>
            {showSolution && (
              <div className={w.solutionBox}>
                <h3>{t('solutionTitle')}</h3>
                <p>{t('solutionNote')}</p>
                {c.targets.map((target) => (
                  <div key={target.cell}>
                    <strong>{target.cell}</strong>
                    <code>{solutions[target.cell] ?? target.formula}</code>
                  </div>
                ))}
                <p>{c.explanation[lang]}</p>
              </div>
            )}
          </div>
        </section>
        <div className={`${w.sheetColumn} ${tab === 'sheet' ? w.mobileVisible : ''}`}>
          <section className={w.sheetCard}>
            <div className={w.sheetHeader}>
              <span>
                <FileSpreadsheet size={18} />
                {t('sheet')}
              </span>
              <div>
                <span className={w.languageLabel}>{t('formulaLanguage')}</span>
                <LanguageSwitch
                  id="formula-language"
                  label={t('formulaLanguage')}
                  value={formulaLang}
                  disabled={busy}
                  compact
                  onChange={(language) => void changeFormulaLanguage(language)}
                />
                <button
                  className={s.iconButton}
                  onClick={() => {
                    updateDraft({});
                    setInput('');
                    setError('');
                  }}
                  aria-label={t('reset')}
                  title={t('reset')}
                  disabled={busy}
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
            <form
              className={w.formulaBar}
              onSubmit={(e) => {
                e.preventDefault();
                commit();
              }}
            >
              <label className="sr-only" htmlFor="selected-cell">
                {t('selectedCell')}
              </label>
              <select
                id="selected-cell"
                value={isEditable ? selected : ''}
                onChange={(e) => setCell(e.target.value)}
              >
                {!isEditable && (
                  <option value="" disabled>
                    {selected}
                  </option>
                )}
                {c.targets.map((target) => (
                  <option key={target.cell} value={target.cell}>
                    {target.cell}
                  </option>
                ))}
              </select>
              <span className={w.fx}>ƒx</span>
              <input
                aria-label={t('formula')}
                value={input}
                onChange={(e) => {
                  const value = e.target.value;
                  setInput(value);
                  if (isEditable) updateDraft({ ...draftRef.current, [selected]: value });
                }}
                maxLength={512}
                readOnly={!isEditable}
                placeholder={isEditable ? '=…' : ''}
                spellCheck={false}
                autoComplete="off"
              />
              <button type="submit" aria-label={t('apply')} disabled={!isEditable || busy}>
                <Check size={17} />
              </button>
            </form>
            <DataGrid<Row>
              className={w.dataGrid}
              aria-label={t('sheet')}
              columns={columns}
              rows={rows}
              rowKeyGetter={(row) => row.id}
              rowHeight={37}
              headerRowHeight={30}
              onActivePositionChange={({ row, column }) => {
                if (row && column && column.key !== 'id') setCell(`${column.key}${row.id}`);
              }}
              onRowsChange={(updated, { indexes, column }) => {
                const next = { ...draft };
                for (const i of indexes) {
                  const cell = `${column.key}${updated[i].id}`;
                  if (targetCells.has(cell)) next[cell] = String(updated[i][column.key]);
                }
                updateDraft(next);
                if (indexes.some((i) => `${column.key}${updated[i].id}` === selected))
                  setInput(next[selected] ?? '');
              }}
              onCellCopy={({ row, column }, event) => {
                event.clipboardData.setData('text/plain', String(row[column.key] ?? ''));
                event.preventDefault();
              }}
              onCellPaste={({ row, column }, event) => {
                const cell = `${column.key}${row.id}`;
                if (!targetCells.has(cell)) return row;
                return {
                  ...row,
                  [column.key]: event.clipboardData.getData('text/plain').slice(0, 512),
                };
              }}
            />
            <div className={w.sheetFooter}>
              <span>
                <span className={w.editableDot} />
                {t('editable')}
              </span>
              <span>FinSheet · 01</span>
            </div>
          </section>
          <details className={w.sheetHelp}>
            <summary>
              {t('sheetHelp')}
              <ChevronDown size={14} />
            </summary>
            <p>{t('formulaHelp')}</p>
            <p>{t('keyboardHelp')}</p>
          </details>
          {!isEditable && <p className={w.readonlyNote}>{t('readonly')}</p>}
          {c.interpretation && (
            <fieldset className={w.interpretation}>
              <legend>{t('interpretation')}</legend>
              <small>{t('interpretationNote')}</small>
              <p>{c.interpretation.question[lang]}</p>
              {c.interpretation.options.map((option, i) => (
                <label key={i} className={interpretation === i ? w.optionSelected : ''}>
                  <input
                    type="radio"
                    name="interpretation"
                    checked={interpretation === i}
                    onChange={() => {
                      setResult(null);
                      onUpdate({ interpretation: i });
                    }}
                  />
                  {option[lang]}
                </label>
              ))}
            </fieldset>
          )}
          {error && (
            <div className={s.warning} role="alert">
              <XCircle size={18} />
              {t(error)}
            </div>
          )}
          <div className={w.checkRow}>
            <span>
              {ready ? (
                <>
                  <ShieldCheck size={14} />
                  {lang === 'es'
                    ? 'Cálculo local · Sin enviar tus fórmulas'
                    : 'Local calculation · Your formulas stay here'}
                </>
              ) : (
                t('loading')
              )}
            </span>
            <button className={s.primary} onClick={() => void check()} disabled={busy || !ready}>
              <Play size={16} fill="currentColor" />
              {t(busy ? 'checking' : 'check')}
            </button>
          </div>
          {result && (
            <section
              className={`${w.feedback} ${result.passed ? w.feedbackSuccess : w.feedbackRetry}`}
              role="status"
            >
              <div className={w.feedbackHeading}>
                {result.passed ? <CheckCircle2 size={26} /> : <Lightbulb size={26} />}
                <div>
                  <h2>{t(result.passed ? 'passedTitle' : 'retryTitle')}</h2>
                  <p>{t(result.passed ? 'passedText' : 'retryText')}</p>
                </div>
                {result.passed && <strong>+{pointsFor(c.difficulty)} XP</strong>}
              </div>
              {result.passed ? (
                <>
                  <p>{c.explanation[lang]}</p>
                  {activity?.assisted && <span className={s.difficulty}>{t('assisted')}</span>}
                  {c.interpretation && <p>{c.interpretation.explanation[lang]}</p>}
                  <a href={`#learn/${next.id}`} className={s.secondary}>
                    {t('nextChallenge')}
                    <ArrowRight size={16} />
                  </a>
                </>
              ) : (
                <ul>
                  {result.checks
                    .filter((check) => !check.passed)
                    .map((check) => (
                      <li key={check.cell}>
                        <code>{check.cell}</code> {t(reasonKeys[check.reason])}
                      </li>
                    ))}
                  {!result.interpretationPassed && <li>{t('wrongInterpretation')}</li>}
                </ul>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
function BookLabel() {
  return <FileSpreadsheet size={18} />;
}
