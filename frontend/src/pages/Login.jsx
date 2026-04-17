import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BASE_URL } from '../utils/api';
import '../styles/Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user'); // Default role
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const redirect = location.search ? location.search.split('=')[1] : '/';

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch(`${BASE_URL}/users/me`, {
                    method: 'GET',
                    credentials: 'include'
                });
                const data = await response.json();
                if (response.ok && data.success) {
                    // Already logged in — send to correct destination
                    if (data.user.role === 'restaurant-owner') {
                        navigate('/partner/dashboard');
                    } else {
                        navigate(redirect);
                    }
                }
            } catch (error) {
                // Not logged in, stay on login page
            }
        };
        checkAuth();
    }, [navigate, redirect]);

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${BASE_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });

            const data = await response.json();
            const user = data.user || (data.data && data.data.user);

            if (response.ok && data.success) {
                // ROLE CHECK: Prevent cross-role logins
                if (user && user.role !== role) {
                    await fetch(`${BASE_URL}/users/logout`, { credentials: 'include' });
                    toast.error(`Access Denied: You do not have ${role} privileges.`, { duration: 5000 });
                    setLoading(false);
                    return;
                }

                toast.success(`Welcome back, ${user ? user.name : 'User'}!`, { duration: 3000 });

                // Redirect based on role
                const destination = user?.role === 'restaurant-owner'
                    ? '/partner/dashboard'
                    : user?.role === 'admin'
                    ? '/admin/dashboard'
                    : redirect;

                setTimeout(() => {
                    window.location.href = destination;
                }, 1000);

            } else {
                toast.error(data.message || 'Invalid email or password', { duration: 5000 });
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
                <h2 className="auth-title" style={{ color: '#e67e22' }}>Login to OrderEat</h2>

                {/* Role Toggle Switch */}
                <div className="role-toggle-group">
                    <button
                        type="button"
                        className={`role-toggle-btn ${role === 'user' ? 'active-orange' : ''}`}
                        onClick={() => setRole('user')}
                    >
                        Customer
                    </button>
                    <button
                        type="button"
                        className={`role-toggle-btn ${role === 'restaurant-owner' ? 'active-orange' : ''}`}
                        onClick={() => setRole('restaurant-owner')}
                    >
                        Owner
                    </button>
                    <button
                        type="button"
                        className={`role-toggle-btn ${role === 'admin' ? 'active-orange' : ''}`}
                        onClick={() => setRole('admin')}
                    >
                        Admin
                    </button>
                </div>

                <form onSubmit={submitHandler}>
                    <div className="mb-3">
                        <label className="auth-label">Email</label>
                        <input
                            type="email"
                            className="form-control auth-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="auth-label">Password</label>
                        <input
                            type="password"
                            className="form-control auth-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="text-end mb-3">
                        <Link to="/password/forgot" className="text-decoration-none text-muted small">
                            Forgot Password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="btn w-100 text-white auth-btn"
                        disabled={loading}
                        style={{ backgroundColor: '#e67e22', border: 'none' }}
                    >
                        {loading ? 'Logging in...' : 'LOGIN'}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <span className="text-muted">Don't have an account? </span>
                    <Link to={`/register?redirect=${redirect}`} className="auth-link" style={{ color: '#2ecc71' }}>
                        Sign Up
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;