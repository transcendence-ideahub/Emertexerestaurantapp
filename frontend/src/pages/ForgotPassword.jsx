import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BASE_URL } from '../utils/api';
import '../styles/Auth.css';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${BASE_URL}/users/password/forgot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('OTP sent to your email!', { duration: 5000 });
                navigate('/password/reset', { state: { email } });
            } else {
                toast.error(data.message || 'Something went wrong', { duration: 5000 });
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
                <h2 className="auth-title" style={{ color: '#e67e22' }}>Forgot Password</h2>
                <p className="auth-instruction">
                    Enter your registered email address and we'll send you a link to reset your password.
                </p>

                <form onSubmit={submitHandler}>
                    <div className="mb-4">
                        <label className="auth-label">Email Address</label>
                        <input 
                            type="email" 
                            className="form-control auth-input" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                            placeholder="example@gmail.com"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn w-100 text-white auth-btn"
                        disabled={loading}
                        style={{ backgroundColor: '#e67e22', border: 'none' }}
                    >
                        {loading ? 'Sending...' : 'SEND RESET LINK'}
                    </button>
                </form>

                <Link to="/login" className="back-to-login">
                    <i className="fa fa-arrow-left me-2"></i> Back to Login
                </Link>
            </div>
        </div>
    );
};

export default ForgotPassword;