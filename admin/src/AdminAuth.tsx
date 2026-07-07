import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

const C = {
  bg: '#0A0A0F', card: '#12121A', border: '#2A2A3A',
  text: '#FFFFFF', muted: '#A0A0B8', dim: '#606080',
  primary: '#00D4FF', red: '#FF4444',
};

type Status = 'checking' | 'signed_out' | 'not_admin' | 'authorized';

/**
 * Gate the entire admin dashboard behind Supabase Auth + an `is_admin` flag
 * on public.users. No service-role key is ever used in this app — every
 * request runs as the logged-in admin's own JWT, enforced by RLS policies
 * (see supabase/migrations/005_admin_rls.sql).
 */
export function AdminAuth({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setStatus('signed_out'); return; }
    const { data, error: qErr } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();
    if (qErr || !data?.is_admin) { setStatus('not_admin'); return; }
    setStatus('authorized');
  };

  useEffect(() => {
    checkAdmin();
    const { data: sub } = supabase.auth.onAuthStateChange(() => checkAdmin());
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signInError) setError(signInError.message);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setStatus('signed_out');
  };

  if (status === 'checking') {
    return (
      <div style={{ ...wrap }}>
        <div style={{ color: C.dim }}>Checking session…</div>
      </div>
    );
  }

  if (status === 'authorized') {
    return <>{children}</>;
  }

  if (status === 'not_admin') {
    return (
      <div style={wrap}>
        <div style={box}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⛔</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Not authorized</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
            This account doesn't have admin access. Ask the owner to set <code>is_admin = true</code> for your user.
          </div>
          <button style={btnStyle} onClick={handleSignOut}>Sign out</button>
        </div>
      </div>
    );
  }

  // signed_out
  return (
    <div style={wrap}>
      <form style={box} onSubmit={handleLogin}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>EVX Admin</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Sign in with your admin account</div>
        <input
          style={inputStyle} type="email" placeholder="Email" required
          value={email} onChange={e => setEmail(e.target.value)}
        />
        <input
          style={inputStyle} type="password" placeholder="Password" required
          value={password} onChange={e => setPassword(e.target.value)}
        />
        {error && <div style={{ color: C.red, fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <button style={{ ...btnStyle, width: '100%', background: C.primary, color: '#000' }} disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

const wrap: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif',
};
const box: React.CSSProperties = {
  background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
  padding: 32, width: 340, textAlign: 'center',
};
const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0A0A0F', border: `1px solid ${C.border}`,
  borderRadius: 8, padding: '11px 14px', color: C.text, fontSize: 14,
  outline: 'none', marginBottom: 12, boxSizing: 'border-box',
};
const btnStyle: React.CSSProperties = {
  padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
  fontSize: 13, fontWeight: 700, background: '#1E1E2E', color: C.text,
};
