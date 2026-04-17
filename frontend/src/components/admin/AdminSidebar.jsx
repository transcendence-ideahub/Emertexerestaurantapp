import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AdminSidebar.css';

const AdminSidebar = () => {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <div className="admin-sidebar">
            <div className="sidebar-header">
                <h3>Admin Panel</h3>
            </div>
            <nav className="sidebar-nav">
                <Link to="/admin/dashboard" className={`nav-item ${isActive('/admin/dashboard') ? 'active' : ''}`}>
                    <span className="nav-icon">📊</span> Dashboard
                </Link>
                <Link to="/admin/users" className={`nav-item ${isActive('/admin/users') ? 'active' : ''}`}>
                    <span className="nav-icon">👥</span> Users
                </Link>
                <Link to="/admin/restaurants" className={`nav-item ${isActive('/admin/restaurants') ? 'active' : ''}`}>
                    <span className="nav-icon">🏪</span> Restaurants
                </Link>
                <Link to="/admin/orders" className={`nav-item ${isActive('/admin/orders') ? 'active' : ''}`}>
                    <span className="nav-icon">📦</span> All Orders
                </Link>
                <Link to="/" className="nav-item back-home">
                    <span className="nav-icon">🏠</span> Back to App
                </Link>
            </nav>
        </div>
    );
};

export default AdminSidebar;
