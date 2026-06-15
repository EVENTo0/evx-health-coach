import React, { useState, useEffect, useCallback } from 'react';
import { supabase, type Article, type Category } from './supabase';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#0A0A0F', card: '#12121A', border: '#2A2A3A',
  text: '#FFFFFF', muted: '#A0A0B8', dim: '#606080',
  primary: '#00D4FF', green: '#00E096', orange: '#FF6B35',
  purple: '#7B61FF', yellow: '#FFB800', red: '#FF4444',
};

const CAT_COLORS: Record<string, string> = {
  nutrition: C.green, training: C.orange, recovery: C.purple,
  mindset: C.yellow, labs: C.primary, general: C.muted,
};

const CATEGORIES: Category[] = ['nutrition','training','recovery','mindset','labs','general'];

// ─── Shared Styles ────────────────────────────────────────────────────────────
const btn = (v: 'primary'|'ghost'|'danger'|'success' = 'primary'): React.CSSProperties => ({
  padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
  fontSize: 13, fontWeight: 700, transition: 'opacity 0.15s',
  background: v==='primary' ? C.primary : v==='danger' ? C.red+'22' : v==='success' ? C.green+'22' : '#1E1E2E',
  color: v==='primary' ? '#000' : v==='danger' ? C.red : v==='success' ? C.green : C.text,
});
const badge = (color: string): React.CSSProperties => ({
  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
  background: color+'22', color, display:'inline-block',
});
const input: React.CSSProperties = {
  width: '100%', background: '#0A0A0F', border: `1px solid ${C.border}`,
  borderRadius: 8, padding: '10px 14px', color: C.text, fontSize: 14,
  outline: 'none', marginBottom: 14, boxSizing: 'border-box',
};
const label: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase',
  letterSpacing: 0.5, marginBottom: 6, display: 'block',
};
const card: React.CSSProperties = {
  background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden',
};
const th: React.CSSProperties = {
  textAlign: 'left', padding: '13px 16px', fontSize: 11, fontWeight: 700,
  color: C.dim, textTransform: 'uppercase', letterSpacing: 0.5,
  borderBottom: `1px solid ${C.border}`,
};
const td: React.CSSProperties = {
  padding: '13px 16px', fontSize: 14, borderBottom: `1px solid #1A1A26`, verticalAlign: 'middle',
};

// ─── Article Modal ────────────────────────────────────────────────────────────
function ArticleModal({ article, onSave, onClose }: {
  article: Partial<Article>|null;
  onSave: (d: Partial<Article>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<Article>>(article ?? {
    title:'', summary:'', body:'', category:'nutrition',
    emoji:'📄', read_time_minutes:3, tags:[], author:'EVX Team',
    featured:false, is_published:true,
  });
  const set = (k: keyof Article, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ position:'fixed', inset:0, background:'#00000090', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, padding:32, width:640, maxHeight:'92vh', overflow:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:24 }}>
          <h2 style={{ fontSize:20, fontWeight:800 }}>{article?.id ? '✏️ Edit Article' : '✨ New Article'}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.dim, fontSize:22, cursor:'pointer' }}>✕</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 80px', gap:12 }}>
          <div><label style={label}>Title</label><input style={input} value={form.title??''} onChange={e=>set('title',e.target.value)} placeholder="Article title..." /></div>
          <div><label style={label}>Emoji</label><input style={input} value={form.emoji??'📄'} onChange={e=>set('emoji',e.target.value)} /></div>
        </div>

        <label style={label}>Summary</label>
        <input style={input} value={form.summary??''} onChange={e=>set('summary',e.target.value)} placeholder="One-line hook..." />

        <label style={label}>Body</label>
        <textarea style={{ ...input, height:180, resize:'vertical' }} value={form.body??''}
          onChange={e=>set('body',e.target.value)} placeholder="Full article content..." />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 100px', gap:12 }}>
          <div>
            <label style={label}>Category</label>
            <select style={input} value={form.category} onChange={e=>set('category',e.target.value as Category)}>
              {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><label style={label}>Author</label><input style={input} value={form.author??'EVX Team'} onChange={e=>set('author',e.target.value)} /></div>
          <div><label style={label}>Read (min)</label><input style={input} type="number" value={form.read_time_minutes??3} onChange={e=>set('read_time_minutes',parseInt(e.target.value))} /></div>
        </div>

        <label style={label}>Tags (comma separated)</label>
        <input style={input}
          value={(form.tags??[]).join(', ')}
          onChange={e=>set('tags', e.target.value.split(',').map(t=>t.trim()).filter(Boolean))}
          placeholder="protein, muscle, fat loss" />

        <div style={{ display:'flex', gap:24, marginBottom:24 }}>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:14 }}>
            <input type="checkbox" checked={form.featured??false} onChange={e=>set('featured',e.target.checked)} /> ⭐ Featured
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:14 }}>
            <input type="checkbox" checked={form.is_published??true} onChange={e=>set('is_published',e.target.checked)} /> ✅ Published
          </label>
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button style={btn('ghost')} onClick={onClose}>Cancel</button>
          <button style={btn('primary')} onClick={()=>onSave(form)}>Save Article</button>
        </div>
      </div>
    </div>
  );
}

