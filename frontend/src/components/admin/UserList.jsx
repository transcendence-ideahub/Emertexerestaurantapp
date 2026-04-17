import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import { BASE_URL } from '../../utils/api';
import toast from 'react-hot-toast';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${BASE_URL}/admin/users`, { credentials: 'include' });
            const data = await res.json();
            if (data.success) setUsers(data.users);
        } catch (err) {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const deleteHandler = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        
        try {
            const res = await fetch(`${BASE_URL}/admin/users/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                toast.success("User deleted");
                fetchUsers();
            }
        } catch (err) {
            toast.error("Failed to delete user");
        }
    };

    const updateRole = async (id, newRole) => {
        try {
            const res = await fetch(`${BASE_URL}/admin/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`User role updated to ${newRole}`);
                fetchUsers();
            }
        } catch (err) {
            toast.error("Failed to update role");
        }
    };

    if (loading) return <div className="loader"></div>;

    return (
        <div className="admin-dashboard-container">
            <AdminSidebar />
            <main className="admin-main-content">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>User Management</h2>
                    <span className="badge bg-secondary">{users.length} Total Users</span>
                </div>

                <div className="card border-0 shadow-sm">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user._id}>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <div className="avatar-sm me-3 bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    {user.name.charAt(0)}
                                                </div>
                                                <span className="fw-bold">{user.name}</span>
                                            </div>
                                        </td>
                                        <td>{user.email}</td>
                                        <td>
                                            <select 
                                                className={`form-select form-select-sm border-0 ${user.role === 'admin' ? 'text-danger fw-bold' : user.role === 'restaurant-owner' ? 'text-primary' : ''}`}
                                                value={user.role}
                                                onChange={(e) => updateRole(user._id, e.target.value)}
                                                style={{ width: '150px' }}
                                            >
                                                <option value="user">Customer</option>
                                                <option value="restaurant-owner">Owner</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td className="text-muted small">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <button 
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() => deleteHandler(user._id)}
                                                disabled={user.role === 'admin'}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserList;
