import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BASE_URL } from '../utils/api';
import '../styles/Auth.css';
import AddressAutocomplete from '../components/AddressAutocomplete';

const Register = () => {
  const [step, setStep] = useState(1); // 1 = form, 2 = otp
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    passwordConfirm: '',
    role: 'user',
    avatar: '',
    otp: '',
    restaurantName: '',
    restaurantAddress: '',
    address: '',
    location: { lat: null, lng: null },
    vehicleType: 'Bike'
  });
  
  // ... handleChange and other logic
  
  const handleAddressSelect = (data) => {
    if (formData.role === 'restaurant-owner') {
      setFormData(prev => ({ 
        ...prev, 
        restaurantAddress: data.address, 
        location: { lat: data.lat, lng: data.lng } 
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        address: data.address, 
        location: { lat: data.lat, lng: data.lng } 
      }));
    }
  };
  const [avatarPreview, setAvatarPreview] = useState('/images/default_avatar.jpg');
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const redirect = location.search ? location.search.split('=')[1] : '/';
  const isOwner = formData.role === 'restaurant-owner';
  const isDelivery = formData.role === 'delivery';

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

  const requestOTP = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.passwordConfirm) return toast.error("Passwords do not match");
    if (formData.phoneNumber.length !== 10) return toast.error("Phone number must be exactly 10 digits");
    if (isOwner && (!formData.restaurantName || !formData.restaurantAddress)) {
      return toast.error("Please fill in your Restaurant Name and Address");
    }
    if (isDelivery && !formData.vehicleType) {
      return toast.error("Please select your vehicle type");
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/users/send-registration-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, name: formData.name }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Verification code sent to your email!');
        setStep(2);
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch {
      toast.error('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndRegister = async (e) => {
    e.preventDefault();
    if (!formData.otp || formData.otp.length !== 6) return toast.error("Please enter a valid 6-digit OTP");

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/users/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Account created successfully!');
        setTimeout(() => { window.location.href = redirect; }, 1000);
      } else {
        toast.error(data.message || 'Verification failed');
      }
    } catch {
      toast.error('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const accentColor = isOwner ? '#e67e22' : isDelivery ? '#3498db' : '#2ecc71';

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ minWidth: '480px', maxWidth: '540px' }}>
        <h2 className="auth-title mb-2 fw-800" style={{ color: accentColor, fontWeight: '800' }}>
          {step === 1
            ? isOwner ? '🍽️ Partner with OrderEat'
            : isDelivery ? '🚴 Join as Delivery Partner'
            : 'Join OrderEat'
          : '📧 Verify Your Email'}
        </h2>

        {step === 1 && (
          <>
            {/* Role Toggle */}
            <div className="role-toggle-group mb-4">
              <button type="button"
                className={`role-toggle-btn ${formData.role === 'user' ? 'active-green' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, role: 'user' }))}>
                🛵 Customer
              </button>
              <button type="button"
                className={`role-toggle-btn ${isOwner ? 'active-orange' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, role: 'restaurant-owner' }))}>
                🏪 Restaurant Owner
              </button>
              <button type="button"
                className={`role-toggle-btn ${isDelivery ? 'active-blue' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, role: 'delivery' }))}>
                🚴 Delivery Partner
              </button>
            </div>

            <form onSubmit={requestOTP} encType="multipart/form-data">
              {/* Avatar Preview */}
              <div className="d-flex align-items-center mb-4 p-3 bg-light rounded border shadow-sm">
                <figure style={{ width: '55px', height: '55px', borderRadius: '50%', overflow: 'hidden', border: `3px solid ${accentColor}`, marginRight: '15px', flexShrink: 0 }}>
                  <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </figure>
                <div className="flex-grow-1">
                  <label className="text-muted small fw-bold mb-1 d-block">Profile Picture</label>
                  <input type="file" name="avatar" className="form-control form-control-sm" accept="image/*" onChange={handleChange} />
                </div>
              </div>

              <div className="row g-2 mb-2">
                <div className="col-md-6">
                  <label className="auth-label text-muted fw-bold small">Full Name</label>
                  <input type="text" className="form-control auth-input py-2" name="name" onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="auth-label text-muted fw-bold small">Phone Number</label>
                  <input type="text" className="form-control auth-input py-2" name="phoneNumber" onChange={handleChange} required />
                </div>
              </div>

              <div className="mb-2">
                <label className="auth-label text-muted fw-bold small">Email</label>
                <input type="email" className="form-control auth-input py-2" name="email" onChange={handleChange} required />
              </div>

              <div className="row g-2 mb-3">
                <div className="col-md-6">
                  <label className="auth-label text-muted fw-bold small">Password</label>
                  <input type="password" className="form-control auth-input py-2" name="password" onChange={handleChange} required minLength={6} />
                </div>
                <div className="col-md-6">
                  <label className="auth-label text-muted fw-bold small">Confirm Password</label>
                  <input type="password" className="form-control auth-input py-2" name="passwordConfirm" onChange={handleChange} required />
                </div>
              </div>

              <div className="mb-3">
                <label className="auth-label text-muted fw-bold small">Delivery Address</label>
                <AddressAutocomplete 
                  placeholder="Type your area, street or building..." 
                  onAddressSelect={handleAddressSelect}
                  initialValue={formData.address}
                />
              </div>

              {/* Delivery Partner Extra Fields */}
              {isDelivery && (
                <div className="p-3 mb-3 rounded border" style={{ borderColor: '#3498db', backgroundColor: '#f0f8ff' }}>
                  <p className="fw-bold small mb-2" style={{ color: '#3498db' }}>🚴 Delivery Partner Details</p>
                  <div className="mb-2">
                    <label className="auth-label text-muted fw-bold small">Vehicle Type</label>
                    <div className="d-flex gap-3 p-2 bg-white rounded border">
                      {['Bike', 'Scooter', 'Bicycle', 'On-Foot'].map(v => (
                        <div key={v} className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="vehicleType"
                            id={`vehicle-${v}`}
                            value={v}
                            checked={formData.vehicleType === v}
                            onChange={handleChange}
                          />
                          <label className="form-check-label small fw-bold" htmlFor={`vehicle-${v}`}>{v}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 p-2 rounded" style={{ background: '#e8f4fd', fontSize: '12px', color: '#2980b9' }}>
                    ℹ️ After registration, you can toggle your availability from your dashboard. Orders will auto-assign to you when you are online.
                  </div>
                </div>
              )}

              {/* Restaurant Owner Extra Fields */}
              {isOwner && (
                <div className="p-3 mb-3 rounded border" style={{ borderColor: '#e67e22', backgroundColor: '#fff8f4' }}>
                  <p className="fw-bold small mb-2" style={{ color: '#e67e22' }}>🏪 Restaurant Details</p>
                  <div className="mb-2">
                    <label className="auth-label text-muted fw-bold small">Restaurant Name</label>
                    <input type="text" className="form-control auth-input py-2" name="restaurantName" onChange={handleChange} required={isOwner} />
                  </div>
                  <div>
                    <label className="auth-label text-muted fw-bold small">Restaurant Address</label>
                    <AddressAutocomplete
                      placeholder="Search for your restaurant location..."
                      onAddressSelect={handleAddressSelect}
                      initialValue={formData.restaurantAddress}
                    />
                  </div>
                </div>
              )}

              <button type="submit" className="btn w-100 text-white fw-bold py-2 shadow-sm mt-1"
                disabled={loading}
                style={{ backgroundColor: accentColor, border: 'none', borderRadius: '8px' }}>
                {loading ? 'Sending Code...' : 'CONTINUE →'}
              </button>
            </form>

            <div className="text-center mt-3">
              <span className="text-muted fw-bold small">Already have an account? </span>
              <Link to={`/login?redirect=${redirect}`} className="text-decoration-none fw-bold small" style={{ color: accentColor }}>
                Login
              </Link>
            </div>
          </>
        )}

        {step === 2 && (
          <form onSubmit={verifyAndRegister}>
            <div className="text-center mb-4 mt-2">
              <div style={{ fontSize: '48px' }}>📬</div>
              <p className="mt-2 text-muted">A 6-digit code was sent to <strong>{formData.email}</strong>. Enter it below.</p>
            </div>

            <div className="mb-4 text-center">
              <input type="text" className="form-control mx-auto text-center py-3"
                name="otp"
                onChange={handleChange}
                required
                maxLength={6}
                placeholder="• • • • • •"
                style={{ fontSize: '24px', letterSpacing: '8px', maxWidth: '250px', fontWeight: 'bold' }} />
            </div>

            <button type="submit" disabled={loading}
              className="btn w-100 text-white fw-bold py-3 shadow-sm mb-3"
              style={{ backgroundColor: '#2c3e50', borderRadius: '10px' }}>
              {loading ? 'Verifying...' : 'VERIFY & CREATE ACCOUNT'}
            </button>
            <div className="text-center">
              <button type="button" onClick={() => setStep(1)} className="btn btn-link text-muted text-decoration-none fw-bold small">
                ← Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;