import { Suspense, lazy, useEffect, useRef, useState, type ComponentProps } from 'react';
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
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
    requestAnimationFrame(() => document.querySelector<HTMLElement>('main h1')?.focus());
  }, [route]);
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
  const stats = progressStats(state);
  const current = nextChallenge(state);
  const navigation = [
    { id: 'home', icon: LayoutDashboard },
    { id: 'catalog', icon: BookOpen },
    { id: 'cases', icon: FileSpreadsheet },
    { id: 'progress', icon: ChartNoAxesCombined },
  ];
  const active = page === 'learn' ? 'catalog' : page;
  return (
    <div className={s.app}>
      {menu && (
        <button className={s.overlay} onClick={() => setMenu(false)} aria-label={t('back')} />
      )}
      <aside className={`${s.sidebar} ${menu ? s.sidebarOpen : ''}`}>
        <a href="#home" className={s.brand} aria-label="FinSheet Lab">
          <span className={s.logo}>
            <FileSpreadsheet size={24} />
          </span>
          <span>
            FinSheet<span className={s.lab}>Lab</span>
            <small>{t('tagline')}</small>
          </span>
        </a>
        <div className={s.sidebarLabel}>
          {lang === 'es' ? 'APRENDE Y PRACTICA' : 'LEARN & PRACTICE'}
        </div>
        <nav aria-label={lang === 'es' ? 'Navegación principal' : 'Main navigation'}>
          {navigation.map(({ id, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className={`${s.navLink} ${active === id ? s.navActive : ''}`}
              aria-current={active === id ? 'page' : undefined}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{t(id)}</span>
              {id === 'cases' && (
                <span className={s.navCount} aria-hidden="true">
                  3
                </span>
              )}
              {active === id && <span className={s.navDot} aria-hidden="true" />}
            </a>
          ))}
        </nav>
        <div className={s.sideTip}>
          <span className={s.sideTipIcon}>
            <Lightbulb size={20} />
          </span>
          <strong>{lang === 'es' ? 'Una fórmula a la vez.' : 'One formula at a time.'}</strong>
          <p>
            {lang === 'es'
              ? 'Las grandes habilidades se construyen con pequeños pasos.'
              : 'Great skills are built through small steps.'}
          </p>
          <a href={`#learn/${current.id}`}>
            {t('continue')} <ArrowRight size={15} />
          </a>
        </div>
        <div className={s.sidebarBottom}>
          <a href="#about" className={`${s.navLink} ${active === 'about' ? s.navActive : ''}`}>
            <CircleHelp size={19} />
            {t('about')}
          </a>
          <div className={s.localStatus}>
            <span className={s.statusDot} />
            <div>
              <strong>{t('noAccount')}</strong>
              <small>{t('localShort')}</small>
            </div>
            <ShieldCheck size={17} />
          </div>
        </div>
      </aside>
      <div className={s.mainShell}>
        <header className={s.topbar}>
          <div className={s.topbarLeft}>
            <button
              className={`${s.iconButton} ${s.mobileMenu}`}
              onClick={() => setMenu((v) => !v)}
              aria-label="Menu"
              aria-expanded={menu}
            >
              {menu ? <X /> : <Menu />}
            </button>
            <div>
              <span className={s.eyebrow}>{t('workspace')}</span>
              <strong>{t('greeting')}</strong>
            </div>
          </div>
          <div className={s.topbarActions}>
            <div className={s.languageSwitch}>
              <Globe2 size={16} />
              <label className="sr-only" htmlFor="ui-language">
                {t('language')}
              </label>
              <select
                id="ui-language"
                disabled={!loaded}
                value={lang}
                onChange={(e) => setLanguage(e.target.value as Language)}
              >
                <option value="es">ES</option>
                <option value="en">EN</option>
              </select>
            </div>
            <span className={s.headerDivider} />
            <span className={s.avatar} title={t('noAccount')}>
              {lang === 'es' ? 'TÚ' : 'YOU'}
            </span>
          </div>
        </header>
        <main className={`${s.main} ${page === 'learn' ? s.mainWorkspace : ''}`}>
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
            <Progress state={state} lang={lang} onReplace={setState} />
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
        <footer className={s.footer}>
          <span>
            <span className={s.footerBrand}>FinSheet Lab</span> · {t('footer')}
          </span>
          <span>
            <ShieldCheck size={13} />
            {t('localShort')}
            <span className={s.footerDot}>·</span>ES / EN
          </span>
        </footer>
      </div>
    </div>
  );
}

