import {
  Suspense,
  lazy,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Calculator,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  CircleHelp,
  Database,
  Download,
  FileSpreadsheet,
  GitBranch,
  Globe2,
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Upload,
  X,
} from 'lucide-react';
import { challenges, findChallenge, modules, totalPoints } from './content/catalog';
import appI18n, { functionNames } from './i18n';
import {
  BrowserProgressRepository,
  emptyProgress,
  nextChallenge,
  parseBackup,
  progressStats,
} from './storage/progress';
import {
  pointsFor,
  type ActivityProgress,
  type ChallengeDefinition,
  type Language,
  type ProgressState,
} from './types';
import type WorkspaceComponent from './components/Workspace';
import s from './styles/App.module.css';
import layout from './styles/Shell.module.css';
import LanguageSwitch from './components/LanguageSwitch';

const repository = new BrowserProgressRepository();
const LazyWorkspace = lazy(() => import('./components/Workspace'));
function Workspace(props: ComponentProps<typeof WorkspaceComponent>) {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<p role="status">{t('loading')}</p>}>
      <LazyWorkspace {...props} />
    </Suspense>
  );
}
const moduleIcons = {
  calculator: Calculator,
  git: GitBranch,
  chart: ChartNoAxesCombined,
  search: Search,
  calendar: CalendarDays,
  trend: TrendingUp,
};
export function ModuleIcon({ icon, size = 22 }: { icon: string; size?: number }) {
  const Icon = moduleIcons[icon as keyof typeof moduleIcons] ?? BookOpen;
  return <Icon size={size} strokeWidth={1.7} />;
}
function useRoute() {
  const [hash, setHash] = useState(location.hash.slice(1) || 'home');
  useEffect(() => {
    const cb = () => setHash(location.hash.slice(1) || 'home');
    window.addEventListener('hashchange', cb);
    return () => window.removeEventListener('hashchange', cb);
  }, []);
  return hash;
}
export function DifficultyTag({ difficulty }: { difficulty: ChallengeDefinition['difficulty'] }) {
  const { t } = useTranslation();
  return (
    <span className={`${s.difficulty} ${s[difficulty]}`}>
      <span /> {t(difficulty)}
    </span>
  );
}