// ─── Video Modal ──────────────────────────────────────────────────────────────
interface Video { id:string; title:string; description:string; thumbnail_url:string; video_url:string; category:string; duration_seconds:number; is_published:boolean; published_at:string; created_at:string; }

function VideoModal({ video, onSave, onClose }: {
  video: Partial<Video>|null;
  onSave: (d: Partial<Video>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<Video>>(video ?? {
    title:'', description:'', thumbnail_url:'', video_url:'',
    category:'training', duration_seconds:0, is_published:true,
  });
  const set = (k: keyof Video, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ position:'fixed', inset:0, background:'#00000090', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, padding:32, width:600, maxHeight:'90vh', overflow:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:24 }}>
          <h2 style={{ fontSize:20, fontWeight:800 }}>{video?.id ? '✏️ Edit Video' : '🎬 New Video'}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.dim, fontSize:22, cursor:'pointer' }}>✕</button>
        </div>

        <label style={label}>Title</label>
        <input style={input} value={form.title??''} onChange={e=>set('title',e.target.value)} placeholder="Video title..." />

        <label style={label}>Description</label>
        <textarea style={{ ...input, height:100, resize:'vertical' }} value={form.description??''} onChange={e=>set('description',e.target.value)} placeholder="What this video covers..." />

        <label style={label}>Video URL</label>
        <input style={input} value={form.video_url??''} onChange={e=>set('video_url',e.target.value)} placeholder="https://youtube.com/watch?v=..." />

        <label style={label}>Thumbnail URL (optional)</label>
        <input style={input} value={form.thumbnail_url??''} onChange={e=>set('thumbnail_url',e.target.value)} placeholder="https://..." />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={label}>Category</label>
            <select style={input} value={form.category??'training'} onChange={e=>set('category',e.target.value)}>
              {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Duration (seconds)</label>
            <input style={input} type="number" value={form.duration_seconds??0} onChange={e=>set('duration_seconds',parseInt(e.target.value))} />
          </div>
        </div>

        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:14, marginBottom:24 }}>
          <input type="checkbox" checked={form.is_published??true} onChange={e=>set('is_published',e.target.checked)} /> ✅ Published
        </label>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button style={btn('ghost')} onClick={onClose}>Cancel</button>
          <button style={btn('primary')} onClick={()=>onSave(form)}>Save Video</button>
        </div>
      </div>
    </div>
  );
}

