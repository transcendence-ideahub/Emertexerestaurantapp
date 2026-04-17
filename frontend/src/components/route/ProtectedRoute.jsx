import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { BASE_URL } from '../../utils/api';

const ProtectedRoute = ({ children, isAdmin = false }) => {
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch(`${BASE_URL}/users/me`, {
                    method: 'GET',
                    credentials: 'include'
                });
                const data = await response.json();
                
                if (response.ok && data.success) {
                    setIsAuthenticated(true);
                    setUser(data.user);
                }
            } catch (error) {
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    if (loading) {
        return <div className="loader"></div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (isAdmin && user?.role !== 'admin') {
        return <Navigate to="/" />;
    }

    return children;
};

export default ProtectedRoute;