export default function App() {
  const { t, i18n } = useTranslation();
  const route = useRoute();
  const page = route.split('?')[0].split('/')[0];
  const [state, setState] = useState<ProgressState>(emptyProgress);
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menu, setMenu] = useState(false);
  const saveQueue = useRef(Promise.resolve());
  const lang = (i18n.resolvedLanguage === 'en' ? 'en' : 'es') as Language;
  // The translation hook returns a new wrapper after language changes. Load
  // persisted state only on mount, using the stable application instance.
  useEffect(() => {
    let active = true;
    repository
      .load()
      .then((value) => {
        if (active) {
          setState(value);
          void appI18n.changeLanguage(value.settings.language);
        }
      })
      .catch(() => {
        if (active) setStorageError(true);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!loaded) return;
    let active = true;
    setSaving(true);
    saveQueue.current = saveQueue.current
      .catch(() => {})
      .then(() => repository.save(state))
      .then(() => {
        if (active) setStorageError(false);
      })
      .catch(() => {
        if (active) setStorageError(true);
      })
      .finally(() => {
        if (active) setSaving(false);
      });
    return () => {
      active = false;
    };
  }, [state, loaded]);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title =
      lang === 'es'
        ? 'FinSheet Lab · Excel para el mundo financiero'
        : 'FinSheet Lab · Excel for the financial world';
  }, [lang]);
  useLayoutEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
    document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true });
  }, [route]);
  useEffect(() => {
    if (!menu) return;
    const closeMenu = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenu(false);
      document.getElementById('navigation-toggle')?.focus();
    };
    document.addEventListener('keydown', closeMenu);
    return () => document.removeEventListener('keydown', closeMenu);
  }, [menu]);
  const updateActivity = (id: string, patch: Partial<ActivityProgress>) =>
    setState((previous) => {
      const c = findChallenge(id)!;
      const existing = previous.activities[id] ?? {
        version: c.version,
        draft: {},
        formulaLanguage: previous.settings.formulaLanguage,
        attempts: 0,
        hints: 0,
        solutionViewed: false,
        completed: false,
        assisted: false,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...previous,
        activities: {
          ...previous.activities,
          [id]: { ...existing, ...patch, updatedAt: new Date().toISOString() },
        },
      };
    });
  const setLanguage = (language: Language) => {
    void appI18n.changeLanguage(language);
    setState((p) => ({ ...p, settings: { ...p.settings, language } }));
  };
  const active = page === 'learn' ? 'catalog' : page;
  return (
    <div className={layout.app}>
      <a
        href="#main-content"
        className={layout.skip}
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        {lang === 'es' ? 'Saltar al contenido' : 'Skip to content'}
      </a>
      <header className={layout.header}>
        <div className={layout.headerInner}>
          <a href="#home" className={layout.brand} aria-label="FinSheet Lab">
            <span>
              <FileSpreadsheet size={21} />
            </span>
            <span>
              FinSheet<em>Lab</em>
            </span>
          </a>
          <nav
            id="primary-navigation"
            className={`${layout.nav} ${menu ? layout.navOpen : ''}`}
            aria-label={lang === 'es' ? 'Navegación principal' : 'Main navigation'}
          >
            {['catalog', 'cases', 'progress'].map((id) => (
              <a key={id} href={`#${id}`} aria-current={active === id ? 'page' : undefined}>
                {t(id)}
              </a>
            ))}
          </nav>
          <LanguageSwitch
            id="ui-language"
            label={t('language')}
            value={lang}
            onChange={setLanguage}
            disabled={!loaded}
          />
          <button
            id="navigation-toggle"
            className={layout.menuButton}
            aria-label="Menu"
            aria-expanded={menu}
            aria-controls="primary-navigation"
            onClick={() => setMenu((value) => !value)}
          >
            {menu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className={`${layout.main} ${page === 'home' ? layout.landing : ''} ${page === 'learn' ? layout.practice : ''}`}
      >
        {storageError && (
          <div className={s.warning} role="status">
            <Database size={18} />
            {t('storageError')}
          </div>
        )}
        {!loaded ? (
          <p role="status">{t('loading')}</p>
        ) : page === 'home' ? (
          <Home state={state} lang={lang} />
        ) : page === 'catalog' || page === 'cases' ? (
          <Catalog
            key={route}
            state={state}
            lang={lang}
            casesOnly={page === 'cases'}
            initialModule={new URLSearchParams(route.split('?')[1]).get('module') ?? ''}
          />
        ) : page === 'progress' ? (
          <Progress
            state={state}
            lang={lang}
            onReplace={(value) => {
              setState(value);
              void appI18n.changeLanguage(value.settings.language);
            }}
          />
        ) : page === 'about' ? (
          <About />
        ) : page === 'learn' && findChallenge(route.split('/')[1]) ? (
          <Workspace
            key={route}
            challenge={findChallenge(route.split('/')[1])!}
            activity={state.activities[route.split('/')[1]]}
            lang={lang}
            defaultFormulaLanguage={state.settings.formulaLanguage}
            onUpdate={(patch) => updateActivity(route.split('/')[1], patch)}
            onFormulaLanguage={(language) =>
              setState((p) => ({ ...p, settings: { ...p.settings, formulaLanguage: language } }))
            }
            saving={saving}
            storageError={storageError}
          />
        ) : (
          <div className={s.empty}>
            <CircleHelp size={36} />
            <h1 tabIndex={-1}>
              {lang === 'es' ? 'Este reto no existe.' : 'This challenge does not exist.'}
            </h1>
            <a href="#catalog" className={s.primary}>
              {t('back')}
            </a>
          </div>
        )}
      </main>
      <footer className={layout.footer}>
        <span>FinSheet Lab</span>
        <a href="#about">{t('about')}</a>
        <span className={layout.footerNote}>
          <ShieldCheck size={13} aria-hidden="true" />
          {t('localShort')}
        </span>
      </footer>
    </div>
  );
}

function Home({ state, lang }: { state: ProgressState; lang: Language }) {
  const { t } = useTranslation();
  const next = nextChallenge(state);
  const started = Object.keys(state.activities).length > 0;
  return (
    <>
      <section className={layout.landingHero}>
        <div className={layout.heroCopy}>
          <span className={layout.eyebrow}>{t('heroEyebrow')}</span>
          <h1 tabIndex={-1}>
            {t('heroTitle')
              .split('\n')
              .map((line) => (
                <span key={line}>{line}</span>
              ))}
          </h1>
          <p>{t('heroText')}</p>
          <div className={layout.heroActions}>
            <a href={`#learn/${next.id}`} className={s.primary}>
              {t(started ? 'continue' : 'start')}
              <ArrowRight size={18} />
            </a>
            <a href="#catalog">
              {t('explore')}
              <ChevronRight size={16} />
            </a>
          </div>
          <span className={layout.heroNote}>
            <CheckCircle2 size={15} />
            {t('landingNote')}
          </span>
        </div>
        <div className={layout.art}>
          <HeroSheet lang={lang} />
        </div>
      </section>
      <div className={layout.summary}>
        <span>
          <strong>24</strong>
          {t('challenges')}
        </span>
        <span>
          <strong>6</strong>
          {t('modules')}
        </span>
        <span>
          <strong>3</strong>
          {t('caseCount')}
        </span>
        <details className={layout.syllabus}>
          <summary>
            {t('syllabus')}
            <ChevronDown size={15} />
          </summary>
          <ol>
            {modules.map((module, index) => (
              <li key={module.id}>
                <a href={`#catalog?module=${module.id}`}>
                  <span>0{index + 1}</span>
                  <span>{module.title[lang]}</span>
                </a>
              </li>
            ))}
          </ol>
        </details>
      </div>
    </>
  );
}

