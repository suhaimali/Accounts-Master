import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, Loader2, BookOpen, Lock, Mail, CheckCircle2, TrendingUp, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@accountsmaster.com');
  const [password, setPassword] = useState('12345678');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) { toast.error('Please enter email and password'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#fff', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>

      {/* Left: Brand panel */}
      <div className="hide-on-mobile" style={{ flex: 1, background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', color: '#fff', display: 'flex', flexDirection: 'column', padding: '60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -50, left: -50, width: 300, height: 300, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 60, zIndex: 1 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={28} color="#2563eb" />
          </div>
          <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>Accounts Master</span>
        </div>

        <div style={{ zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-1px' }}>
            Streamline your<br />daily cash flow.
          </h1>
          <p style={{ fontSize: 18, opacity: 0.85, lineHeight: 1.6, maxWidth: 450, marginBottom: 40 }}>
            The ultimate tool for store managers to reconcile drawer cash, track daily expenses, and manage customer credit flawlessly.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { icon: CheckCircle2, text: 'Perfect Cash Reconciliation' },
              { icon: TrendingUp, text: 'Advanced Expense Analytics' },
              { icon: Wallet, text: 'Customer Credit Tracking' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 10 }}><Icon size={24} /></div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Login form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: '#f8fafc', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 440, background: '#fff', padding: '40px', borderRadius: 24, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)' }}>

          <div style={{ textAlign: 'left', marginBottom: 32 }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 8px', letterSpacing: '-1px', background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Welcome Back
            </h2>
            <p style={{ color: '#64748b', margin: 0, fontSize: 15 }}>Sign in to manage your daily accounts.</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Email */}
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}><Mail size={18} /></div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 12, border: '1.5px solid #cbd5e1', fontSize: 15, color: '#0f172a', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}><Lock size={18} /></div>
                <input
                  id="password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '14px 44px 14px 44px', borderRadius: 12, border: '1.5px solid #cbd5e1', fontSize: 15, color: '#0f172a', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '16px', borderRadius: 12, background: '#2563eb', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4, transition: 'background 0.2s', boxShadow: '0 4px 14px rgba(37,99,235,0.3)', opacity: loading ? 0.8 : 1 }}
            >
              {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</> : 'Sign In →'}
            </button>
          </form>

          <div style={{ marginTop: 24, padding: '14px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Default credentials</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Email: <strong>admin@accountsmaster.com</strong></div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Password: <strong>12345678</strong></div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) { .hide-on-mobile { display: none !important; } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
