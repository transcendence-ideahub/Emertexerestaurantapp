import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import { BASE_URL } from '../../utils/api';
import toast from 'react-hot-toast';

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${BASE_URL}/admin/orders`, { credentials: 'include' });
            const data = await res.json();
            if (data.success) setOrders(data.orders);
        } catch (err) {
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const getStatusBadge = (status) => {
        switch(status) {
            case 'Delivered': return 'bg-success';
            case 'Processing': return 'bg-info';
            case 'Preparing': return 'bg-warning';
            case 'Out for Delivery': return 'bg-primary';
            case 'Cancelled': return 'bg-danger';
            default: return 'bg-secondary';
        }
    };

    if (loading) return <div className="loader"></div>;

    return (
        <div className="admin-dashboard-container">
            <AdminSidebar />
            <main className="admin-main-content">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>Platform Orders</h2>
                    <span className="badge bg-secondary">{orders.length} Total Orders</span>
                </div>

                <div className="card border-0 shadow-sm">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Restaurant</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order._id}>
                                        <td className="small fw-bold">#{order._id.substring(18)}</td>
                                        <td>
                                            <div className="small fw-bold">{order.user?.name || "Deleted User"}</div>
                                            <div className="text-muted extra-small">{order.user?.email}</div>
                                        </td>
                                        <td>{order.restaurant?.name || "Unknown"}</td>
                                        <td><span className="fw-bold">₹{order.totalPrice}</span></td>
                                        <td>
                                            <span className={`badge ${getStatusBadge(order.orderStatus)}`}>
                                                {order.orderStatus}
                                            </span>
                                        </td>
                                        <td className="text-muted small">
                                            {new Date(order.createdAt).toLocaleDateString()}
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

export default OrderList;