function HeroSheet({ lang }: { lang: Language }) {
  return (
    <div className={s.heroArt} aria-hidden="true">
      <div className={s.artDotGrid} />
      <div className={s.floatingFormula}>
        <span>ƒx</span> {lang === 'es' ? '=SUMA(B2:B5)' : '=SUM(B2:B5)'}{' '}
        <span className={s.formulaCheck}>
          <Check size={13} />
        </span>
      </div>
      <div className={`${s.mockSheet} ${layout.largeSheet}`}>
        <div className={s.mockTitle}>
          <span className={s.mockFile}>
            <FileSpreadsheet size={15} />
          </span>
          {lang === 'es' ? 'Análisis de ingresos' : 'Revenue analysis'}
          <span className={s.mockDots}>•••</span>
        </div>
        <div className={s.mockFormulaBar}>
          <span>B6</span>
          <i>ƒx</i>
          <code>{lang === 'es' ? '=SUMA(B2:B5)' : '=SUM(B2:B5)'}</code>
        </div>
        <table>
          <thead>
            <tr>
              <th />
              <th>A</th>
              <th>B</th>
              <th>C</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>1</th>
              <td>{lang === 'es' ? 'Mes' : 'Month'}</td>
              <td>{lang === 'es' ? 'Ventas' : 'Sales'}</td>
              <td>{lang === 'es' ? 'Meta' : 'Target'}</td>
            </tr>
            {[
              ['JAN', '12.500', '12.000'],
              ['FEB', '15.800', '14.000'],
              ['MAR', '14.200', '14.000'],
              ['APR', '17.500', '16.000'],
            ].map((row, i) => (
              <tr key={row[0]}>
                <th>{i + 2}</th>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
            <tr>
              <th>6</th>
              <td>Total</td>
              <td className={s.mockSelected}>
                60.000
                <span />
              </td>
              <td>56.000</td>
            </tr>
          </tbody>
        </table>
        <div className={s.mockSheetTabs}>
          <span>
            <FileSpreadsheet size={12} />
            {lang === 'es' ? 'Ventas' : 'Sales'}
          </span>
          <span>+</span>
        </div>
      </div>
      <div className={s.growthBadge}>
        <span>
          <TrendingUp size={22} />
        </span>
        <div>
          <small>{lang === 'es' ? 'Sobre la meta' : 'Above target'}</small>
          <strong>
            +7,1 % <ArrowUpRight size={16} />
          </strong>
        </div>
      </div>
      <div className={s.artSpark}>✦</div>
    </div>
  );
}

function Catalog({
  state,
  lang,
  casesOnly,
  initialModule,
}: {
  state: ProgressState;
  lang: Language;
  casesOnly: boolean;
  initialModule: string;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [module, setModule] = useState(initialModule);
  const [difficulty, setDifficulty] = useState('');
  const [status, setStatus] = useState('');
  const list = challenges.filter((c) => {
    const a = state.activities[c.id];
    const m = modules.find((m) => m.id === c.module);
    const haystack = [
      c.title.es,
      c.title.en,
      c.task.es,
      c.task.en,
      ...(m?.functions ?? []),
      ...(m?.functions ?? []).map((f) => functionNames[f] ?? f),
    ]
      .join(' ')
      .toLowerCase();
    return (
      (casesOnly ? c.difficulty === 'case' : true) &&
      (!module || c.module === module) &&
      (!difficulty || c.difficulty === difficulty) &&
      (!status ||
        (status === 'completed'
          ? a?.completed
          : status === 'inProgress'
            ? a && !a.completed
            : !a)) &&
      haystack.includes(search.trim().toLowerCase())
    );
  });
  return (
    <>
      <div className={layout.contentHeader}>
        <h1 tabIndex={-1}>{t(casesOnly ? 'casesTitle' : 'catalogTitle')}</h1>
        <p>{t(casesOnly ? 'casesText' : 'catalogText')}</p>
      </div>
      {!casesOnly && (
        <div className={s.filters}>
          <label className={s.searchBox}>
            <Search size={18} />
            <input
              aria-label={t('search')}
              placeholder={t('search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            aria-label={t('topic')}
            value={module}
            onChange={(e) => setModule(e.target.value)}
          >
            <option value="">{t('allModules')}</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title[lang]}
              </option>
            ))}
            <option value="cases">{t('cases')}</option>
          </select>
          <select
            aria-label={t('difficulty')}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="">{t('allDifficulties')}</option>
            {['easy', 'medium', 'hard', 'case'].map((d) => (
              <option key={d} value={d}>
                {t(d)}
              </option>
            ))}
          </select>
          <select
            aria-label={t('status')}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">{t('allStatuses')}</option>
            {['pending', 'inProgress', 'completed'].map((v) => (
              <option key={v} value={v}>
                {t(v)}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className={casesOnly ? s.casesGrid : s.challengeGrid}>
        {list.map((c, i) => {
          const m = modules.find((m) => m.id === c.module);
          const completed = state.activities[c.id]?.completed;
          return (
            <a
              href={`#learn/${c.id}`}
              key={c.id}
              aria-label={`${t('openChallenge')}: ${c.title[lang]}`}
              className={`${s.challengeCard} ${layout.catalogCard} ${completed ? s.challengeCompleted : ''} ${casesOnly ? s.caseCard : ''}`}
            >
              <div className={s.challengeCardTop}>
                <span
                  className={s.moduleIcon}
                  style={{ color: m?.color ?? '#137c59', background: `${m?.color ?? '#137c59'}12` }}
                >
                  {casesOnly ? (
                    <FileSpreadsheet size={26} />
                  ) : (
                    <ModuleIcon icon={m?.icon ?? 'chart'} />
                  )}
                </span>
                {completed ? (
                  <span className={s.completedLabel}>
                    <CheckCircle2 size={15} />
                    {t('completed')}
                  </span>
                ) : (
                  <span className={s.xpTag}>+{pointsFor(c.difficulty)} XP</span>
                )}
              </div>

              <span className={s.challengeTopic}>{m?.title[lang] ?? 'FP&A'}</span>
              <h2>{c.title[lang]}</h2>
              {casesOnly && <p>{t(`caseSummary${i}`)}</p>}
              <div className={s.challengeMeta}>
                <DifficultyTag difficulty={c.difficulty} />
                <span>
                  {c.minutes} {t('minutes')}
                </span>
              </div>
            </a>
          );
        })}
      </div>
      {!list.length && (
        <div className={s.empty}>
          <Search size={36} />
          <p>{t('noResults')}</p>
          <button
            className={s.secondary}
            onClick={() => {
              setSearch('');
              setModule('');
              setDifficulty('');
              setStatus('');
            }}
          >
            {t('clearFilters')}
          </button>
        </div>
      )}
    </>
  );
}

function Progress({
  state,
  lang,
  onReplace,
}: {
  state: ProgressState;
  lang: Language;
  onReplace: (state: ProgressState) => void;
}) {
  const { t } = useTranslation();
  const stats = progressStats(state);
  const input = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState('');
  const level = stats.points >= 600 ? 3 : stats.points >= 300 ? 2 : stats.points >= 100 ? 1 : 0;
  const exportBackup = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `finsheet-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };
  const importBackup = async (file: File) => {
    try {
      if (file.size > 1024 * 1024) throw new Error();
      const parsed = parseBackup(await file.text());
      if (!window.confirm(t('importConfirm'))) return;
      onReplace(parsed);
      setNotice('importOk');
    } catch {
      setNotice('importError');
    } finally {
      if (input.current) input.current.value = '';
    }
  };
  const entries = Object.entries(state.activities)
    .sort((a, b) => b[1].updatedAt.localeCompare(a[1].updatedAt))
    .slice(0, 6);
  return (
    <>
      <div className={layout.contentHeader}>
        <h1 tabIndex={-1}>{t('progressTitle')}</h1>
        <p>{t('progressText')}</p>
      </div>
      <div className={s.progressHero}>
        <span className={s.progressTrophy}>
          <Trophy size={36} />
        </span>
        <div>
          <span className={s.tinyLabel}>{t(`skillLevel${level}`)}</span>
          <h2>
            {stats.points}
            <small> / {totalPoints} XP</small>
          </h2>
          <p>
            {stats.completed} / 27 {t('solved')}
          </p>
        </div>
        <div className={s.overallProgress}>
          <strong>{stats.percent}%</strong>
          <span>{t('completion')}</span>
          <div className={s.progressTrack}>
            <span style={{ width: `${stats.percent}%` }} />
          </div>
        </div>
      </div>
      <div className={s.sectionHeading}>
        <div>
          <h2>{t('yourBadges')}</h2>
          <p>{t('badgesText')}</p>
        </div>
      </div>
      <div className={s.badgeGrid}>
        {[
          ...modules.map((m) => ({
            id: m.id,
            title: m.title[lang],
            icon: m.icon,
            earned: challenges
              .filter((c) => c.module === m.id)
              .every((c) => state.activities[c.id]?.completed),
          })),
          {
            id: 'cases',
            title: t('caseBadge'),
            icon: 'trend',
            earned: challenges
              .filter((c) => c.difficulty === 'case')
              .every((c) => state.activities[c.id]?.completed),
          },
        ].map((b) => (
          <div className={`${s.badge} ${b.earned ? s.badgeEarned : ''}`} key={b.id}>
            <span>
              <Award size={30} />
            </span>
            <strong>{b.title}</strong>
            <small>{t(b.earned ? 'earned' : 'notEarned')}</small>
          </div>
        ))}
      </div>
      <div className={s.progressColumns}>
        <section className={s.activityCard}>
          <h2>{t('activity')}</h2>
          {!entries.length ? (
            <div className={s.empty}>
              <BookOpen size={28} />
              <p>{t('noActivity')}</p>
              <a href="#learn/foundation-01" className={s.primary}>
                {t('start')}
                <ArrowRight size={16} />
              </a>
            </div>
          ) : (
            entries.map(([id, p]) => (
              <a href={`#learn/${id}`} key={id} className={s.activityRow}>
                <span className={p.completed ? s.activityDone : s.activityPending}>
                  {p.completed ? <Check size={18} /> : <BookOpen size={18} />}
                </span>
                <div>
                  <strong>{findChallenge(id)?.title[lang]}</strong>
                  <small>
                    {t(p.completed ? 'completed' : 'inProgress')} · {p.attempts}{' '}
                    {t('totalAttempts').toLowerCase()}
                    {p.assisted ? ` · ${t('assisted')}` : ''}
                  </small>
                </div>
                <ChevronRight size={16} />
              </a>
            ))
          )}
        </section>
        <section className={s.backupCard}>
          <span className={s.backupIcon}>
            <Download size={24} />
          </span>
          <h2>{t('backupTitle')}</h2>
          <p>{t('backupText')}</p>
          <div className={s.backupActions}>
            <button className={s.primary} onClick={exportBackup}>
              <ArrowDownToLine size={17} />
              {t('export')}
            </button>
            <button className={s.secondary} onClick={() => input.current?.click()}>
              <Upload size={17} />
              {t('import')}
            </button>
            <input
              ref={input}
              className="sr-only"
              type="file"
              accept="application/json,.json"
              aria-label={t('import')}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importBackup(file);
              }}
            />
          </div>
          {notice && (
            <p className={notice === 'importError' ? s.errorText : s.successText} role="status">
              {t(notice)}
            </p>
          )}
          <button
            className={s.deleteButton}
            onClick={() => {
              if (window.confirm(t('deleteConfirm'))) {
                const empty = emptyProgress();
                empty.settings = state.settings;
                onReplace(empty);
                setNotice('');
              }
            }}
          >
            {t('delete')}
          </button>
        </section>
      </div>
      <p className={s.privacyNote}>
        <ShieldCheck size={17} />
        {t('localNotice')}
      </p>
    </>
  );
}

function About() {
  const { t } = useTranslation();
  return (
    <>
      <div className={layout.contentHeader}>
        <h1 tabIndex={-1}>{t('aboutTitle')}</h1>
        <p>{t('aboutIntro')}</p>
      </div>
      <div className={s.aboutGrid}>
        {[
          { key: 'aboutHow', Icon: Calculator },
          { key: 'aboutFinance', Icon: ChartNoAxesCombined },
          { key: 'aboutPrivacy', Icon: ShieldCheck },
          { key: 'aboutFuture', Icon: TrendingUp },
          { key: 'aboutOpen', Icon: GitBranch },
        ].map(({ key, Icon }) => (
          <section key={key} className={s.aboutCard}>
            <span className={s.moduleIcon}>
              <Icon size={24} />
            </span>
            <h2>{t(key)}</h2>
            <p>{t(`${key}Text`)}</p>
          </section>
        ))}
      </div>
    </>
  );
}
