import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BASE_URL } from '../utils/api';
import '../styles/Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    passwordConfirm: '',
    role: 'user' // Default role
  });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const redirect = location.search ? location.search.split('=')[1] : '/';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.passwordConfirm) {
      toast.error("Passwords do not match", { duration: 5000 });
      setLoading(false);
      return;
    }
    if (formData.phoneNumber.length !== 10) {
      toast.error("Phone number must be exactly 10 digits", { duration: 5000 });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/users/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Account created successfully!', { duration: 5000 });
        setTimeout(() => {
          window.location.href = redirect;
        }, 1000);
      } else {
        toast.error(data.message || 'Failed to register', { duration: 5000 });
      }
    } catch (err) {
      toast.error('Failed to connect to the server.', { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title" style={{ color: '#2ecc71' }}>Join OrderEat</h2>

        {/* Role Toggle Switch */}
        <div className="role-toggle-group">
          <button 
            type="button" 
            className={`role-toggle-btn ${formData.role === 'user' ? 'active-green' : ''}`} 
            onClick={() => setFormData({ ...formData, role: 'user' })}
          >
            Customer
          </button>
          <button 
            type="button" 
            className={`role-toggle-btn ${formData.role === 'restaurant-owner' ? 'active-green' : ''}`} 
            onClick={() => setFormData({ ...formData, role: 'restaurant-owner' })}
          >
            Restaurant Owner
          </button>
        </div>

        <form onSubmit={submitHandler}>
          <div className="mb-3">
            <label className="auth-label">Full Name</label>
            <input type="text" className="form-control auth-input" name="name" onChange={handleChange} required />
          </div>

          <div className="mb-3">
            <label className="auth-label">Email</label>
            <input type="email" className="form-control auth-input" name="email" onChange={handleChange} required />
          </div>

          <div className="mb-3">
            <label className="auth-label">Phone Number</label>
            <input type="text" className="form-control auth-input" name="phoneNumber" onChange={handleChange} required />
          </div>

          <div className="mb-3">
            <label className="auth-label">Password</label>
            <input type="password" className="form-control auth-input" name="password" onChange={handleChange} required minLength={6} />
          </div>

          <div className="mb-4">
            <label className="auth-label">Confirm Password</label>
            <input type="password" className="form-control auth-input" name="passwordConfirm" onChange={handleChange} required />
          </div>

          <button 
            type="submit" 
            className="btn w-100 text-white auth-btn"
            disabled={loading}
            style={{ backgroundColor: '#2ecc71', border: 'none' }}
          >
            {loading ? 'Creating Account...' : 'SIGN UP'}
          </button>
        </form>

        <div className="text-center mt-4">
          <span className="text-muted">Already have an account? </span>
          <Link to={`/login?redirect=${redirect}`} className="auth-link" style={{ color: '#e67e22' }}>
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;