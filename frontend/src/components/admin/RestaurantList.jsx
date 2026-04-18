import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import { BASE_URL } from '../../utils/api';
import toast from 'react-hot-toast';

const RestaurantList = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRestaurants = async () => {
        try {
            const res = await fetch(`${BASE_URL}/admin/restaurants`, { credentials: 'include' });
            const data = await res.json();
            if (data.success) setRestaurants(data.restaurants);
        } catch (err) {
            toast.error("Failed to load restaurants");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const toggleStatus = async (id) => {
        try {
            const res = await fetch(`${BASE_URL}/admin/restaurants/${id}/status`, {
                method: 'PATCH',
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Restaurant status updated`);
                fetchRestaurants();
            }
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    const deleteRestaurant = async (id) => {
        if (!window.confirm("CRITICAL WARNING: This will PERMANENTLY DELETE this restaurant and ALL its food items and order history. This action cannot be undone. Proceed?")) return;
        
        try {
            const res = await fetch(`${BASE_URL}/admin/restaurants/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Restaurant and all related data deleted permanently");
                fetchRestaurants();
            }
        } catch (err) {
            toast.error("Failed to delete restaurant");
        }
    };

    if (loading) return <div className="loader"></div>;

    return (
        <div className="admin-dashboard-container">
            <AdminSidebar />
            <main className="admin-main-content">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>Restaurant Management</h2>
                    <span className="badge bg-secondary">{restaurants.length} Registered Stores</span>
                </div>

                <div className="card border-0 shadow-sm">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th>Restaurant</th>
                                    <th>Owner</th>
                                    <th>Location</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {restaurants.map(res => (
                                    <tr key={res._id}>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <img 
                                                    src={res.images?.[0]?.url || "https://via.placeholder.com/50"} 
                                                    alt={res.name} 
                                                    className="rounded me-3"
                                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                />
                                                <div>
                                                    <div className="fw-bold">{res.name}</div>
                                                    <div className="text-muted small">{res.cuisines?.join(", ")}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="small fw-bold">{res.owner?.name || "N/A"}</div>
                                            <div className="text-muted extra-small">{res.owner?.email}</div>
                                        </td>
                                        <td className="small text-truncate" style={{ maxWidth: '200px' }}>{res.address}</td>
                                        <td>
                                            <span className={`badge ${res.isActive ? 'bg-success' : 'bg-danger'}`}>
                                                {res.isActive ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <button 
                                                    className={`btn btn-sm ${res.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                    onClick={() => toggleStatus(res._id)}
                                                    style={{ width: '130px' }}
                                                >
                                                    {res.isActive ? 'Deactivate' : 'Verify & Activate'}
                                                </button>
                                                <button 
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => deleteRestaurant(res._id)}
                                                    title="Permanent Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
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

export default RestaurantList;
