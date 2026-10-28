import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  AudioLines,
  BookOpen,
  Bookmark,
  Check,
  ChevronRight,
  CirclePlay,
  CloudUpload,
  Compass,
  FileText,
  Grid2X2,
  Headphones,
  Heart,
  Home,
  Library,
  LockKeyhole,
  LogOut,
  Menu,
  Music2,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Video,
  Volume2,
  X,
  Radio,
  BookMarked,
  ExternalLink,
  RefreshCw,
  Eye,
  Mic2,
  Cross,
  Zap,
  Users,
  Star,
  Filter,
  AlertCircle,
  Clock3,
} from 'lucide-react';
import { api, auth } from '@appdeploy/client';
import { MemberDock, AdminControlCenter } from './MemberFeatures';

type Item = {
  id: string;
  title: string;
  speaker: string;
  summary: string;
  category: string;
  format: string;
  language: string;
  coverUrl: string;
  mediaUrl: string;
  assetUrl?: string;
  filePath: string;
  fileName: string;
  duration: string;
  published: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};
type Draft = Omit<Item, 'id' | 'assetUrl' | 'createdAt' | 'updatedAt'>;
const CATS = [
  {
    name: 'Faith & Victory',
    icon: Zap,
    className: 'cat-violet',
    tag: 'LIVE BY FAITH',
    subtitle: 'Rise above every challenge',
  },
  {
    name: 'Prayer & Worship',
    icon: Music2,
    className: 'cat-blue',
    tag: 'PRAYER & WORSHIP',
    subtitle: 'A deeper place with God',
  },
  {
    name: 'Holy Spirit',
    icon: Sparkles,
    className: 'cat-cyan',
    tag: 'HOLY SPIRIT',
    subtitle: 'Know His presence',
  },
  {
    name: 'Healing & Restoration',
    icon: Heart,
    className: 'cat-rose',
    tag: 'HEALING',
    subtitle: 'Hope for every season',
  },
  {
    name: 'Christian Living',
    icon: Cross,
    className: 'cat-green',
    tag: 'CHRISTIAN LIVING',
    subtitle: 'Walk in the Word',
  },
  {
    name: 'Prophecy & Revelation',
    icon: Radio,
    className: 'cat-orange',
    tag: 'REVELATION',
    subtitle: 'Understand the times',
  },
  {
    name: 'Soul Winning',
    icon: Users,
    className: 'cat-purple',
    tag: 'SOUL WINNING',
    subtitle: 'Reach the world',
  },
  {
    name: 'Leadership & Purpose',
    icon: Star,
    className: 'cat-teal',
    tag: 'PURPOSE',
    subtitle: 'Lead with wisdom',
  },
  {
    name: 'Bible Study',
    icon: BookOpen,
    className: 'cat-lime',
    tag: 'BIBLE STUDY',
    subtitle: 'Grow in truth',
  },
];
const FORMATS = ['All', 'Audio', 'Video', 'eBook', 'Article'];
const BLANK: Draft = {
  title: '',
  speaker: 'Apostle Anthony Ngugi',
  summary: '',
  category: 'Faith & Victory',
  format: 'Audio',
  language: 'English',
  coverUrl: '',
  mediaUrl: '',
  filePath: '',
  fileName: '',
  duration: '',
  published: false,
  featured: false,
};
function niceError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}
function Brand({ small = false }: { small?: boolean }) {
  return (
    <div className={'brand ' + (small ? 'brand-small' : '')}>
      <div className="brand-mark">
        <span>C</span>
        <i />
      </div>
      <div className="brand-words">
        <strong>
          COGAM<span> DIGITAL</span>
        </strong>
        <small>
          LIBRARY <b>•</b> WORD OF TRUTH
        </small>
      </div>
    </div>
  );
}
function FormatIcon({ format, size = 19 }: { format: string; size?: number }) {
  if (format === 'Video') return <Video size={size} />;
  if (format === 'eBook') return <BookOpen size={size} />;
  if (format === 'Article') return <FileText size={size} />;
  return <Headphones size={size} />;
}
function Cover({ item, className = '' }: { item: Item; className?: string }) {
  const cat = CATS.find(entry => entry.name === item.category);
  return (
    <div
      className={'cover ' + (cat?.className || 'cat-violet') + ' ' + className}
    >
      {item.coverUrl ? (
        <img src={item.coverUrl} alt="" />
      ) : (
        <>
          <div className="cover-halo" />
          <div className="cover-line" />
          <span className="cover-label">COGAM / WORD OF TRUTH</span>
          <div className="cover-title">{item.title}</div>
          <span className="cover-bottom">SPIRITUAL GROWTH COLLECTION</span>
        </>
      )}
      <span className="format-symbol">
        <FormatIcon format={item.format} size={15} />
      </span>
    </div>
  );
}
function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <Brand small />
        <div>Rooted in the Word. Growing in truth.</div>
        <span>© {new Date().getFullYear()} COGAM Word of Truth</span>
      </div>
    </footer>
  );
}
function Player({
  item,
  onClose,
  saved,
  onSave,
}: {
  item: Item;
  onClose: () => void;
  saved: boolean;
  onSave: () => void;
}) {
  const url = item.assetUrl || item.mediaUrl;
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="player-modal"
        onMouseDown={event => event.stopPropagation()}
      >
        <button
          className="icon-button close-modal"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={19} />
        </button>
        <div className="player-cover">
          <Cover item={item} />
        </div>
        <div className="player-body">
          <div className="eyebrow">
            <FormatIcon format={item.format} size={16} />{' '}
            {item.format.toUpperCase()} · {item.category}
          </div>
          <h2>{item.title}</h2>
          <p className="muted">
            By {item.speaker || 'COGAM Word of Truth'} · {item.language}
          </p>
          {item.summary && <p className="player-description">{item.summary}</p>}
          {item.format === 'Audio' && url && (
            <audio className="media-player" controls src={url} />
          )}
          {item.format === 'Video' && url && (
            <video className="media-player video-player" controls src={url} />
          )}
          {item.format === 'Article' && (
            <p className="article-body">
              {item.summary || 'Article details will be added soon.'}
            </p>
          )}
          {item.format === 'eBook' && url && (
            <a
              className="primary-button"
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              <BookOpen size={18} /> Open eBook
            </a>
          )}
          {!url && item.format !== 'Article' && (
            <div className="empty-notice">
              Media file is not available. Please contact the library
              administrator.
            </div>
          )}
          <div className="player-actions">
            <button className="outline-button" onClick={onSave}>
              <Bookmark size={17} fill={saved ? 'currentColor' : 'none'} />{' '}
              {saved ? 'Saved to My Library' : 'Save to My Library'}
            </button>
            {url && (
              <a
                className="outline-button"
                href={url}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={17} /> Open file
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
function MemberSite({ toAdmin }: { toAdmin: () => void }) {
  const [page, setPage] = useState('home');
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All Topics');
  const [format, setFormat] = useState('All');
  const [selected, setSelected] = useState<Item | null>(null);
  const [saved, setSaved] = useState<string[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem('cogam-saved') || '[]'
      ) as string[];
    } catch {
      return [];
    }
  });
  const [mobileMenu, setMobileMenu] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const reload = async () => {
    setBusy(true);
    setErrorText('');
    try {
      const res = await api.get('/api/library');
      setItems(res.data.items || []);
    } catch (err) {
      setErrorText(niceError(err));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void reload();
  }, []);
  const navigate = (next: string) => {
    setPage(next);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const browseCat = (name: string) => {
    setCategory(name);
    setFormat('All');
    navigate('browse');
  };
  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return items.filter(
      item =>
        (page !== 'saved' || saved.includes(item.id)) &&
        (category === 'All Topics' || item.category === category) &&
        (format === 'All' || item.format === format) &&
        (!needle ||
          [item.title, item.speaker, item.summary, item.category]
            .join(' ')
            .toLowerCase()
            .includes(needle))
    );
  }, [items, saved, page, category, format, query]);
  const toggleSave = (id: string) => {
    setSaved(old => {
      const next = old.includes(id)
        ? old.filter(value => value !== id)
        : [...old, id];
      localStorage.setItem('cogam-saved', JSON.stringify(next));
      return next;
    });
  };
  const goSearch = () => {
    navigate('browse');
    setTimeout(() => searchRef.current?.focus(), 80);
  };
  const featured = items.find(item => item.featured) || items[0];
  const homeItems = items.slice(0, 8);
  const tiles = (source: Item[]) => (
    <div className="content-grid">
      {source.map(item => (
        <article className="content-card" key={item.id}>
          <button
            className="card-cover-button"
            onClick={() => setSelected(item)}
            aria-label={'Open ' + item.title}
          >
            <Cover item={item} />
            <span className="play-overlay">
              <CirclePlay size={44} />
            </span>
          </button>
          <div className="content-meta">
            <FormatIcon format={item.format} size={14} /> {item.format}{' '}
            <span>·</span> {item.language}
          </div>
          <button
            className="card-title-button"
            onClick={() => setSelected(item)}
          >
            {item.title}
          </button>
          <div className="card-speaker">{item.speaker}</div>
          <button
            className="card-save"
            aria-label={'Save ' + item.title}
            onClick={() => toggleSave(item.id)}
          >
            <Bookmark
              size={17}
              fill={saved.includes(item.id) ? 'currentColor' : 'none'}
            />
          </button>
        </article>
      ))}
    </div>
  );
  const empty = (isSaved = false) => (
    <div className="empty-library">
      <div className="empty-art">
        <BookMarked size={32} />
      </div>
      <h3>
        {isSaved
          ? 'Your saved library starts here'
          : query || category !== 'All Topics' || format !== 'All'
            ? 'No matching messages found'
            : 'Something wonderful is coming'}
      </h3>
      <p>
        {isSaved
          ? 'Bookmark a message and it will appear here for easy access.'
          : query || category !== 'All Topics' || format !== 'All'
            ? 'Try another topic, format or search term.'
            : 'The COGAM media team is preparing teachings, audio messages, videos and eBooks. Check back for new releases.'}
      </p>
      <button
        className="text-link"
        onClick={() => {
          setQuery('');
          setCategory('All Topics');
          setFormat('All');
          navigate('browse');
        }}
      >
        Explore the library <ArrowRight size={16} />
      </button>
    </div>
  );
  return (
    <div className="site-shell">
      <div className="announcement">
        <Sparkles size={14} /> Welcome to the Word of Truth digital experience{' '}
        <span>✦</span> Learn. Grow. Be transformed.
      </div>
      <MemberDock />
      <header className="site-header">
        <div className="container header-inner">
          <button className="brand-button" onClick={() => navigate('home')}>
            <Brand />
          </button>
          <nav className={'top-nav ' + (mobileMenu ? 'mobile-show' : '')}>
            <button
              className={page === 'home' ? 'active' : ''}
              onClick={() => navigate('home')}
            >
              Home
            </button>
            <button
              className={page === 'browse' ? 'active' : ''}
              onClick={() => navigate('browse')}
            >
              Browse
            </button>
            <button
              className={page === 'categories' ? 'active' : ''}
              onClick={() => navigate('categories')}
            >
              Categories
            </button>
            <button
              className={page === 'saved' ? 'active' : ''}
              onClick={() => navigate('saved')}
            >
              My Library
            </button>
          </nav>
          <div className="header-actions">
            <button
              className="icon-button search-action"
              aria-label="Search library"
              onClick={goSearch}
            >
              <Search size={20} />
            </button>
            <button className="admin-link" onClick={toAdmin}>
              <ShieldCheck size={17} /> Admin Portal
            </button>
            <button
              className="icon-button menu-action"
              aria-label="Toggle menu"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>
      <main>
        {page === 'home' && (
          <>
            <section className="hero">
              <div className="container hero-inner">
                <div className="hero-copy">
                  <div className="hero-pill">
                    <span className="pulse-dot" /> THE WORD OF TRUTH ·
                    EVERYWHERE
                  </div>
                  <h1>
                    Grow in the Word.
                    <br />
                    <em>Live in His Truth.</em>
                  </h1>
                  <p>
                    Your home for faith-building messages, life-changing
                    teachings, worship, and timeless wisdom from COGAM Word of
                    Truth.
                  </p>
                  <div className="hero-ctas">
                    <button
                      className="primary-button"
                      onClick={() => browseCat('All Topics')}
                    >
                      <CirclePlay size={20} /> Explore Messages{' '}
                      <ArrowRight size={17} />
                    </button>
                    <button
                      className="hero-secondary"
                      onClick={() => navigate('categories')}
                    >
                      Discover Topics <ChevronRight size={17} />
                    </button>
                  </div>
                  <div className="hero-foot">
                    <span className="avatars">
                      <i>✦</i>
                      <i>✝</i>
                      <i>W</i>
                    </span>
                    <span>Faith. Knowledge. Spiritual growth.</span>
                  </div>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="hero-orbit orbit-one" />
                  <div className="hero-orbit orbit-two" />
                  <div className="hero-glow" />
                  <div className="hero-visual">
                    <span className="visual-top">
                      COGAM <b>W.O.T</b>
                    </span>
                    <div className="visual-symbol">✝</div>
                    <div className="visual-caption">
                      THE WORD
                      <br />
                      <i>OF TRUTH</i>
                    </div>
                    <div className="visual-bottom">LISTEN · WATCH · GROW</div>
                  </div>
                  <div className="floating-tag">
                    <AudioLines size={17} /> Spirit-filled teachings
                  </div>
                  <div className="hero-spark">✦</div>
                </div>
              </div>
            </section>

            <section className="featured-apostle">
              <div className="container featured-apostle-inner">
                <div className="apostle-copy">
                  <div className="eyebrow">MEET OUR SPIRITUAL LEADER</div>
                  <h2>Apostle Anthony<br />Ngugi Mburu<span className="accent-dot">.</span></h2>
                  <p>Explore biblical teachings and faith-building resources from COGAM Word of Truth. Discover messages for Christian living, prayer, worship and spiritual growth.</p>
                  <button className="primary-button" onClick={() => browseCat('All Topics')}>
                    Explore Teachings <ArrowRight size={17} />
                  </button>
                </div>
                <div className="apostle-placeholder" aria-hidden="true">✝</div>
              </div>
            </section>
            <section className="feature-strip">
              <div className="container strip-grid">
                <span>
                  <Headphones size={20} /> Inspiring Audio
                </span>
                <span>
                  <Video size={20} /> Powerful Video
                </span>
                <span>
                  <BookOpen size={20} /> Digital eBooks
                </span>
                <span>
                  <Heart size={20} /> Grow Your Faith
                </span>
              </div>
            </section>
            <section className="section container">
              <div className="section-heading">
                <div>
                  <div className="eyebrow light-eyebrow">
                    <span className="green-dot" /> EXPLORE THE WORD
                  </div>
                  <h2>
                    Discover by topic<span className="accent-dot">.</span>
                  </h2>
                  <p>Find teachings that speak to every season of life.</p>
                </div>
                <button
                  className="section-link"
                  onClick={() => navigate('categories')}
                >
                  All categories <ArrowRight size={17} />
                </button>
              </div>
              <div className="category-grid home-categories">
                {CATS.slice(0, 6).map((cat, i) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      className={'category-card ' + cat.className}
                      key={cat.name}
                      onClick={() => browseCat(cat.name)}
                    >
                      <span className="category-number">0{i + 1}</span>
                      <Icon
                        className="category-watermark"
                        size={100}
                        strokeWidth={1.1}
                      />
                      <span className="category-icon">
                        <Icon size={23} strokeWidth={1.8} />
                      </span>
                      <span className="category-name">{cat.name}</span>
                      <span className="category-subtitle">{cat.subtitle}</span>
                      <ArrowRight className="category-arrow" size={19} />
                    </button>
                  );
                })}
              </div>
            </section>
            <section className="section container content-section">
              <div className="section-heading">
                <div>
                  <div className="eyebrow light-eyebrow">
                    <span className="green-dot" /> FRESH FROM THE LIBRARY
                  </div>
                  <h2>
                    Latest messages<span className="accent-dot">.</span>
                  </h2>
                  <p>Fresh inspiration for your everyday walk with God.</p>
                </div>
                <button
                  className="section-link"
                  onClick={() => browseCat('All Topics')}
                >
                  Browse all <ArrowRight size={17} />
                </button>
              </div>
              {busy ? (
                <div className="loading-state">
                  <RefreshCw className="spinning" size={24} /> Loading
                  teachings...
                </div>
              ) : errorText ? (
                <div className="error-banner">
                  <AlertCircle size={19} /> {errorText}{' '}
                  <button onClick={() => void reload()}>Retry</button>
                </div>
              ) : homeItems.length ? (
                tiles(homeItems)
              ) : (
                empty()
              )}
            </section>
            <section className="container">
              <div className="mission-banner">
                <div className="mission-orb" />
                <div>
                  <span className="eyebrow">COGAM WORD OF TRUTH</span>
                  <h2>
                    One library.
                    <br />
                    <em>Endless encouragement.</em>
                  </h2>
                  <p>Wherever life takes you, the Word goes with you.</p>
                  <button
                    className="primary-button"
                    onClick={() => browseCat('All Topics')}
                  >
                    Start exploring <ArrowRight size={17} />
                  </button>
                </div>
                <div className="mission-art" aria-hidden="true">
                  <BookOpen size={146} strokeWidth={0.8} />
                  <span>
                    THE WORD
                    <br />
                    IS LIFE.
                  </span>
                </div>
              </div>
            </section>
          </>
        )}
        {page === 'categories' && (
          <section className="container inner-page">
            <div className="breadcrumb">
              Home <ChevronRight size={14} /> Categories
            </div>
            <div className="page-heading">
              <span className="eyebrow light-eyebrow">
                FIND YOUR NEXT MESSAGE
              </span>
              <h1>
                Explore by category<span className="accent-dot">.</span>
              </h1>
              <p>
                From spiritual growth to leadership, explore everything the Word
                has to offer.
              </p>
            </div>
            <div className="category-grid all-categories">
              {CATS.map((cat, i) => {
                const Icon = cat.icon;
                return (
                  <button
                    className={'category-card ' + cat.className}
                    key={cat.name}
                    onClick={() => browseCat(cat.name)}
                  >
                    <span className="category-number">0{i + 1}</span>
                    <Icon
                      className="category-watermark"
                      size={100}
                      strokeWidth={1.1}
                    />
                    <span className="category-icon">
                      <Icon size={23} />
                    </span>
                    <span className="category-name">{cat.name}</span>
                    <span className="category-subtitle">{cat.subtitle}</span>
                    <ArrowRight className="category-arrow" size={19} />
                  </button>
                );
              })}
            </div>
          </section>
        )}
        {(page === 'browse' || page === 'saved') && (
          <section className="container inner-page">
            <div className="breadcrumb">
              Home <ChevronRight size={14} />{' '}
              {page === 'saved' ? 'My Library' : 'Browse'}
            </div>
            <div className="page-heading">
              <span className="eyebrow light-eyebrow">
                {page === 'saved'
                  ? 'YOUR COLLECTION'
                  : 'EXPLORE THE COLLECTION'}
              </span>
              <h1>
                {page === 'saved' ? 'My Library' : 'Browse messages'}
                <span className="accent-dot">.</span>
              </h1>
              <p>
                {page === 'saved'
                  ? 'A personal place for messages you love.'
                  : 'Listen, learn, watch and grow at your own pace.'}
              </p>
            </div>
            <div className="filter-bar">
              <div className="search-box">
                <Search size={18} />
                <input
                  ref={searchRef}
                  placeholder="Search messages, speakers or topics..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>
              <div className="select-wrap">
                <Filter size={16} />
                <select
                  aria-label="Select topic"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  <option>All Topics</option>
                  {CATS.map(cat => (
                    <option key={cat.name}>{cat.name}</option>
                  ))}
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div className="format-tabs">
              {FORMATS.map(entry => (
                <button
                  key={entry}
                  className={format === entry ? 'selected' : ''}
                  onClick={() => setFormat(entry)}
                >
                  {entry === 'All' && <Grid2X2 size={15} />}
                  {entry}
                </button>
              ))}
            </div>
            <div className="results-title">
              <strong>
                {page === 'saved' ? 'Saved messages' : 'All messages'}
              </strong>
              <span>{filtered.length} results</span>
            </div>
            {busy ? (
              <div className="loading-state">
                <RefreshCw className="spinning" size={24} /> Loading library...
              </div>
            ) : errorText ? (
              <div className="error-banner">
                <AlertCircle size={18} /> {errorText}
                <button onClick={() => void reload()}>Retry</button>
              </div>
            ) : filtered.length ? (
              tiles(filtered)
            ) : (
              empty(page === 'saved')
            )}
          </section>
        )}
      </main>
      <Footer />
      <div className="mobile-bottom-nav">
        <button
          className={page === 'home' ? 'current' : ''}
          onClick={() => navigate('home')}
        >
          <Home size={20} />
          Home
        </button>
        <button
          className={page === 'browse' ? 'current' : ''}
          onClick={() => browseCat('All Topics')}
        >
          <Compass size={20} />
          Browse
        </button>
        <button
          className={page === 'categories' ? 'current' : ''}
          onClick={() => navigate('categories')}
        >
          <Grid2X2 size={20} />
          Topics
        </button>
        <button
          className={page === 'saved' ? 'current' : ''}
          onClick={() => navigate('saved')}
        >
          <Bookmark size={20} />
          Saved
        </button>
      </div>
      {selected && (
        <Player
          item={selected}
          onClose={() => setSelected(null)}
          saved={saved.includes(selected.id)}
          onSave={() => toggleSave(selected.id)}
        />
      )}
    </div>
  );
}
function AdminSite({ toLibrary }: { toLibrary: () => void }) {
  const [status, setStatus] = useState<
    'checking' | 'guest' | 'denied' | 'authorized'
  >('checking');
  const [who, setWho] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [message, setMessage] = useState('');
  const [errorText, setErrorText] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'dashboard' | 'content' | 'editor'>(
    'dashboard'
  );
  const [draft, setDraft] = useState<Draft>({ ...BLANK });
  const [editId, setEditId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const loadAdmin = async () => {
    const me = await api.get('/api/admin/me');
    setWho(me.data.email || '');
    const response = await api.get('/api/admin/items');
    setItems(response.data.items || []);
    setStatus('authorized');
  };
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const signed = await auth.getUser();
        if (!active) return;
        if (!signed) {
          setStatus('guest');
          return;
        }
        await loadAdmin();
      } catch {
        if (active) setStatus('denied');
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  const signIn = async () => {
    setLoading(true);
    setErrorText('');
    try {
      await auth.signIn();
      await loadAdmin();
    } catch (err) {
      setErrorText(niceError(err));
      setStatus('denied');
    } finally {
      setLoading(false);
    }
  };
  const logout = async () => {
    await auth.signOut();
    setStatus('guest');
    setWho('');
    setItems([]);
  };
  const refresh = async () => {
    try {
      const res = await api.get('/api/admin/items');
      setItems(res.data.items || []);
    } catch (err) {
      setErrorText(niceError(err));
    }
  };
  const startNew = () => {
    setDraft({ ...BLANK });
    setEditId(null);
    setFile(null);
    setErrorText('');
    setView('editor');
  };
  const edit = (item: Item) => {
    setDraft({
      title: item.title,
      speaker: item.speaker,
      summary: item.summary,
      category: item.category,
      format: item.format,
      language: item.language,
      coverUrl: item.coverUrl || '',
      mediaUrl: item.mediaUrl || '',
      filePath: item.filePath || '',
      fileName: item.fileName || '',
      duration: item.duration || '',
      published: item.published,
      featured: item.featured,
    });
    setEditId(item.id);
    setFile(null);
    setErrorText('');
    setView('editor');
  };
  const readFile = (input: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(String(reader.result || '').split(',')[1] || '');
      reader.onerror = () => reject(new Error('Unable to read file.'));
      reader.readAsDataURL(input);
    });
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorText('');
    setMessage('');
    if (!draft.title.trim()) {
      setErrorText('Please enter a title.');
      return;
    }
    if (file && file.size > 3500000) {
      setErrorText(
        'Files must be smaller than 3.5 MB. For larger audio, video and eBooks, enter a hosted HTTPS link.'
      );
      return;
    }
    if (
      draft.format !== 'Article' &&
      !file &&
      !draft.filePath &&
      !draft.mediaUrl
    ) {
      setErrorText('Attach a file or provide an HTTPS media URL.');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...draft };
      if (file) {
        const encoded = await readFile(file);
        const upload = await api.post('/api/admin/upload', {
          fileName: file.name,
          contentType: file.type,
          base64: encoded,
        });
        payload.filePath = upload.data.filePath;
        payload.fileName = upload.data.fileName;
        payload.mediaUrl = '';
      }
      if (editId) await api.put('/api/admin/items/' + editId, payload);
      else await api.post('/api/admin/items', payload);
      await refresh();
      setMessage(
        editId
          ? 'Message updated successfully.'
          : 'New content created successfully.'
      );
      setView('content');
      setFile(null);
    } catch (err) {
      setErrorText(niceError(err));
    } finally {
      setLoading(false);
    }
  };
  const remove = async (item: Item) => {
    if (
      !window.confirm(
        'Permanently delete "' + item.title + '" from the library?'
      )
    )
      return;
    setErrorText('');
    setMessage('');
    setLoading(true);
    try {
      await api.delete('/api/admin/items/' + item.id);
      await refresh();
      setMessage('Content deleted successfully.');
    } catch (err) {
      setErrorText(niceError(err));
    } finally {
      setLoading(false);
    }
  };
  const change = (key: keyof Draft, value: string | boolean) => {
    setDraft(old => ({ ...old, [key]: value }));
  };
  const published = items.filter(item => item.published);
  const drafts = items.filter(item => !item.published);
  if (status !== 'authorized')
    return (
      <div className="admin-auth-page">
        <div className="admin-auth-top">
          <button onClick={toLibrary}>
            <ArrowLeft size={18} /> Back to library
          </button>
          <Brand small />
        </div>
        <div className="admin-auth-box">
          <div className="auth-shield">
            <LockKeyhole size={29} />
          </div>
          <div className="eyebrow light-eyebrow">RESTRICTED ACCESS</div>
          <h1>Admin Portal</h1>
          <p>
            Only authorized COGAM Digital Library administrators can upload,
            manage and publish content.
          </p>
          {status === 'checking' ? (
            <div className="auth-loading">
              <RefreshCw className="spinning" size={19} /> Checking account...
            </div>
          ) : (
            <>
              {status === 'denied' && (
                <div className="auth-error">
                  <AlertCircle size={18} /> This account is not authorized, or
                  sign-in did not complete. Use your approved administrator
                  email.
                </div>
              )}
              {errorText && <div className="auth-error">{errorText}</div>}
              <button
                className="primary-button full-width"
                onClick={() => void signIn()}
                disabled={loading}
              >
                <ShieldCheck size={18} />{' '}
                {loading ? 'Signing in...' : 'Sign in as administrator'}{' '}
                <ArrowRight size={17} />
              </button>
              {status === 'denied' && (
                <button className="muted-button" onClick={() => void logout()}>
                  Sign out and use another account
                </button>
              )}
              <small>
                Protected by secure sign-in and server-side administrator
                verification.
              </small>
            </>
          )}
        </div>
      </div>
    );
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <button className="brand-button" onClick={toLibrary}>
          <Brand small />
        </button>
        <div className="admin-side-title">WORKSPACE</div>
        <button
          className={view === 'dashboard' ? 'active' : ''}
          onClick={() => setView('dashboard')}
        >
          <Grid2X2 size={18} /> Overview
        </button>
        <button
          className={view === 'content' ? 'active' : ''}
          onClick={() => setView('content')}
        >
          <Library size={18} /> Content Library
        </button>
        <button
          className={view === 'editor' ? 'active' : ''}
          onClick={startNew}
        >
          <CloudUpload size={18} /> Upload Content
        </button>
        <div className="admin-side-footer">
          <button onClick={toLibrary}>
            <Eye size={18} /> View Library
          </button>
          <button onClick={() => void logout()}>
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <div className="admin-topbar">
          <div className="mobile-admin-brand">
            <Brand small />
          </div>
          <span>
            <span className="online-dot" /> Admin workspace
          </span>
          <div className="admin-avatar">A</div>
        </div>
        <div className="admin-content">
          <div className="admin-welcome">
            <div>
              <div className="eyebrow light-eyebrow">
                COGAM CONTENT MANAGEMENT
              </div>
              <h1>
                {view === 'dashboard'
                  ? 'Dashboard overview'
                  : view === 'content'
                    ? 'Manage library'
                    : editId
                      ? 'Edit content'
                      : 'Upload new content'}
              </h1>
              <p>
                {view === 'dashboard'
                  ? 'Welcome to your content workspace.'
                  : view === 'content'
                    ? 'Organize your teachings, recordings and digital resources.'
                    : 'Add content and choose when it becomes available to members.'}
              </p>
            </div>
            <div className="admin-action-group">
              <button className="outline-button" onClick={toLibrary}>
                <Eye size={16} /> Preview site
              </button>
              {view !== 'editor' && (
                <button className="primary-button" onClick={startNew}>
                  <Plus size={18} /> Add content
                </button>
              )}
            </div>
          </div>
          {message && (
            <div className="success-banner">
              <Check size={18} /> {message}{' '}
              <button onClick={() => setMessage('')}>
                <X size={15} />
              </button>
            </div>
          )}
          {errorText && (
            <div className="error-banner">
              <AlertCircle size={18} /> {errorText}{' '}
              <button onClick={() => setErrorText('')}>
                <X size={15} />
              </button>
            </div>
          )}
          <AdminControlCenter />
          {view === 'dashboard' && (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon blue">
                    <Library size={23} />
                  </div>
                  <span>Total content</span>
                  <strong>{items.length}</strong>
                  <small>All uploaded media</small>
                </div>
                <div className="stat-card">
                  <div className="stat-icon green">
                    <Eye size={23} />
                  </div>
                  <span>Published</span>
                  <strong>{published.length}</strong>
                  <small>Visible to all visitors</small>
                </div>
                <div className="stat-card">
                  <div className="stat-icon amber">
                    <FileText size={23} />
                  </div>
                  <span>Drafts</span>
                  <strong>{drafts.length}</strong>
                  <small>Not yet public</small>
                </div>
                <div className="stat-card">
                  <div className="stat-icon purple">
                    <Headphones size={23} />
                  </div>
                  <span>Audio & video</span>
                  <strong>
                    {
                      items.filter(item =>
                        ['Audio', 'Video'].includes(item.format)
                      ).length
                    }
                  </strong>
                  <small>Listen and watch</small>
                </div>
              </div>
              <div className="admin-panel">
                <div className="panel-header">
                  <div>
                    <h3>Recent content</h3>
                    <p>Manage your most recently added resources.</p>
                  </div>
                  <button
                    className="text-link"
                    onClick={() => setView('content')}
                  >
                    View all <ArrowRight size={16} />
                  </button>
                </div>
                {items.length ? (
                  <div className="table-wrap">
                    <table className="media-table">
                      <thead>
                        <tr>
                          <th>CONTENT</th>
                          <th>TYPE</th>
                          <th>STATUS</th>
                          <th>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.slice(0, 5).map(item => (
                          <tr key={item.id}>
                            <td>
                              <strong>{item.title}</strong>
                              <small>{item.speaker}</small>
                            </td>
                            <td>{item.format}</td>
                            <td>
                              <span
                                className={
                                  'status-pill ' +
                                  (item.published ? 'live' : 'draft')
                                }
                              >
                                {item.published ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td>
                              <button
                                className="table-action"
                                onClick={() => edit(item)}
                              >
                                <Pencil size={16} /> Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="admin-empty">
                    <CloudUpload size={30} />
                    <h3>Your library is ready</h3>
                    <p>Upload your first teaching to get started.</p>
                    <button className="primary-button" onClick={startNew}>
                      <Plus size={17} /> Add first message
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          {view === 'content' && (
            <div className="admin-panel">
              <div className="panel-header">
                <div>
                  <h3>All uploaded content</h3>
                  <p>{items.length} resources across your library</p>
                </div>
                <button
                  className="outline-button"
                  onClick={() => void refresh()}
                >
                  <RefreshCw size={16} /> Refresh
                </button>
              </div>
              {items.length ? (
                <div className="table-wrap">
                  <table className="media-table">
                    <thead>
                      <tr>
                        <th>TITLE / SPEAKER</th>
                        <th>CATEGORY</th>
                        <th>TYPE</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.title}</strong>
                            <small>{item.speaker}</small>
                          </td>
                          <td>{item.category}</td>
                          <td>{item.format}</td>
                          <td>
                            <span
                              className={
                                'status-pill ' +
                                (item.published ? 'live' : 'draft')
                              }
                            >
                              {item.published ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td>
                            <div className="table-buttons">
                              <button
                                className="table-action"
                                onClick={() => edit(item)}
                              >
                                <Pencil size={15} /> Edit
                              </button>
                              <button
                                className="table-action danger"
                                disabled={loading}
                                onClick={() => void remove(item)}
                              >
                                <Trash2 size={15} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="admin-empty">
                  <Library size={30} />
                  <h3>No content yet</h3>
                  <p>New messages will appear here.</p>
                  <button className="primary-button" onClick={startNew}>
                    Upload content <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
          {view === 'editor' && (
            <form onSubmit={event => void save(event)} className="editor-form">
              <div className="admin-panel">
                <div className="panel-header">
                  <div>
                    <h3>Content information</h3>
                    <p>
                      Everything your audience should know about this teaching.
                    </p>
                  </div>
                </div>
                <div className="form-grid">
                  <label className="field full">
                    <span>
                      Message title <b>*</b>
                    </span>
                    <input
                      value={draft.title}
                      maxLength={160}
                      placeholder="e.g. The Power of Faith"
                      onChange={e => change('title', e.target.value)}
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Speaker / Author</span>
                    <input
                      value={draft.speaker}
                      onChange={e => change('speaker', e.target.value)}
                      placeholder="Apostle Anthony Ngugi"
                    />
                  </label>
                  <label className="field">
                    <span>Category</span>
                    <select
                      value={draft.category}
                      onChange={e => change('category', e.target.value)}
                    >
                      {CATS.map(cat => (
                        <option key={cat.name}>{cat.name}</option>
                      ))}
                      <option>Other</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Content type</span>
                    <select
                      value={draft.format}
                      onChange={e => change('format', e.target.value)}
                    >
                      {FORMATS.slice(1).map(name => (
                        <option key={name}>{name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Language</span>
                    <select
                      value={draft.language}
                      onChange={e => change('language', e.target.value)}
                    >
                      <option>English</option>
                      <option>Kiswahili</option>
                      <option>Other</option>
                    </select>
                  </label>
                  <label className="field full">
                    <span>Description / Message notes</span>
                    <textarea
                      rows={4}
                      value={draft.summary}
                      placeholder="What will listeners learn from this message?"
                      onChange={e => change('summary', e.target.value)}
                    />
                  </label>
                </div>
              </div>
              <div className="admin-panel">
                <div className="panel-header">
                  <div>
                    <h3>Media & artwork</h3>
                    <p>Upload a small file or link to your hosted content.</p>
                  </div>
                </div>
                <div
                  className="upload-zone"
                  onClick={() => fileRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter') fileRef.current?.click();
                  }}
                >
                  <CloudUpload size={30} />
                  <strong>
                    {file
                      ? file.name
                      : draft.fileName || 'Choose a file to upload'}
                  </strong>
                  <span>
                    {file
                      ? (file.size / 1024 / 1024).toFixed(2) + ' MB'
                      : 'MP3, M4A, WAV, MP4, WEBM, PDF or EPUB · up to 3.5 MB'}
                  </span>
                  <span className="upload-cta">Browse files</span>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".mp3,.m4a,.wav,.aac,.mp4,.webm,.pdf,.epub"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    hidden
                  />
                </div>
                <div className="form-grid form-gap">
                  <label className="field full">
                    <span>
                      Hosted media URL{' '}
                      <small>
                        (recommended for large videos, sermons and eBooks)
                      </small>
                    </span>
                    <input
                      value={draft.mediaUrl}
                      placeholder="https://your-storage.example/message.mp3"
                      onChange={e => change('mediaUrl', e.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>
                      Cover image URL <small>(optional)</small>
                    </span>
                    <input
                      value={draft.coverUrl}
                      placeholder="https://example.com/cover.jpg"
                      onChange={e => change('coverUrl', e.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>
                      Duration <small>(optional)</small>
                    </span>
                    <input
                      value={draft.duration}
                      placeholder="e.g. 42 min"
                      onChange={e => change('duration', e.target.value)}
                    />
                  </label>
                </div>
                <p className="help-text">
                  For larger files, upload to a secure media host and paste its
                  direct HTTPS link. Article content can be written in the
                  description field.
                </p>
              </div>
              <div className="admin-panel">
                <div className="panel-header">
                  <div>
                    <h3>Publication settings</h3>
                    <p>Control the visibility of this message.</p>
                  </div>
                </div>
                <label className="switch-row">
                  <div>
                    <strong>Publish now</strong>
                    <span>
                      Make this content visible in the public COGAM library.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={draft.published}
                    onChange={e => change('published', e.target.checked)}
                  />
                </label>
                <label className="switch-row">
                  <div>
                    <strong>Feature this message</strong>
                    <span>Highlight this teaching as a featured message.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={draft.featured}
                    onChange={e => change('featured', e.target.checked)}
                  />
                </label>
              </div>
              <div className="form-footer">
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setView('content')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
                >
                  {loading
                    ? 'Saving...'
                    : editId
                      ? 'Save changes'
                      : 'Save content'}{' '}
                  <ArrowRight size={17} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <nav className="admin-mobile-nav">
        <button onClick={() => setView('dashboard')}>
          <Grid2X2 size={19} />
          Dashboard
        </button>
        <button onClick={() => setView('content')}>
          <Library size={19} />
          Contents
        </button>
        <button onClick={startNew}>
          <Plus size={19} />
          Upload
        </button>
        <button onClick={toLibrary}>
          <ArrowLeft size={19} />
          Library
        </button>
      </nav>
    </div>
  );
}
export default function App() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const changed = () => setHash(window.location.hash);
    window.addEventListener('hashchange', changed);
    return () => window.removeEventListener('hashchange', changed);
  }, []);
  const toAdmin = () => {
    window.location.hash = '#/admin';
  };
  const toLibrary = () => {
    window.location.hash = '#/';
  };
  return hash.startsWith('#/admin') ? (
    <AdminSite toLibrary={toLibrary} />
  ) : (
    <MemberSite toAdmin={toAdmin} />
  );
}
