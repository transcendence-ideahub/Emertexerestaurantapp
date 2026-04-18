import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BASE_URL } from '../utils/api';

const PartnerLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${BASE_URL}/users/me`, { credentials: 'include' });
        const data = await res.json();
        if (res.ok && data.success && data.user.role === 'restaurant-owner') {
          navigate('/partner/dashboard');
        }
      } catch {}
    };
    check();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await res.json();
      const user = data.user || (data.data && data.data.user);

      if (res.ok && data.success) {
        if (user?.role !== 'restaurant-owner') {
          await fetch(`${BASE_URL}/users/logout`, { credentials: 'include' });
          toast.error('Access Denied: This portal is for Restaurant Partners only.', { duration: 5000 });
          setLoading(false);
          return;
        }
        toast.success(`Welcome back, ${user.name}! 🏪`);
        setTimeout(() => { window.location.href = '/partner/dashboard'; }, 800);
      } else {
        toast.error(data.message || 'Invalid email or password');
      }
    } catch {
      toast.error('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #e67e22, #d35400)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '36px', margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(230,126,34,0.4)',
          }}>🏪</div>
          <h1 style={{ color: 'white', fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>Restaurant Partner</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '6px', fontSize: '0.95rem' }}>OrderEat Business Portal</p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          padding: '36px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        }}>
          <h2 style={{ color: 'white', fontWeight: '700', marginBottom: '8px', fontSize: '1.3rem' }}>Sign In</h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', marginBottom: '28px' }}>Manage your restaurant and orders</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="partner@restaurant.com"
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                  color: 'white', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '14px 48px 14px 16px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'white', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '15px',
              background: loading ? 'rgba(230,126,34,0.5)' : 'linear-gradient(135deg, #e67e22, #d35400)',
              color: 'white', border: 'none', borderRadius: '12px',
              fontSize: '1rem', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.5px', boxShadow: '0 4px 20px rgba(230,126,34,0.3)',
            }}>
              {loading ? '⌛ Signing in...' : '🏪 Access Dashboard'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Want to register your business? </span>
            <Link to="/register" style={{ color: '#e67e22', fontWeight: '700', textDecoration: 'none', fontSize: '0.9rem' }}>
              Sign up here →
            </Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/login" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', textDecoration: 'none' }}>
            ← Back to main login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PartnerLogin;