// ─── Overview Dashboard ───────────────────────────────────────────────────────
function Overview() {
  const [stats, setStats] = useState({ users:0, workouts:0, meals:0, articles:0, labs:0, streaks:0 });
  const [recent, setRecent] = useState<{title:string; category:string; created_at:string}[]>([]);

  useEffect(() => {
    const load = async () => {
      const [u,w,m,a,l,s,r] = await Promise.allSettled([
        supabase.from('users').select('id',{count:'exact',head:true}),
        supabase.from('workouts').select('id',{count:'exact',head:true}),
        supabase.from('meal_plans').select('id',{count:'exact',head:true}),
        supabase.from('articles').select('id',{count:'exact',head:true}),
        supabase.from('lab_reports').select('id',{count:'exact',head:true}),
        supabase.from('streaks').select('id',{count:'exact',head:true}),
        supabase.from('articles').select('title,category,created_at').order('created_at',{ascending:false}).limit(5),
      ]);
      setStats({
        users:    u.status==='fulfilled'?(u.value.count??0):0,
        workouts: w.status==='fulfilled'?(w.value.count??0):0,
        meals:    m.status==='fulfilled'?(m.value.count??0):0,
        articles: a.status==='fulfilled'?(a.value.count??0):0,
        labs:     l.status==='fulfilled'?(l.value.count??0):0,
        streaks:  s.status==='fulfilled'?(s.value.count??0):0,
      });
      if (r.status==='fulfilled') setRecent((r.value.data??[]) as typeof recent);
    };
    load();
  }, []);

  const statCards = [
    { label:'Total Users',       value:stats.users,    emoji:'👤', color:C.primary },
    { label:'Workouts Generated',value:stats.workouts, emoji:'💪', color:C.orange  },
    { label:'Meal Plans',        value:stats.meals,    emoji:'🥗', color:C.green   },
    { label:'Articles Published',value:stats.articles, emoji:'📚', color:C.purple  },
    { label:'Lab Reports',       value:stats.labs,     emoji:'🧬', color:C.yellow  },
    { label:'Active Streaks',    value:stats.streaks,  emoji:'🔥', color:C.red     },
  ];

  return (
    <div>
      <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:-0.5, marginBottom:24 }}>Overview 📊</h1>

      {/* Stat Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:28 }}>
        {statCards.map(s => (
          <div key={s.label} style={{ ...card, padding:'20px 22px' }}>
            <div style={{ fontSize:26, marginBottom:8 }}>{s.emoji}</div>
            <div style={{ fontSize:30, fontWeight:800, color:s.color, letterSpacing:-1 }}>{s.value.toLocaleString()}</div>
            <div style={{ fontSize:12, color:C.dim, marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Platform Status */}
        <div style={card}>
          <div style={{ padding:'16px 20px', borderBottom:`1px solid ${C.border}`, fontWeight:700, fontSize:15 }}>Platform Status</div>
          {[
            { label:'Supabase Database',      status:'Operational', color:C.green  },
            { label:'AI Workflow Edge Fn',    status:'Live',        color:C.green  },
            { label:'OpenAI Integration',     status:'Connected',   color:C.green  },
            { label:'Push Notifications',     status:'Ready',       color:C.yellow },
            { label:'HealthKit / Google Fit', status:'Ready',       color:C.yellow },
            { label:'iOS Build',              status:'Pending',     color:C.dim    },
            { label:'Android Build',          status:'Pending',     color:C.dim    },
          ].map(r => (
            <div key={r.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 20px', borderBottom:`1px solid #1A1A26` }}>
              <span style={{ fontSize:13 }}>{r.label}</span>
              <span style={badge(r.color)}>{r.status}</span>
            </div>
          ))}
        </div>

        {/* Recent Articles */}
        <div style={card}>
          <div style={{ padding:'16px 20px', borderBottom:`1px solid ${C.border}`, fontWeight:700, fontSize:15 }}>Recent Articles</div>
          {recent.length === 0
            ? <div style={{ padding:24, color:C.dim, fontSize:13 }}>No articles yet.</div>
            : recent.map(a => (
              <div key={a.title} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 20px', borderBottom:`1px solid #1A1A26` }}>
                <span style={{ fontSize:13, fontWeight:500 }}>{a.title}</span>
                <span style={badge(CAT_COLORS[a.category]??C.muted)}>{a.category}</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ─── Articles Manager ─────────────────────────────────────────────────────────
function ArticlesManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Article>|null|false>(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('articles').select('*').order('created_at',{ascending:false});
    setArticles((data as Article[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form: Partial<Article>) => {
    if (form.id) await supabase.from('articles').update(form).eq('id', form.id);
    else await supabase.from('articles').insert(form);
    setEditing(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    await supabase.from('articles').delete().eq('id', id);
    load();
  };

  const handleToggle = async (a: Article) => {
    await supabase.from('articles').update({ is_published: !a.is_published }).eq('id', a.id);
    load();
  };

  const visible = articles
    .filter(a => filter==='all' || a.category===filter)
    .filter(a => !search || a.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:-0.5 }}>Articles 📚</h1>
        <button style={btn('primary')} onClick={()=>setEditing({})}>+ New Article</button>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <input
          style={{ ...input, width:220, marginBottom:0 }}
          placeholder="Search articles..."
          value={search} onChange={e=>setSearch(e.target.value)}
        />
        {['all',...CATEGORIES].map(cat=>(
          <button key={cat} onClick={()=>setFilter(cat)}
            style={{ ...btn(filter===cat?'primary':'ghost'), padding:'7px 14px', fontSize:12, textTransform:'capitalize' }}>
            {cat}
          </button>
        ))}
      </div>

      <div style={card}>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:C.dim }}>Loading…</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Article</th>
                <th style={th}>Category</th>
                <th style={th}>Read</th>
                <th style={th}>Status</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(a=>(
                <tr key={a.id}>
                  <td style={td}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:22 }}>{a.emoji}</span>
                      <div>
                        <div style={{ fontWeight:600, fontSize:14 }}>{a.title}{a.featured?' ⭐':''}</div>
                        <div style={{ fontSize:12, color:C.dim, marginTop:2 }}>{a.summary.slice(0,60)}…</div>
                      </div>
                    </div>
                  </td>
                  <td style={td}><span style={badge(CAT_COLORS[a.category]??C.muted)}>{a.category}</span></td>
                  <td style={{ ...td, color:C.muted }}>{a.read_time_minutes}m</td>
                  <td style={td}><span style={badge(a.is_published?C.green:C.dim)}>{a.is_published?'Published':'Draft'}</span></td>
                  <td style={td}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button style={btn('ghost')} onClick={()=>setEditing(a)}>Edit</button>
                      <button style={btn(a.is_published?'ghost':'success')} onClick={()=>handleToggle(a)}>
                        {a.is_published?'Unpublish':'Publish'}
                      </button>
                      <button style={btn('danger')} onClick={()=>handleDelete(a.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length===0 && (
                <tr><td colSpan={5} style={{ ...td, textAlign:'center', color:C.dim, padding:40 }}>No articles found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {editing!==false && <ArticleModal article={editing} onSave={handleSave} onClose={()=>setEditing(false)} />}
    </div>
  );
}

// ─── Videos Manager ───────────────────────────────────────────────────────────
function VideosManager() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Video>|null|false>(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('videos').select('*').order('created_at',{ascending:false});
    setVideos((data as Video[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form: Partial<Video>) => {
    if (form.id) await supabase.from('videos').update(form).eq('id', form.id);
    else await supabase.from('videos').insert(form);
    setEditing(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    await supabase.from('videos').delete().eq('id', id);
    load();
  };

  const fmt = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:-0.5 }}>Videos 🎬</h1>
        <button style={btn('primary')} onClick={()=>setEditing({})}>+ Add Video</button>
      </div>

      <div style={card}>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:C.dim }}>Loading…</div>
        ) : videos.length === 0 ? (
          <div style={{ padding:60, textAlign:'center', color:C.dim }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🎬</div>
            <div style={{ fontSize:15, fontWeight:600 }}>No videos yet</div>
            <div style={{ fontSize:13, marginTop:6 }}>Add your first video to the education library</div>
            <button style={{ ...btn('primary'), marginTop:20 }} onClick={()=>setEditing({})}>+ Add Video</button>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Video</th>
                <th style={th}>Category</th>
                <th style={th}>Duration</th>
                <th style={th}>Status</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.map(v=>(
                <tr key={v.id}>
                  <td style={td}>
                    <div style={{ fontWeight:600, fontSize:14 }}>{v.title}</div>
                    <div style={{ fontSize:12, color:C.dim, marginTop:2 }}>{v.description.slice(0,55)}…</div>
                  </td>
                  <td style={td}><span style={badge(CAT_COLORS[v.category]??C.muted)}>{v.category}</span></td>
                  <td style={{ ...td, color:C.muted }}>{fmt(v.duration_seconds)}</td>
                  <td style={td}><span style={badge(v.is_published?C.green:C.dim)}>{v.is_published?'Published':'Draft'}</span></td>
                  <td style={td}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button style={btn('ghost')} onClick={()=>setEditing(v)}>Edit</button>
                      <button style={btn('danger')} onClick={()=>handleDelete(v.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing!==false && <VideoModal video={editing} onSave={handleSave} onClose={()=>setEditing(false)} />}
    </div>
  );
}

// ─── Users Viewer ─────────────────────────────────────────────────────────────
interface UserRow { id:string; email:string; full_name:string|null; created_at:string; }

function UsersManager() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('users').select('id,email,full_name,created_at').order('created_at',{ascending:false}).limit(100)
      .then(({ data }) => { setUsers((data as UserRow[])??[]); setLoading(false); });
  }, []);

  return (
    <div>
      <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:-0.5, marginBottom:20 }}>Users 👥</h1>
      <div style={card}>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:C.dim }}>Loading…</div>
        ) : users.length === 0 ? (
          <div style={{ padding:60, textAlign:'center', color:C.dim }}>
            <div style={{ fontSize:40, marginBottom:12 }}>👤</div>
            <div style={{ fontSize:15 }}>No users yet — share the app to get your first signups!</div>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={th}>User</th>
                <th style={th}>Email</th>
                <th style={th}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u=>(
                <tr key={u.id}>
                  <td style={td}>
                    <div style={{ fontWeight:600 }}>{u.full_name ?? 'Anonymous'}</div>
                    <div style={{ fontSize:11, color:C.dim, fontFamily:'monospace' }}>{u.id.slice(0,8)}…</div>
                  </td>
                  <td style={{ ...td, color:C.muted }}>{u.email}</td>
                  <td style={{ ...td, color:C.dim }}>{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Main App Shell ───────────────────────────────────────────────────────────
type View = 'overview'|'articles'|'videos'|'users';

const NAV: { key:View; emoji:string; label:string }[] = [
  { key:'overview',  emoji:'📊', label:'Overview'  },
  { key:'articles',  emoji:'📚', label:'Articles'  },
  { key:'videos',    emoji:'🎬', label:'Videos'    },
  { key:'users',     emoji:'👥', label:'Users'     },
];

export function App() {
  const [view, setView] = useState<View>('overview');
  const hasEnv = !!import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'undefined';

  if (!hasEnv) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:16, background:C.bg }}>
        <div style={{ fontSize:40 }}>⚙️</div>
        <div style={{ fontSize:18, fontWeight:700, color:C.text }}>Missing .env config</div>
        <div style={{ fontSize:13, color:C.dim, fontFamily:'monospace', textAlign:'center', lineHeight:2 }}>
          VITE_SUPABASE_URL=https://rwisnjzibfpaasmlsmmg.supabase.co<br/>
          VITE_SUPABASE_SERVICE_KEY=your_service_role_key
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', height:'100vh', background:C.bg, color:C.text, fontFamily:'-apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width:220, background:'#0E0E18', borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', padding:'24px 0' }}>
        <div style={{ fontSize:20, fontWeight:800, color:C.primary, padding:'0 24px 24px', borderBottom:`1px solid ${C.border}`, letterSpacing:-0.5 }}>
          ⚡ EVX Admin
        </div>
        <nav style={{ padding:'14px 0', flex:1 }}>
          {NAV.map(item => {
            const active = view===item.key;
            return (
              <div key={item.key}
                onClick={()=>setView(item.key)}
                style={{
                  display:'flex', alignItems:'center', gap:10, padding:'12px 24px', cursor:'pointer',
                  background: active ? C.primary+'15' : 'transparent',
                  borderLeft: active ? `3px solid ${C.primary}` : '3px solid transparent',
                  color: active ? C.primary : C.muted,
                  fontSize:14, fontWeight: active ? 700 : 500,
                }}>
                <span>{item.emoji}</span><span>{item.label}</span>
              </div>
            );
          })}
        </nav>
        <div style={{ padding:'16px 24px', borderTop:`1px solid ${C.border}`, fontSize:11, color:'#303048' }}>
          EVX Admin v2.0 · Phase 4b
        </div>
      </div>

      {/* Main */}
      <main style={{ flex:1, overflow:'auto', padding:32 }}>
        {view==='overview' && <Overview />}
        {view==='articles' && <ArticlesManager />}
        {view==='videos'   && <VideosManager />}
        {view==='users'    && <UsersManager />}
      </main>
    </div>
  );
}
