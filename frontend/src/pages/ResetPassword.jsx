import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BASE_URL } from '../utils/api';
import '../styles/Auth.css';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [loading, setLoading] = useState(false);

    const { token } = useParams(); // Grabs token from /users/resetPassword/:token
    const navigate = useNavigate();

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (password !== passwordConfirm) {
            toast.error("Passwords do not match", { duration: 5000 });
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/users/password/reset/${token}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, passwordConfirm }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Password reset successfully! Please login.', { duration: 5000 });
                navigate('/login');
            } else {
                toast.error(data.message || 'Token is invalid or expired', { duration: 5000 });
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
                <h2 className="auth-title" style={{ color: '#2ecc71' }}>Set New Password</h2>
                <p className="auth-instruction">Please enter your new secure password below.</p>

                <form onSubmit={submitHandler}>
                    <div className="mb-3">
                        <label className="auth-label">New Password</label>
                        <input 
                            type="password" 
                            className="form-control auth-input" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                            minLength={6}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="auth-label">Confirm New Password</label>
                        <input 
                            type="password" 
                            className="form-control auth-input" 
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            required 
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn w-100 text-white auth-btn"
                        disabled={loading}
                        style={{ backgroundColor: '#2ecc71', border: 'none' }}
                    >
                        {loading ? 'Updating...' : 'RESET PASSWORD'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;