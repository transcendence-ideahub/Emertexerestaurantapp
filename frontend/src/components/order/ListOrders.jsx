import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BASE_URL } from "../../utils/api";
import OrderTracker from "./OrderTracker";

const STATUS_CONFIG = {
  Processing:       { color: "#f39c12", bg: "#fff8e1", icon: "🕐" },
  Preparing:        { color: "#3498db", bg: "#e8f4ff", icon: "👨‍🍳" },
  "Out for Delivery":{ color: "#9b59b6", bg: "#f5eeff", icon: "🛵" },
  Delivered:        { color: "#2ecc71", bg: "#eafaf1", icon: "✅" },
  Cancelled:        { color: "#e74c3c", bg: "#fdeaea", icon: "❌" },
};

const ListOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleRateItem = async (foodId, rating, comment = "Good food!") => {
    try {
      const res = await fetch(`${BASE_URL}/eats/item/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodId, rating, comment }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        alert("Thank you for your rating!");
      }
    } catch (err) {
      console.error("Failed to submit rating", err);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${BASE_URL}/orders/me`, { credentials: "include" });
        const data = await res.json();
        if (res.ok && data.success) {
          setOrders(data.orders);
        } else {
          setError(data.message || "Failed to load orders");
        }
      } catch {
        setError("Could not connect to server");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // High-frequency polling for live delivery tracking
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
      <div className="spinner-border" style={{ color: "#e67e22" }} role="status" />
    </div>
  );

  if (error) return (
    <div className="container mt-5 text-center">
      <div style={{ fontSize: "48px" }}>😕</div>
      <h4 className="mt-3 text-muted">{error}</h4>
      <Link to="/login" className="btn mt-3" style={{ backgroundColor: "#e67e22", color: "white", borderRadius: "10px" }}>Login</Link>
    </div>
  );

  if (orders.length === 0) return (
    <div className="container mt-5 text-center">
      <div style={{ fontSize: "64px" }}>🍽️</div>
      <h3 className="mt-3 fw-bold" style={{ color: "#2c3e50" }}>No orders yet!</h3>
      <p className="text-muted">Looks like you haven't placed any orders. Go explore our restaurants!</p>
      <Link to="/" className="btn mt-3 text-white fw-bold px-5" style={{ backgroundColor: "#e67e22", borderRadius: "12px" }}>
        Explore Restaurants
      </Link>
    </div>
  );

  return (
    <div className="container mt-5 mb-5" style={{ maxWidth: "850px" }}>
      <h2 className="fw-bold mb-1" style={{ color: "#2c3e50" }}>My Orders</h2>
      <p className="text-muted mb-4">{orders.length} order{orders.length !== 1 ? "s" : ""} found</p>

      <div className="d-flex flex-column gap-4">
        {orders.map(order => {
          const status = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.Processing;
          return (
            <div key={order._id} className="card border-0 shadow-sm" style={{ borderRadius: "16px", overflow: "hidden" }}>
              {/* Header Bar */}
              <div className="d-flex justify-content-between align-items-center px-4 py-3"
                style={{ backgroundColor: status.bg, borderBottom: `3px solid ${status.color}` }}>
                <div>
                  <span className="fw-bold" style={{ color: "#2c3e50" }}>
                    {order.restaurant?.name || "Restaurant"}
                  </span>
                  <span className="ms-2 text-muted small">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <span className="badge fw-semibold px-3 py-2" style={{ backgroundColor: status.color, color: "white", borderRadius: "20px" }}>
                  {status.icon} {order.orderStatus}
                </span>
              </div>

              {/* Order Items */}
              <div className="card-body px-4 py-3">
                <div className="mb-3">
                  {order.orderItems.map((item, i) => (
                    <div key={i} className="py-2"
                      style={{ borderBottom: i < order.orderItems.length - 1 ? "1px dashed #eee" : "none" }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted">
                          <span className="fw-bold text-dark">{item.name}</span>
                          <span className="ms-2 badge bg-light text-dark">×{item.quantity}</span>
                        </span>
                        <span className="fw-semibold" style={{ color: "#2c3e50" }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      
                      {/* Rating Option for Delivered Orders */}
                      {order.orderStatus === "Delivered" && (
                        <div className="mt-2 d-flex align-items-center gap-2">
                          <span className="small text-muted">Rate this:</span>
                          {[1, 2, 3, 4, 5].map(star => (
                            <button 
                              key={star} 
                              className="btn btn-sm p-0 border-0" 
                              onClick={() => handleRateItem(item.food, star)}
                              style={{ color: "#f39c12", fontSize: "16px" }}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Price Summary */}
                <div className="d-flex justify-content-between pt-2 border-top">
                  <div className="text-muted small">
                    <span className="me-3">Items: ₹{order.itemsPrice}</span>
                    <span className="me-3">Delivery: ₹{order.deliveryPrice}</span>
                    <span>Tax: ₹{order.taxPrice}</span>
                  </div>
                  <div className="fw-bold fs-6" style={{ color: "#e67e22" }}>
                    Total: ₹{order.totalPrice}
                  </div>
                </div>

                {/* Shipping */}
                <div className="mt-2 small text-muted">
                  📍 {order.shippingInfo?.address}, {order.shippingInfo?.city}
                  &nbsp;·&nbsp; 📞 {order.shippingInfo?.phoneNumber}
                </div>

                {/* Real-time Tracking Map */}
                {(order.orderStatus !== "Delivered" && order.orderStatus !== "Cancelled") && (
                  <OrderTracker order={order} />
                )}
                
                {order.orderStatus === "Delivered" && (
                  <div className="mt-3 p-2 rounded text-center small" style={{ backgroundColor: "#f8f9fa", border: "1px dashed #ccc" }}>
                    📦 Your order was delivered. We hope you enjoyed it!
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListOrders;
