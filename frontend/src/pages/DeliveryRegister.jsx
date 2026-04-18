import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BASE_URL } from '../utils/api';
import AddressAutocomplete from '../components/AddressAutocomplete';

const DeliveryRegister = () => {
  const [step, setStep] = useState(1); // 1 = form, 2 = otp
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('https://ui-avatars.com/api/?name=Delivery+Partner&background=e67e22&color=fff&size=128');
  const [formData, setFormData] = useState({
    name: '', email: '', phoneNumber: '', password: '', passwordConfirm: '',
    address: '', vehicleType: 'Bike', otp: '',
    avatar: '', location: { lat: null, lng: null },
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    if (e.target.name === 'avatar') {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.readyState === 2) {
          setAvatarPreview(reader.result);
          setFormData(prev => ({ ...prev, avatar: { public_id: 'user_uploaded', url: reader.result } }));
        }
      };
      if (e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
    } else {
      setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }
  };

  const handleAddressSelect = (data) => {
    setFormData(prev => ({ ...prev, address: data.address, location: { lat: data.lat, lng: data.lng } }));
  };

  const requestOTP = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.passwordConfirm) return toast.error('Passwords do not match');
    if (formData.phoneNumber.length !== 10) return toast.error('Phone number must be exactly 10 digits');

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/users/send-registration-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, name: formData.name }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('📬 Verification code sent to your email!');
        setStep(2);
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch {
      toast.error('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndRegister = async (e) => {
    e.preventDefault();
    if (!formData.otp || formData.otp.length !== 6) return toast.error('Please enter a valid 6-digit OTP');

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/users/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'delivery' }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('🎉 Account created! Welcome to OrderEat Fleet!');
        setTimeout(() => { window.location.href = '/delivery/dashboard'; }, 1000);
      } else {
        toast.error(data.message || 'Verification failed');
      }
    } catch {
      toast.error('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: '12px',
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
    color: 'white', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem',
    fontWeight: '600', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.5px',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', sans-serif", padding: '30px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '70px', height: '70px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #f39c12, #e67e22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '30px', margin: '0 auto 12px', boxShadow: '0 8px 32px rgba(230,126,34,0.4)',
          }}>🛵</div>
          <h1 style={{ color: 'white', fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>Join Our Fleet</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '5px', fontSize: '0.9rem' }}>OrderEat Delivery Partner Registration</p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
          {[{ n: 1, label: 'Your Info' }, { n: 2, label: 'Verify' }].map(s => (
            <React.Fragment key={s.n}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  background: step >= s.n ? '#f39c12' : 'rgba(255,255,255,0.1)',
                  color: step >= s.n ? 'white' : 'rgba(255,255,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '700', fontSize: '0.85rem',
                }}>{s.n}</div>
                <span style={{ color: step >= s.n ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>{s.label}</span>
              </div>
              {s.n < 2 && <div style={{ flex: 1, maxWidth: '40px', height: '2px', background: step > s.n ? '#f39c12' : 'rgba(255,255,255,0.1)' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px', padding: '32px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        }}>

          {step === 1 && (
            <form onSubmit={requestOTP}>
              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <img src={avatarPreview} alt="Avatar"
                  style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #f39c12' }} />
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: '6px' }}>PROFILE PHOTO</div>
                  <label style={{
                    padding: '7px 14px', background: 'rgba(243,156,18,0.2)', color: '#f39c12',
                    borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600', border: '1px solid rgba(243,156,18,0.3)',
                  }}>
                    📁 Choose File
                    <input type="file" name="avatar" accept="image/*" style={{ display: 'none' }} onChange={handleChange} />
                  </label>
                </div>
              </div>

              {/* Name + Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input type="text" name="name" required style={inputStyle} onChange={handleChange}
                    placeholder="Ramesh Kumar"
                    onFocus={e => e.target.style.borderColor = '#f39c12'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'} />
                </div>
                <div>
                  <label style={labelStyle}>Phone (10 digits)</label>
                  <input type="tel" name="phoneNumber" required maxLength="10" style={inputStyle}
                    onChange={handleChange} placeholder="9876543210"
                    onFocus={e => e.target.style.borderColor = '#f39c12'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'} />
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Email Address</label>
                <input type="email" name="email" required style={inputStyle} onChange={handleChange}
                  placeholder="you@example.com"
                  onFocus={e => e.target.style.borderColor = '#f39c12'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'} />
              </div>

              {/* Passwords */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Password</label>
                  <input type="password" name="password" required minLength={6} style={inputStyle}
                    onChange={handleChange} placeholder="Min 6 chars"
                    onFocus={e => e.target.style.borderColor = '#f39c12'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'} />
                </div>
                <div>
                  <label style={labelStyle}>Confirm Password</label>
                  <input type="password" name="passwordConfirm" required style={inputStyle}
                    onChange={handleChange} placeholder="Repeat password"
                    onFocus={e => e.target.style.borderColor = '#f39c12'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'} />
                </div>
              </div>

              {/* Vehicle Type */}
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Vehicle Type</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {['🏍️ Bike', '🛵 Scooter', '🚲 Bicycle', '🚶 On-Foot'].map(v => {
                    const val = v.split(' ')[1];
                    const isSelected = formData.vehicleType === val;
                    return (
                      <button key={val} type="button" onClick={() => setFormData(p => ({ ...p, vehicleType: val }))}
                        style={{
                          padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '600',
                          border: `1px solid ${isSelected ? '#f39c12' : 'rgba(255,255,255,0.15)'}`,
                          background: isSelected ? 'rgba(243,156,18,0.2)' : 'rgba(255,255,255,0.05)',
                          color: isSelected ? '#f39c12' : 'rgba(255,255,255,0.5)',
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}>
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Address */}
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Your Home Address</label>
                <AddressAutocomplete
                  placeholder="Type your area, street or locality..."
                  onAddressSelect={handleAddressSelect}
                  initialValue={formData.address}
                />
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '14px',
                background: loading ? 'rgba(243,156,18,0.5)' : 'linear-gradient(135deg, #f39c12, #e67e22)',
                color: 'white', border: 'none', borderRadius: '12px',
                fontSize: '1rem', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(230,126,34,0.3)',
              }}>
                {loading ? '📧 Sending OTP...' : 'Send Verification Code →'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem' }}>Already registered? </span>
                <Link to="/delivery/login" style={{ color: '#f39c12', fontWeight: '700', textDecoration: 'none', fontSize: '0.88rem' }}>
                  Sign In
                </Link>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={verifyAndRegister}>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{ fontSize: '52px', marginBottom: '12px' }}>📬</div>
                <h3 style={{ color: 'white', fontWeight: '700' }}>Check Your Email</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                  A 6-digit code was sent to <strong style={{ color: '#f39c12' }}>{formData.email}</strong>
                </p>
              </div>

              <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <input
                  type="text" name="otp" maxLength="6" required
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="• • • • • •"
                  style={{
                    ...inputStyle, fontSize: '2rem', letterSpacing: '12px', textAlign: 'center',
                    maxWidth: '260px', fontWeight: '800', padding: '16px 20px',
                  }}
                />
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '14px',
                background: loading ? 'rgba(243,156,18,0.5)' : 'linear-gradient(135deg, #f39c12, #e67e22)',
                color: 'white', border: 'none', borderRadius: '12px',
                fontSize: '1rem', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '12px',
              }}>
                {loading ? '⌛ Verifying...' : '🎉 Verify & Create Account'}
              </button>

              <button type="button" onClick={() => setStep(1)} style={{
                width: '100%', padding: '12px', background: 'none',
                color: 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', fontSize: '0.9rem',
              }}>
                ← Back
              </button>
            </form>
          )}
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

export default DeliveryRegister;