function Home({ state, lang }: { state: ProgressState; lang: Language }) {
  const { t } = useTranslation();
  const stats = progressStats(state);
  const next = nextChallenge(state);
  const module = modules.find((m) => m.id === next.module);
  const allDone = stats.completed === 27;
  return (
    <>
      <section className={s.hero}>
        <div className={s.heroCopy}>
          <span className={s.heroEyebrow}>
            <span /> {t('heroEyebrow')}
          </span>
          <h1 tabIndex={-1}>
            {t('heroTitle')
              .split('\n')
              .map((line, i) => (
                <span key={line} className={i ? s.heroAccent : ''}>
                  {line}
                </span>
              ))}
          </h1>
          <p>{t('heroText')}</p>
          <div className={s.heroButtons}>
            <a href={`#learn/${next.id}`} className={s.primary}>
              {stats.completed ? t('continue') : t('start')} <ArrowRight size={17} />
            </a>
            <a href="#catalog" className={s.heroSecondary}>
              {t('explore')}
              <ChevronRight size={16} />
            </a>
          </div>
          <div className={s.heroTrust}>
            <span>
              <CheckCircle2 size={14} />
              {t('free')}
            </span>
            <span>
              <Globe2 size={14} />
              {t('bilingual')}
            </span>
          </div>
        </div>
        <HeroSheet lang={lang} />
      </section>
      <div className={s.metrics}>
        {[
          { number: '24', label: t('challenges'), Icon: Target },
          { number: '06', label: t('modules'), Icon: BookOpen },
          { number: '03', label: t('caseCount'), Icon: ChartNoAxesCombined },
          { number: String(stats.points).padStart(2, '0'), label: t('xp'), Icon: Sparkles },
        ].map(({ number, label, Icon }) => (
          <div key={label} className={s.metric}>
            <span className={s.metricIcon}>
              <Icon size={22} strokeWidth={1.6} />
            </span>
            <div>
              <strong>{number}</strong>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </div>
      <div className={s.dashboardColumns}>
        <section>
          <div className={s.sectionHeading}>
            <div>
              <h2>{t('modulesTitle')}</h2>
              <p>{t('modulesText')}</p>
            </div>
            <a href="#catalog">
              {t('seeAll')}
              <ArrowUpRight size={16} />
            </a>
          </div>
          <div className={s.moduleGrid}>
            {modules.map((m, index) => {
              const group = challenges.filter((c) => c.module === m.id);
              const completed = group.filter((c) => state.activities[c.id]?.completed).length;
              return (
                <a key={m.id} href={`#catalog?module=${m.id}`} className={s.moduleCard}>
                  <div className={s.moduleCardTop}>
                    <span
                      className={s.moduleIcon}
                      style={{ color: m.color, background: `${m.color}12` }}
                    >
                      <ModuleIcon icon={m.icon} />
                    </span>
                    <span className={s.moduleNumber}>0{index + 1}</span>
                  </div>
                  <h3>{m.title[lang]}</h3>
                  <p>{m.description[lang]}</p>
                  <div className={s.functionTags}>
                    {m.functions.slice(0, 3).map((f) => (
                      <span key={f}>{lang === 'es' ? (functionNames[f] ?? f) : f}</span>
                    ))}
                  </div>
                  <div className={s.moduleCardBottom}>
                    <span>
                      {completed ? `${completed}/4 ${t('solved')}` : `4 ${t('exercises')}`}
                    </span>
                    <ArrowUpRight size={17} />
                  </div>
                  <div className={s.miniProgress}>
                    <span style={{ width: `${completed * 25}%`, background: m.color }} />
                  </div>
                </a>
              );
            })}
          </div>
        </section>
        <aside className={s.rightRail}>
          <section className={s.routeCard}>
            <div className={s.routeHeader}>
              <span>
                <GraduationCap size={21} />
              </span>
              <h2>{t('routeTitle')}</h2>
            </div>
            <p>{t('routeText')}</p>
            <div className={s.routeNumbers}>
              <strong>
                {stats.percent}
                <small>%</small>
              </strong>
              <span>
                {stats.completed} / 27
                <br />
                {t('solved')}
              </span>
            </div>
            <div className={s.progressTrack}>
              <span style={{ width: `${stats.percent}%` }} />
            </div>
            <div className={s.recommended}>
              <span className={s.tinyLabel}>{t('recommended')}</span>
              <div className={s.nextIcon}>
                <ModuleIcon icon={module?.icon ?? 'chart'} size={20} />
                <span>{module?.title[lang] ?? t('case')}</span>
              </div>
              <h3>{allDone ? t('allDone') : next.title[lang]}</h3>
              <div className={s.challengeMeta}>
                <DifficultyTag difficulty={next.difficulty} />
                <span>
                  {next.minutes} {t('minutes')}
                </span>
              </div>
              <a href={`#learn/${next.id}`} className={s.secondary}>
                {stats.completed ? t('continue') : t('beginner')}
                <ArrowRight size={16} />
              </a>
            </div>
          </section>
          <section className={s.casePromo}>
            <span className={s.casePromoIcon}>
              <ChartNoAxesCombined size={23} />
            </span>
            <span className={s.tinyLabel}>FP&A LAB</span>
            <h3>{t('ready')}</h3>
            <p>{t('casePromo')}</p>
            <a href="#cases">
              {t('viewCases')}
              <ArrowUpRight size={16} />
            </a>
            <span className={s.promoPattern} />
          </section>
          <div className={s.privacyHint}>
            <ShieldCheck size={17} />
            <p>{t('local')}</p>
          </div>
        </aside>
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
      <div className={s.mockSheet}>
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
            : (a?.attempts ?? 0) === 0 && !a?.completed)) &&
      haystack.includes(search.trim().toLowerCase())
    );
  });
  return (
    <>
      <div className={s.pageHeading}>
        <span className={s.pageKicker}>{casesOnly ? 'FP&A LAB' : t('catalog')}</span>
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
              className={`${s.challengeCard} ${completed ? s.challengeCompleted : ''} ${casesOnly ? s.caseCard : ''}`}
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
              {casesOnly && <span className={s.tinyLabel}>CASE STUDY 0{i + 1}</span>}
              <span className={s.challengeTopic}>{m?.title[lang] ?? 'FP&A'}</span>
              <h2>{c.title[lang]}</h2>
              <p>{casesOnly ? c.lesson[lang] : c.task[lang]}</p>
              <div className={s.challengeMeta}>
                <DifficultyTag difficulty={c.difficulty} />
                <span>
                  {c.minutes} {t('minutes')}
                </span>
              </div>
              <div className={s.challengeCardBottom}>
                <span>{t('openChallenge')}</span>
                <ArrowRight size={17} />
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
      <div className={s.pageHeading}>
        <span className={s.pageKicker}>{t('progress')}</span>
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
      <div className={s.pageHeading}>
        <span className={s.pageKicker}>FINSHEET LAB</span>
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
