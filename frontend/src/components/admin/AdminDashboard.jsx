import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import { BASE_URL } from '../../utils/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        usersCount: 0,
        ownersCount: 0,
        restaurantsCount: 0,
        ordersCount: 0,
        totalRevenue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`${BASE_URL}/admin/stats`, { credentials: 'include' });
                const data = await res.json();
                if (data.success) {
                    setStats(data.stats);
                }
            } catch (err) {
                console.error("Failed to fetch admin stats");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="loader"></div>;

    return (
        <div className="admin-dashboard-container">
            <AdminSidebar />
            <main className="admin-main-content">
                <div className="admin-header mb-4">
                    <h2>Overview Dashboard</h2>
                    <p className="text-muted">Welcome to the Admin Command Center</p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon users">👤</div>
                        <div className="stat-info">
                            <h3>{stats.usersCount}</h3>
                            <p>Total Customers</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon owners">👨‍🍳</div>
                        <div className="stat-info">
                            <h3>{stats.ownersCount}</h3>
                            <p>Restaurant Owners</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon stores">🏪</div>
                        <div className="stat-info">
                            <h3>{stats.restaurantsCount}</h3>
                            <p>Total Restaurants</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon orders">📦</div>
                        <div className="stat-info">
                            <h3>{stats.ordersCount}</h3>
                            <p>Total Orders</p>
                        </div>
                    </div>
                    <div className="stat-card revenue">
                        <div className="stat-icon revenue-icon">💰</div>
                        <div className="stat-info">
                            <h3>₹{stats.totalRevenue.toLocaleString()}</h3>
                            <p>Total Revenue</p>
                        </div>
                    </div>
                </div>

                <div className="mt-5">
                    <h4>Quick Actions</h4>
                    <div className="d-flex gap-3 mt-3">
                        <button className="btn btn-outline-primary">Download Report</button>
                        <button className="btn btn-outline-success">Manage Promotions</button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
