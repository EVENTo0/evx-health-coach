import React, { useState, useEffect, useCallback } from 'react';
import { supabase, type Article, type Category } from './supabase';

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  app: { display: 'flex', height: '100vh', background: '#0A0A0F', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' } as React.CSSProperties,
  sidebar: { width: 220, background: '#12121A', borderRight: '1px solid #2A2A3A', display: 'flex', flexDirection: 'column' as const, padding: '24px 0' },
  logo: { fontSize: 22, fontWeight: 800, color: '#00D4FF', padding: '0 24px 24px', borderBottom: '1px solid #2A2A3A', letterSpacing: -0.5 },
  nav: { padding: '16px 0', flex: 1 },
  navItem: (active: boolean) => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', cursor: 'pointer',
    background: active ? '#00D4FF15' : 'transparent', borderLeft: active ? '3px solid #00D4FF' : '3px solid transparent',
    color: active ? '#00D4FF' : '#A0A0B8', fontSize: 14, fontWeight: active ? 700 : 500, transition: 'all 0.15s',
  } as React.CSSProperties),
  main: { flex: 1, overflow: 'auto', padding: 32 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  h1: { fontSize: 26, fontWeight: 800, letterSpacing: -0.5 },
  btn: (variant: 'primary' | 'ghost' | 'danger' = 'primary') => ({
    padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
    background: variant === 'primary' ? '#00D4FF' : variant === 'danger' ? '#FF444420' : '#1A1A26',
    color: variant === 'primary' ? '#000' : variant === 'danger' ? '#FF4444' : '#fff',
    transition: 'opacity 0.15s',
  } as React.CSSProperties),
  card: { background: '#12121A', borderRadius: 14, border: '1px solid #2A2A3A', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, padding: '14px 16px', fontSize: 11, fontWeight: 700, color: '#606080', textTransform: 'uppercase' as const, letterSpacing: 0.5, borderBottom: '1px solid #2A2A3A' },
  td: { padding: '14px 16px', fontSize: 14, borderBottom: '1px solid #1A1A26', verticalAlign: 'middle' as const },
  badge: (color: string) => ({ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: color + '22', color }) as React.CSSProperties,
  modal: { position: 'fixed' as const, inset: 0, background: '#00000090', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalBox: { background: '#12121A', borderRadius: 16, border: '1px solid #2A2A3A', padding: 32, width: 600, maxHeight: '90vh', overflow: 'auto' },
  input: { width: '100%', background: '#0A0A0F', border: '1px solid #2A2A3A', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', marginBottom: 14, boxSizing: 'border-box' as const },
  label: { fontSize: 12, fontWeight: 700, color: '#606080', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6, display: 'block' },
  statCard: { background: '#12121A', borderRadius: 14, border: '1px solid #2A2A3A', padding: '20px 24px' },
  statNum: { fontSize: 32, fontWeight: 800, color: '#00D4FF', letterSpacing: -1 },
  statLabel: { fontSize: 13, color: '#606080', marginTop: 4 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 },
};

const CAT_COLORS: Record<string, string> = {
  nutrition: '#00E096', training: '#FF6B35', recovery: '#7B61FF',
  mindset: '#FFB800', labs: '#00D4FF', general: '#A0A0B8',
};

const CATEGORIES: Category[] = ['nutrition', 'training', 'recovery', 'mindset', 'labs', 'general'];

// ─── Article Editor Modal ─────────────────────────────────────────────────────
function ArticleModal({ article, onSave, onClose }: {
  article: Partial<Article> | null;
  onSave: (data: Partial<Article>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<Article>>(article ?? {
    title: '', summary: '', body: '', category: 'nutrition',
    emoji: '📄', read_time_minutes: 3, tags: [], author: 'EVX Team',
    featured: false, is_published: true,
  });

  const set = (k: keyof Article, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={S.modal} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modalBox}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>{article?.id ? 'Edit Article' : 'New Article'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#606080', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 12 }}>
          <div>
            <label style={S.label}>Title</label>
            <input style={S.input} value={form.title ?? ''} onChange={e => set('title', e.target.value)} placeholder="Article title..." />
          </div>
          <div>
            <label style={S.label}>Emoji</label>
            <input style={S.input} value={form.emoji ?? '📄'} onChange={e => set('emoji', e.target.value)} />
          </div>
        </div>

        <label style={S.label}>Summary</label>
        <input style={S.input} value={form.summary ?? ''} onChange={e => set('summary', e.target.value)} placeholder="One-line hook..." />

        <label style={S.label}>Body</label>
        <textarea style={{ ...S.input, height: 160, resize: 'vertical' }} value={form.body ?? ''}
          onChange={e => set('body', e.target.value)} placeholder="Full article content..." />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: 12 }}>
          <div>
            <label style={S.label}>Category</label>
            <select style={S.input} value={form.category} onChange={e => set('category', e.target.value as Category)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Author</label>
            <input style={S.input} value={form.author ?? 'EVX Team'} onChange={e => set('author', e.target.value)} />
          </div>
          <div>
            <label style={S.label}>Read (min)</label>
            <input style={S.input} type="number" value={form.read_time_minutes ?? 3}
              onChange={e => set('read_time_minutes', parseInt(e.target.value))} />
          </div>
        </div>

        <label style={S.label}>Tags (comma separated)</label>
        <input style={S.input}
          value={(form.tags ?? []).join(', ')}
          onChange={e => set('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
          placeholder="protein, muscle, fat loss" />

        <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
            <input type="checkbox" checked={form.featured ?? false} onChange={e => set('featured', e.target.checked)} />
            ⭐ Featured
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
            <input type="checkbox" checked={form.is_published ?? true} onChange={e => set('is_published', e.target.checked)} />
            ✅ Published
          </label>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button style={S.btn('ghost')} onClick={onClose}>Cancel</button>
          <button style={S.btn('primary')} onClick={() => onSave(form)}>Save Article</button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
function StatsDashboard() {
  const [stats, setStats] = useState({ users: 0, workouts: 0, meals: 0, articles: 0 });

  useEffect(() => {
    const load = async () => {
      const [u, w, m, a] = await Promise.allSettled([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('workouts').select('id', { count: 'exact', head: true }),
        supabase.from('meal_plans').select('id', { count: 'exact', head: true }),
        supabase.from('articles').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        users:    u.status === 'fulfilled' ? u.value.count ?? 0 : 0,
        workouts: w.status === 'fulfilled' ? w.value.count ?? 0 : 0,
        meals:    m.status === 'fulfilled' ? m.value.count ?? 0 : 0,
        articles: a.status === 'fulfilled' ? a.value.count ?? 0 : 0,
      });
    };
    load();
  }, []);

  const cards = [
    { label: 'Total Users',      value: stats.users,    emoji: '👤' },
    { label: 'Workouts Generated', value: stats.workouts, emoji: '💪' },
    { label: 'Meal Plans',        value: stats.meals,    emoji: '🥗' },
    { label: 'Articles',          value: stats.articles, emoji: '📚' },
  ];

  return (
    <div>
      <div style={{ ...S.header }}>
        <h1 style={S.h1}>Overview 📊</h1>
      </div>
      <div style={S.statsGrid}>
        {cards.map(c => (
          <div key={c.label} style={S.statCard}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{c.emoji}</div>
            <div style={S.statNum}>{c.value.toLocaleString()}</div>
            <div style={S.statLabel}>{c.label}</div>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #2A2A3A' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Platform Status</h3>
        </div>
        {[
          { label: 'Supabase Database',     status: 'Operational', color: '#00E096' },
          { label: 'AI Workflow Edge Fn',   status: 'Live',        color: '#00E096' },
          { label: 'OpenAI Integration',    status: 'Connected',   color: '#00E096' },
          { label: 'Push Notifications',    status: 'Ready',       color: '#FFB800' },
          { label: 'HealthKit / Google Fit',status: 'Ready',       color: '#FFB800' },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #1A1A26' }}>
            <span style={{ fontSize: 14 }}>{row.label}</span>
            <span style={S.badge(row.color)}>{row.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Articles Manager ─────────────────────────────────────────────────────────
function ArticlesManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Article> | null | false>(false);
  const [filter, setFilter] = useState<string>('all');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
    setArticles((data as Article[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form: Partial<Article>) => {
    if (form.id) {
      await supabase.from('articles').update(form).eq('id', form.id);
    } else {
      await supabase.from('articles').insert(form);
    }
    setEditing(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    await supabase.from('articles').delete().eq('id', id);
    load();
  };

  const handleTogglePublish = async (article: Article) => {
    await supabase.from('articles').update({ is_published: !article.is_published }).eq('id', article.id);
    load();
  };

  const visible = filter === 'all' ? articles : articles.filter(a => a.category === filter);

  return (
    <div>
      <div style={S.header}>
        <h1 style={S.h1}>Articles 📚</h1>
        <button style={S.btn('primary')} onClick={() => setEditing({})}>+ New Article</button>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            style={{ ...S.btn(filter === cat ? 'primary' : 'ghost'), padding: '6px 14px', fontSize: 12, textTransform: 'capitalize' }}>
            {cat}
          </button>
        ))}
      </div>

      <div style={S.card}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#606080' }}>Loading...</div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Article</th>
                <th style={S.th}>Category</th>
                <th style={S.th}>Author</th>
                <th style={S.th}>Read</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(a => (
                <tr key={a.id}>
                  <td style={S.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{a.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{a.title} {a.featured && '⭐'}</div>
                        <div style={{ fontSize: 12, color: '#606080', marginTop: 2 }}>{a.summary.slice(0, 55)}…</div>
                      </div>
                    </div>
                  </td>
                  <td style={S.td}><span style={S.badge(CAT_COLORS[a.category] ?? '#888')}>{a.category}</span></td>
                  <td style={{ ...S.td, color: '#A0A0B8' }}>{a.author}</td>
                  <td style={{ ...S.td, color: '#A0A0B8' }}>{a.read_time_minutes}m</td>
                  <td style={S.td}>
                    <span style={S.badge(a.is_published ? '#00E096' : '#606080')}>
                      {a.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={S.btn('ghost')} onClick={() => setEditing(a)}>Edit</button>
                      <button style={S.btn('ghost')} onClick={() => handleTogglePublish(a)}>
                        {a.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button style={S.btn('danger')} onClick={() => handleDelete(a.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', color: '#606080', padding: 32 }}>No articles found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {editing !== false && (
        <ArticleModal
          article={editing}
          onSave={handleSave}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
type View = 'dashboard' | 'articles' | 'users';

const NAV = [
  { key: 'dashboard' as View, emoji: '📊', label: 'Overview' },
  { key: 'articles'  as View, emoji: '📚', label: 'Articles' },
  { key: 'users'     as View, emoji: '👥', label: 'Users' },
];

export function App() {
  const [view, setView] = useState<View>('dashboard');
  const [supaUrl] = useState(import.meta.env.VITE_SUPABASE_URL ?? '');

  if (!supaUrl) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 40 }}>⚙️</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Add .env file to admin/</div>
        <div style={{ fontSize: 13, color: '#606080', fontFamily: 'monospace' }}>VITE_SUPABASE_URL=...<br/>VITE_SUPABASE_SERVICE_KEY=...</div>
      </div>
    );
  }

  return (
    <div style={S.app}>
      <div style={S.sidebar}>
        <div style={S.logo}>⚡ EVX Admin</div>
        <nav style={S.nav}>
          {NAV.map(item => (
            <div key={item.key} style={S.navItem(view === item.key)} onClick={() => setView(item.key)}>
              <span>{item.emoji}</span><span>{item.label}</span>
            </div>
          ))}
        </nav>
        <div style={{ padding: '16px 24px', borderTop: '1px solid #2A2A3A', fontSize: 11, color: '#404058' }}>
          EVX Admin v1.0
        </div>
      </div>

      <main style={S.main}>
        {view === 'dashboard' && <StatsDashboard />}
        {view === 'articles'  && <ArticlesManager />}
        {view === 'users'     && (
          <div>
            <h1 style={S.h1}>Users 👥</h1>
            <p style={{ color: '#606080', marginTop: 16 }}>User management coming in Phase 4b.</p>
          </div>
        )}
      </main>
    </div>
  );
}
