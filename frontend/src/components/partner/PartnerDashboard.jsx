import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { BASE_URL } from "../../utils/api";
import AddressAutocomplete from "../AddressAutocomplete";
import OrderTracker from "../order/OrderTracker";

const STATUS_FLOW = {
  Processing: "Preparing",
  Preparing: "Out for Delivery",
  "Out for Delivery": "Delivered",
};

const STATUS_BADGE = {
  Processing: { color: "#f39c12", icon: "🕐" },
  Preparing: { color: "#3498db", icon: "👨‍🍳" },
  "Out for Delivery": { color: "#9b59b6", icon: "🛵" },
  Delivered: { color: "#2ecc71", icon: "✅" },
  Cancelled: { color: "#e74c3c", icon: "❌" },
};

const CUISINE_TAGS = ['North Indian', 'South Indian', 'Chinese', 'Pizza', 'Biryani', 'Street Food', 'Desserts', 'Healthy', 'Bread', 'Fried Chicken', 'Other'];

const PartnerDashboard = () => {
  const [activeTab, setActiveTab] = useState("orders");
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // New food item form state
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    imageUrl: '',
    dishType: 'Veg',
    cuisines: ['Other']
  });
  const [addingItem, setAddingItem] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleGenerateAI = async (itemState, setItemState) => {
    if (!itemState.name) return toast.error("Please enter item name first");

    setIsGeneratingAI(true);
    try {
      const res = await fetch(`${BASE_URL}/ai/generate-description`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName: itemState.name, dishType: itemState.dishType }),
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setItemState(prev => ({ ...prev, description: data.description }));
        toast.success("✨ Description generated!");
      } else {
        toast.error(data.message || "Failed to generate AI description");
      }
    } catch {
      toast.error("Could not connect to AI service");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Edit restaurant form
  const [editMode, setEditMode] = useState(false);
  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
    address: "",
    location: { lat: null, lng: null },
    imageUrl: "",
    cuisines: "",
    costForTwo: "",
    deliveryTime: "",
    discount: "",
    discountPercentage: 0,
    maxDiscount: 0,
    minOrderValue: 0
  });

  const handleAddressSelect = (data) => {
    setRestaurantForm(prev => ({
      ...prev,
      address: data.address,
      location: { lat: data.lat, lng: data.lng }
    }));
  };

  const [isUpdatingRestaurant, setIsUpdatingRestaurant] = useState(false);

  // Menu item edit state
  const [editingItem, setEditingItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Load user info
        const userRes = await fetch(`${BASE_URL}/users/me`, { credentials: "include" });
        const userData = await userRes.json();
        if (!userRes.ok || !userData.success) {
          window.location.href = "/login";
          return;
        }
        if (userData.user.role !== "restaurant-owner") {
          window.location.href = "/users/me";
          return;
        }
        setUser(userData.user);

        // Load owner's restaurant via the dedicated owner-orders route
        // Also fetch owner orders
        const orderRes = await fetch(`${BASE_URL}/orders/owner/restaurant-orders`, { credentials: "include" });
        const orderData = await orderRes.json();
        if (orderRes.ok && orderData.success) {
          setOrders(orderData.orders || []);
          // Get restaurant from first order if available
          if (orderData.orders.length > 0 && orderData.orders[0].restaurant) {
            const rest = orderData.orders[0].restaurant;
            setRestaurant(rest);
            setRestaurantForm({
              name: rest.name || "",
              address: rest.address || "",
              imageUrl: rest.images?.[0]?.url || "",
              cuisines: rest.cuisines?.join(", ") || "",
              costForTwo: rest.costForTwo || "",
              deliveryTime: rest.deliveryTime || "",
              discount: rest.discount || ""
            });
          }
        }

        // Fetch restaurant separately for cases with no orders
        const restRes = await fetch(`${BASE_URL}/eats/stores/owner`, { credentials: "include" });
        if (restRes.ok) {
          const restData = await restRes.json();
          if (restData.success && restData.restaurant) {
            setRestaurant(restData.restaurant);
            setRestaurantForm({
              name: restData.restaurant.name,
              address: restData.restaurant.address,
              imageUrl: restData.restaurant.images?.[0]?.url || "",
              cuisines: restData.restaurant.cuisines?.join(", ") || "",
              costForTwo: restData.restaurant.costForTwo || "",
              deliveryTime: restData.restaurant.deliveryTime || "",
              discount: restData.restaurant.discount || "",
              discountPercentage: restData.restaurant.discountPercentage || 0,
              maxDiscount: restData.restaurant.maxDiscount || 0,
              minOrderValue: restData.restaurant.minOrderValue || 0,
              location: restData.restaurant.location?.coordinates ? {
                lng: restData.restaurant.location.coordinates[0],
                lat: restData.restaurant.location.coordinates[1]
              } : { lat: null, lng: null }
            });

            // Load menu items for this restaurant
            const menuRes = await fetch(`${BASE_URL}/eats/item/?restaurant=${restData.restaurant._id}`);
            const menuData = await menuRes.json();
            if (menuRes.ok) setMenuItems(menuData.foodItems || []);
          }
        }

      } catch (e) {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: data.order.orderStatus } : o));
        toast.success(`Order marked as ${data.order.orderStatus}`);
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch {
      toast.error("Connection error");
    }
  };

  const handleFileRead = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!restaurant?._id) return toast.error("No restaurant found");
    setAddingItem(true);
    try {
      const payload = { 
        ...newItem, 
        restaurant: restaurant._id
      };

      const res = await fetch(`${BASE_URL}/eats/item/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Item added to menu!");
        setMenuItems(prev => [data.foodItem, ...prev]);
        setNewItem({ name: "", price: "", description: "", stock: "", imageUrl: "", dishType: "Veg", cuisines: ["Other"] });
      } else {
        toast.error(data.message || "Failed to add item");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`${BASE_URL}/eats/item/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setMenuItems(prev => prev.filter(item => item._id !== id));
        toast.success("Item deleted successfully");
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to delete item");
      }
    } catch {
      toast.error("Connection error");
    }
  };

  const handleEditClick = (item) => {
    setEditingItem({ ...item });
    setShowEditModal(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      // If we have a new base64 image, we want to send it
      const payload = { ...editingItem };
      if (editingItem.newImageUrl) {
        payload.imageUrl = editingItem.newImageUrl;
        delete payload.newImageUrl;
      }

      const res = await fetch(`${BASE_URL}/eats/item/${editingItem._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setMenuItems(prev => prev.map(item => item._id === editingItem._id ? data.data : item));
        toast.success("Item updated successfully");
        setShowEditModal(false);
      } else {
        toast.error(data.message || "Failed to update item");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleShopStatus = async () => {
    if (!restaurant?._id) return;
    const newStatus = !restaurant.isActive;
    
    try {
      const res = await fetch(`${BASE_URL}/eats/stores/${restaurant._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRestaurant(data.restaurant);
        toast.success(`Shop is now ${newStatus ? "OPEN" : "CLOSED"}`);
      }
    } catch {
      toast.error("Failed to update shop status");
    }
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "70vh" }}>
      <div className="spinner-border" style={{ color: "#e67e22" }} />
    </div>
  );

  const activeOrders = orders.filter(o => o.orderStatus !== "Delivered" && o.orderStatus !== "Cancelled");
  const completedOrders = orders.filter(o => o.orderStatus === "Delivered");
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      {/* Top Hero Banner */}
      <div style={{ background: "linear-gradient(135deg, #e67e22, #d35400)", padding: "32px", color: "white" }}>
        <div className="container d-flex align-items-center gap-4">
          <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", border: "3px solid rgba(255,255,255,0.5)" }}>
            🏪
          </div>
          <div>
            <h2 className="fw-bold mb-0" style={{ fontSize: "1.8rem" }}>Partner Dashboard</h2>
            <div className="d-flex align-items-center gap-3 mt-1">
              <p className="mb-0 opacity-75">Welcome, {user?.name} · {restaurant?.name || "Your Restaurant"}</p>
              <div 
                onClick={toggleShopStatus}
                className={`px-3 py-1 rounded-pill border d-flex align-items-center gap-2 shadow-sm`}
                style={{ 
                  cursor: 'pointer', 
                  backgroundColor: restaurant?.isActive ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                  borderColor: restaurant?.isActive ? '#2ecc71' : '#e74c3c',
                  transition: 'all 0.3s ease'
                }}
              >
                <span style={{ fontSize: '10px' }}>{restaurant?.isActive ? "🟢" : "🔴"}</span>
                <span className="fw-bold" style={{ fontSize: '12px', color: restaurant?.isActive ? '#2ecc71' : '#e74c3c' }}>
                  {restaurant?.isActive ? "SHOP OPEN" : "SHOP CLOSED"}
                </span>
                <div className="form-check form-switch m-0" style={{ pointerEvents: 'none' }}>
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    checked={restaurant?.isActive || false} 
                    readOnly
                    style={{ width: '2em', height: '1em' }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="ms-auto d-flex gap-3">
            <div className="text-center bg-white bg-opacity-10 rounded-3 px-4 py-2">
              <div className="fw-bold fs-4">{activeOrders.length}</div>
              <div className="small opacity-75">Active Orders</div>
            </div>
            <div className="text-center bg-white bg-opacity-10 rounded-3 px-4 py-2">
              <div className="fw-bold fs-4">₹{totalRevenue.toFixed(0)}</div>
              <div className="small opacity-75">Revenue</div>
            </div>
            <div className="text-center bg-white bg-opacity-10 rounded-3 px-4 py-2">
              <div className="fw-bold fs-4">{menuItems.length}</div>
              <div className="small opacity-75">Menu Items</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ background: "white", borderBottom: "2px solid #f0f0f0", position: "sticky", top: "0", zIndex: 10 }}>
        <div className="container">
          <nav className="d-flex gap-1">
            {[
              { key: "orders", label: "📋 Live Orders", count: activeOrders.length },
              { key: "menu", label: "🍽️ Menu Manager" },
              { key: "details", label: "⚙️ Restaurant Details" },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="btn btn-sm px-4 py-3 rounded-0 position-relative fw-bold"
                style={{ borderBottom: activeTab === tab.key ? "3px solid #e67e22" : "3px solid transparent", color: activeTab === tab.key ? "#e67e22" : "#888", background: "none" }}>
                {tab.label}
                {tab.count > 0 && (
                  <span className="badge rounded-pill ms-1" style={{ backgroundColor: "#e67e22", fontSize: "10px" }}>{tab.count}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="container py-4">

        {/* === LIVE ORDERS TAB === */}
        {activeTab === "orders" && (
          <div>
            <h5 className="fw-bold mb-3" style={{ color: "#2c3e50" }}>Incoming & Active Orders</h5>
            {activeOrders.length === 0 ? (
              <div className="text-center py-5">
                <div style={{ fontSize: "56px" }}>🎉</div>
                <h5 className="mt-3 text-muted">No active orders right now</h5>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {activeOrders.map(order => {
                  const badge = STATUS_BADGE[order.orderStatus] || STATUS_BADGE.Processing;
                  const nextStatus = STATUS_FLOW[order.orderStatus];
                  return (
                    <div key={order._id} className="card border-0 shadow-sm" style={{ borderRadius: "14px" }}>
                      <div className="card-body p-4">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h6 className="fw-bold mb-0">{order.user?.name}</h6>
                            <small className="text-muted">{order.user?.email} · {order.user?.phoneNumber}</small>
                          </div>
                          <span className="badge fw-semibold px-3 py-2" style={{ backgroundColor: badge.color, color: "white", borderRadius: "20px" }}>
                            {badge.icon} {order.orderStatus}
                          </span>
                        </div>
                        <div className="mb-3 p-3 rounded" style={{ backgroundColor: "#f8f9fa" }}>
                          {order.orderItems.map((item, i) => (
                            <div key={i} className="d-flex justify-content-between small">
                              <span>{item.name} <span className="text-muted">×{item.quantity}</span></span>
                              <span className="fw-semibold">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                          <div className="border-top pt-2 mt-2 d-flex justify-content-between fw-bold">
                            <span>Total</span>
                            <span style={{ color: "#e67e22" }}>₹{order.totalPrice}</span>
                          </div>
                        </div>
                        
                        {/* Live Tracking for Owner */}
                        {order.orderStatus === "Out for Delivery" && (
                          <div className="mt-4 border-top pt-4">
                            <div className="d-flex align-items-center gap-2 mb-3">
                              <span className="badge bg-success" style={{ borderRadius: "50%", padding: "5px" }}> </span>
                              <h6 className="fw-bold mb-0" style={{ color: "#2ecc71" }}>Live Delivery Tracking</h6>
                            </div>
                            <OrderTracker order={order} />
                          </div>
                        )}
                        
                        <div className="d-flex justify-content-between align-items-center mt-3">
                          <small className="text-muted">📍 {order.shippingInfo?.address}, {order.shippingInfo?.city}</small>
                          <div className="d-flex gap-2">
                            {order.orderStatus !== "Cancelled" && order.orderStatus !== "Delivered" && (
                              <button className="btn btn-sm btn-outline-danger fw-bold px-3"
                                onClick={() => {
                                  if(window.confirm("Are you sure you want to decline this order? Stock will be restored.")) {
                                    updateStatus(order._id, "Cancelled");
                                  }
                                }}
                                style={{ borderRadius: "8px" }}>
                                Decline
                              </button>
                            )}
                            {nextStatus === "Delivered" ? (
                              <div className="d-flex flex-column align-items-end">
                                <span className="badge bg-warning text-dark px-3 py-2" style={{ borderRadius: "8px" }}>
                                  ⏳ Waiting for Delivery Partner
                                </span>
                                {order.deliveryOtp && (
                                  <small className="text-muted mt-1">OTP: {order.deliveryOtp}</small>
                                )}
                              </div>
                            ) : nextStatus ? (
                              <button className="btn btn-sm text-white fw-bold px-4"
                                onClick={() => updateStatus(order._id, nextStatus)}
                                style={{ backgroundColor: badge.color, borderRadius: "8px" }}>
                                Mark as {nextStatus} →
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {completedOrders.length > 0 && (
              <div className="mt-4">
                <h6 className="text-muted fw-bold">Completed Orders ({completedOrders.length})</h6>
                {completedOrders.slice(0, 5).map(order => (
                  <div key={order._id} className="card border-0 mb-2" style={{ borderRadius: "10px", opacity: 0.7 }}>
                    <div className="card-body py-2 px-4 d-flex justify-content-between align-items-center">
                      <span className="small fw-bold">{order.user?.name} — {order.orderItems.length} items</span>
                      <div className="d-flex align-items-center gap-3">
                        <span className="small text-muted">{new Date(order.deliveredAt).toLocaleDateString()}</span>
                        <span className="badge" style={{ backgroundColor: "#2ecc71", color: "white" }}>✅ Delivered</span>
                        <span className="fw-bold text-success">₹{order.totalPrice}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === MENU MANAGER TAB === */}
        {activeTab === "menu" && (
          <div>
            <h5 className="fw-bold mb-3" style={{ color: "#2c3e50" }}>Menu Manager</h5>

            {/* Add New Item Form */}
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "16px" }}>
              <div className="card-body p-4">
                <h6 className="fw-bold mb-3" style={{ color: "#e67e22" }}>➕ Add New Item</h6>
                <form onSubmit={handleAddItem}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Item Name</label>
                      <input className="form-control" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} required />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted">Price (₹)</label>
                      <input type="number" className="form-control" value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} required min="1" />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted">Stock</label>
                      <input type="number" className="form-control" value={newItem.stock} onChange={e => setNewItem(p => ({ ...p, stock: e.target.value }))} required min="0" />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label small fw-bold text-muted d-block">Dish Type</label>
                      <div className="d-flex gap-4 p-3 bg-light rounded border">
                        <div className="form-check">
                          <input className="form-check-input" type="radio" name="dishType" id="veg" value="Veg" checked={newItem.dishType === 'Veg'} onChange={e => setNewItem(p => ({ ...p, dishType: e.target.value }))} />
                          <label className="form-check-label fw-bold text-success" htmlFor="veg">🥬 Veg</label>
                        </div>
                        <div className="form-check">
                          <input className="form-check-input" type="radio" name="dishType" id="nonveg" value="Non-Veg" checked={newItem.dishType === 'Non-Veg'} onChange={e => setNewItem(p => ({ ...p, dishType: e.target.value }))} />
                          <label className="form-check-label fw-bold text-danger" htmlFor="nonveg">🍗 Non-Veg</label>
                        </div>
                        <div className="form-check">
                          <input className="form-check-input" type="radio" name="dishType" id="egg" value="Egg" checked={newItem.dishType === 'Egg'} onChange={e => setNewItem(p => ({ ...p, dishType: e.target.value }))} />
                          <label className="form-check-label fw-bold text-warning" htmlFor="egg">🥚 Egg</label>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label small fw-bold text-muted mb-0">Cuisine Tags (Select Multiple)</label>
                        <button 
                          type="button" 
                          className="btn btn-link btn-sm text-decoration-none p-0" 
                          style={{ fontSize: '11px' }}
                          onClick={() => setNewItem(p => ({ ...p, cuisines: [] }))}
                        >
                          🗑️ Clear All
                        </button>
                      </div>
                      <div className="d-flex flex-wrap gap-2 p-2 bg-light rounded border">
                        {(restaurant?.cuisines?.length > 0 ? restaurant.cuisines : CUISINE_TAGS).map(tag => {
                          const isSelected = newItem.cuisines.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline-secondary'}`}
                              style={{ borderRadius: '20px', fontSize: '11px' }}
                              onClick={() => {
                                setNewItem(p => ({
                                  ...p,
                                  cuisines: isSelected 
                                    ? p.cuisines.filter(t => t !== tag)
                                    : [...p.cuisines, tag]
                                }));
                              }}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label small fw-bold text-muted mb-0">Description</label>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary py-0"
                          style={{ fontSize: '11px', borderRadius: '20px' }}
                          onClick={() => handleGenerateAI(newItem, setNewItem)}
                          disabled={isGeneratingAI}
                        >
                          {isGeneratingAI ? '⌛ Generating...' : '✨ AI Generate'}
                        </button>
                      </div>
                      <textarea className="form-control" rows={2} value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} required />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted d-block">Dish Image (JPG, PNG, GIF)</label>
                      <div className="d-flex align-items-center gap-3">
                        <input type="file" accept="image/*" className="d-none" id="dish-upload"
                          onChange={async (e) => {
                            if (e.target.files?.[0]) {
                              const base64 = await handleFileRead(e.target.files[0]);
                              setNewItem(p => ({ ...p, imageUrl: base64 }));
                            }
                          }}
                        />
                        <label htmlFor="dish-upload" className="btn btn-outline-secondary btn-sm fw-bold">
                          {newItem.imageUrl ? "Change Image" : "📁 Choose File"}
                        </label>
                        {newItem.imageUrl && (
                          <div className="d-flex align-items-center gap-2">
                            <img src={newItem.imageUrl} alt="Preview" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px" }} />
                            <small className="text-success">Ready!</small>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-12">
                      <button type="submit" disabled={addingItem} className="btn text-white fw-bold" style={{ backgroundColor: "#e67e22", borderRadius: "10px" }}>
                        {addingItem ? "Adding..." : "Add to Menu"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Items List */}
            <h6 className="fw-bold text-muted mb-2">Current Menu ({menuItems.length} items)</h6>
            {menuItems.length === 0 ? (
              <p className="text-muted">No items yet — add your first dish above!</p>
            ) : (
              <div className="row g-3">
                {menuItems.map(item => (
                  <div key={item._id} className="col-md-4">
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "12px" }}>
                      <div className="card-body p-3">
                        <div className="d-flex gap-3 align-items-start mb-3">
                          {item.images?.[0]?.url && (
                            <img src={item.images[0].url} alt={item.name}
                              style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid #eee" }} />
                          )}
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start mb-1">
                              <h6 className="fw-bold mb-0">
                                {item.name}
                                <span className="ms-2" style={{ fontSize: "14px" }}>
                                  {item.dishType === "Veg" ? "🟢" : item.dishType === "Non-Veg" ? "🔴" : "🟡"}
                                </span>
                              </h6>
                              <div className="d-flex gap-2">
                                <button onClick={() => handleEditClick(item)} className="btn btn-sm p-0 text-primary" title="Edit Item">
                                  <i className="fa fa-pencil"></i>
                                </button>
                                <button onClick={() => handleDeleteItem(item._id)} className="btn btn-sm p-0 text-danger" title="Delete Item">
                                  <i className="fa fa-trash"></i>
                                </button>
                              </div>
                            </div>
                            <p className="text-muted small mb-0" style={{ lineHeight: "1.4", height: "40px", overflow: "hidden" }}>{item.description}</p>
                            <div className="mt-2 d-flex flex-wrap gap-1">
                              {(item.cuisines || ['Other']).map(c => (
                                <span key={c} className="badge bg-light text-dark border" style={{ fontSize: "10px" }}>🏷️ {c}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold" style={{ color: "#e67e22" }}>₹{item.price}</span>
                          <span className={`badge ${item.stock > 0 ? "bg-success" : "bg-danger"}`}>
                            {item.stock > 0 ? `Stock: ${item.stock}` : "Out of stock"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === RESTAURANT DETAILS TAB === */}
        {activeTab === "details" && (
          <div style={{ maxWidth: "600px" }}>
            <h5 className="fw-bold mb-4" style={{ color: "#2c3e50" }}>Restaurant Details</h5>
            <div className="card border-0 shadow-sm" style={{ borderRadius: "16px" }}>
              <div className="card-body p-4">
                {!editMode ? (
                  <div>
                    {restaurant?.images?.[0]?.url && (
                      <div className="mb-4 text-center">
                        <img src={restaurant.images[0].url} alt="Banner" style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "12px" }} />
                      </div>
                    )}
                    <div className="mb-4">
                      <label className="text-muted small fw-bold text-uppercase">Restaurant Name</label>
                      <h5 className="fw-bold">{restaurant?.name || "—"}</h5>
                    </div>
                    <div className="mb-4">
                      <label className="text-muted small fw-bold text-uppercase">Address</label>
                      <h5 className="fw-bold">{restaurant?.address || "—"}</h5>
                    </div>
                    <div className="row mb-4">
                      <div className="col-6">
                        <label className="text-muted small fw-bold text-uppercase">Cuisines</label>
                        <h6 className="fw-bold text-dark">{restaurant?.cuisines?.join(", ") || "—"}</h6>
                      </div>
                      <div className="col-6">
                        <label className="text-muted small fw-bold text-uppercase">Cost for Two</label>
                        <h6 className="fw-bold text-dark">₹{restaurant?.costForTwo || "—"}</h6>
                      </div>
                    </div>
                    <div className="row mb-4">
                      <div className="col-6">
                        <label className="text-muted small fw-bold text-uppercase">Delivery Time</label>
                        <h6 className="fw-bold text-dark">{restaurant?.deliveryTime || "—"} mins</h6>
                      </div>
                      <div className="col-6">
                        <label className="text-muted small fw-bold text-uppercase">Active Offers</label>
                        <h6 className="fw-bold text-danger">{restaurant?.discount || "No active offers"}</h6>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="text-muted small fw-bold text-uppercase">Status</label>
                      <div><span className="badge bg-success px-3 py-2">Active</span></div>
                    </div>
                    <hr />
                    <div className="mb-4">
                      <label className="text-muted small fw-bold text-uppercase">Owner (You)</label>
                      <h5 className="fw-bold">{user?.name}</h5>
                      <small className="text-muted">{user?.email} · {user?.phoneNumber}</small>
                    </div>
                    <div className="d-flex gap-3 mt-3">
                      <button className="btn text-white fw-bold" onClick={() => setEditMode(true)}
                        style={{ backgroundColor: "#e67e22", borderRadius: "10px" }}>
                        Edit Details
                      </button>
                      <Link to="/users/me/update" className="btn fw-bold"
                        style={{ border: "2px solid #e67e22", color: "#e67e22", borderRadius: "10px" }}>
                        Edit My Profile
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setIsUpdatingRestaurant(true);
                    try {
                      // Convert cuisines back to array
                      const payload = {
                        ...restaurantForm,
                        cuisines: restaurantForm.cuisines.split(",").map(c => c.trim()).filter(c => c)
                      };

                      const res = await fetch(`${BASE_URL}/eats/stores/${restaurant._id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                        credentials: "include",
                      });
                      const data = await res.json();
                      if (res.ok && data.success) {
                        toast.success("Restaurant details saved!");
                        setRestaurant(data.restaurant);
                        setEditMode(false);
                      } else {
                        toast.error(data.message || "Failed to save details");
                      }
                    } catch {
                      toast.error("Connection error");
                    } finally {
                      setIsUpdatingRestaurant(false);
                    }
                  }}>
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-muted">Restaurant Name</label>
                      <input className="form-control py-2" value={restaurantForm.name} onChange={e => setRestaurantForm(p => ({ ...p, name: e.target.value }))} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-muted">Address</label>
                      <AddressAutocomplete
                        placeholder="Search for your restaurant location..."
                        onAddressSelect={handleAddressSelect}
                        initialValue={restaurantForm.address}
                      />
                    </div>
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label fw-bold small text-muted mb-0">Restaurant Cuisines (Centralized List)</label>
                        <small className="text-muted" style={{ fontSize: '10px' }}>These will be available for your dishes</small>
                      </div>
                      <div className="d-flex flex-wrap gap-2 p-2 bg-light rounded border mb-2">
                        {(restaurantForm.cuisines || "").split(",").map(c => c.trim()).filter(c => c).map(tag => (
                          <div key={tag} className="badge bg-primary d-flex align-items-center gap-2 p-2" style={{ borderRadius: '20px', fontSize: '11px' }}>
                            {tag}
                            <span 
                              style={{ cursor: 'pointer' }} 
                              onClick={() => {
                                const current = restaurantForm.cuisines.split(",").map(c => c.trim()).filter(c => c);
                                setRestaurantForm(p => ({ ...p, cuisines: current.filter(t => t !== tag).join(", ") }));
                              }}
                            >
                              ✕
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="input-group input-group-sm">
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Add new tag (e.g. Italian)" 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = e.target.value.trim();
                              if (val) {
                                const current = restaurantForm.cuisines.split(",").map(c => c.trim()).filter(c => c);
                                if (!current.includes(val)) {
                                  setRestaurantForm(p => ({ ...p, cuisines: [...current, val].join(", ") }));
                                }
                                e.target.value = '';
                              }
                            }
                          }}
                        />
                        <button 
                          className="btn btn-outline-primary" 
                          type="button"
                          onClick={(e) => {
                            const input = e.target.previousSibling;
                            const val = input.value.trim();
                            if (val) {
                              const current = restaurantForm.cuisines.split(",").map(c => c.trim()).filter(c => c);
                              if (!current.includes(val)) {
                                setRestaurantForm(p => ({ ...p, cuisines: [...current, val].join(", ") }));
                              }
                              input.value = '';
                            }
                          }}
                        >
                          Add
                        </button>
                      </div>
                      <div className="mt-2 d-flex flex-wrap gap-1">
                        <small className="text-muted d-block w-100 mb-1" style={{ fontSize: '10px' }}>Quick Add Recommended:</small>
                        {CUISINE_TAGS.filter(t => t !== 'Other').map(t => (
                          <button 
                            key={t}
                            type="button" 
                            className="btn btn-outline-secondary py-0 px-2" 
                            style={{ fontSize: '10px', borderRadius: '10px' }}
                            onClick={() => {
                              const current = restaurantForm.cuisines.split(",").map(c => c.trim()).filter(c => c);
                              if (!current.includes(t)) {
                                setRestaurantForm(p => ({ ...p, cuisines: [...current, t].join(", ") }));
                              }
                            }}
                          >
                            + {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-6">
                        <label className="form-label fw-bold small text-muted">Cost for Two (₹)</label>
                        <input type="number" className="form-control py-2" value={restaurantForm.costForTwo} onChange={e => setRestaurantForm(p => ({ ...p, costForTwo: e.target.value }))} />
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-bold small text-muted">Delivery Time (mins)</label>
                        <input type="number" className="form-control py-2" value={restaurantForm.deliveryTime} onChange={e => setRestaurantForm(p => ({ ...p, deliveryTime: e.target.value }))} />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-muted">Discount Label (Displayed to users)</label>
                      <input className="form-control py-2" value={restaurantForm.discount} onChange={e => setRestaurantForm(p => ({ ...p, discount: e.target.value }))} placeholder="e.g. 50% OFF up to ₹100" />
                    </div>
                    <div className="row mb-3">
                      <div className="col-4">
                        <label className="form-label fw-bold small text-muted">Discount %</label>
                        <input type="number" className="form-control py-2" value={restaurantForm.discountPercentage} onChange={e => setRestaurantForm(p => ({ ...p, discountPercentage: e.target.value }))} placeholder="50" />
                      </div>
                      <div className="col-4">
                        <label className="form-label fw-bold small text-muted">Max Off (₹)</label>
                        <input type="number" className="form-control py-2" value={restaurantForm.maxDiscount} onChange={e => setRestaurantForm(p => ({ ...p, maxDiscount: e.target.value }))} placeholder="100" />
                      </div>
                      <div className="col-4">
                        <label className="form-label fw-bold small text-muted">Min Order (₹)</label>
                        <input type="number" className="form-control py-2" value={restaurantForm.minOrderValue} onChange={e => setRestaurantForm(p => ({ ...p, minOrderValue: e.target.value }))} placeholder="200" />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-bold small text-muted d-block">Restaurant Banner (GIF/Image)</label>
                      <div className="d-flex align-items-center gap-3 mb-2">
                        <input type="file" accept="image/*" className="d-none" id="banner-upload"
                          onChange={async (e) => {
                            if (e.target.files?.[0]) {
                              const base64 = await handleFileRead(e.target.files[0]);
                              setRestaurantForm(p => ({ ...p, imageUrl: base64 }));
                            }
                          }}
                        />
                        <label htmlFor="banner-upload" className="btn btn-outline-warning text-dark btn-sm fw-bold">
                          {restaurantForm.imageUrl ? "Replace Banner" : "📁 Upload GIF or Image"}
                        </label>
                        <small className="text-muted">Max 10MB</small>
                      </div>

                      {restaurantForm.imageUrl && (
                        <div className="mt-2 text-center">
                          <small className="text-muted d-block mb-1">Preview:</small>
                          <img src={restaurantForm.imageUrl} alt="Preview" style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1px solid #ddd" }} />
                        </div>
                      )}

                      <div className="mt-3">
                        <label className="form-label fw-bold small text-muted opacity-50">Or Or Paste Image URL</label>
                        <input className="form-control form-control-sm" value={restaurantForm.imageUrl.startsWith("data:") ? "" : restaurantForm.imageUrl}
                          onChange={e => setRestaurantForm(p => ({ ...p, imageUrl: e.target.value }))} placeholder="https://example.com/banner.jpg" />
                      </div>
                    </div>
                    <div className="d-flex gap-3">
                      <button type="submit" disabled={isUpdatingRestaurant} className="btn text-white fw-bold" style={{ backgroundColor: "#2ecc71", borderRadius: "10px" }}>
                        {isUpdatingRestaurant ? "Saving..." : "Save Changes"}
                      </button>
                      <button type="button" className="btn fw-bold text-muted" onClick={() => setEditMode(false)}>Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow" style={{ borderRadius: "16px" }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Edit Menu Item</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleUpdateSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Item Name</label>
                    <input className="form-control" value={editingItem.name}
                      onChange={e => setEditingItem(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-bold text-muted">Price (₹)</label>
                      <input type="number" className="form-control" value={editingItem.price}
                        onChange={e => setEditingItem(p => ({ ...p, price: e.target.value }))} required min="1" />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold text-muted">Stock</label>
                      <input type="number" className="form-control" value={editingItem.stock}
                        onChange={e => setEditingItem(p => ({ ...p, stock: e.target.value }))} required min="0" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label small fw-bold text-muted mb-0">Description</label>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary py-0"
                        style={{ fontSize: '11px', borderRadius: '20px' }}
                        onClick={() => handleGenerateAI(editingItem, setEditingItem)}
                        disabled={isGeneratingAI}
                      >
                        {isGeneratingAI ? '⌛ Generating...' : '✨ AI Generate'}
                      </button>
                    </div>
                    <textarea className="form-control" rows={3} value={editingItem.description}
                      onChange={e => setEditingItem(p => ({ ...p, description: e.target.value }))} required />
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label small fw-bold text-muted mb-0">Cuisine Tags (Select Multiple)</label>
                      <button 
                        type="button" 
                        className="btn btn-link btn-sm text-decoration-none p-0" 
                        style={{ fontSize: '11px' }}
                        onClick={() => setEditingItem(p => ({ ...p, cuisines: [] }))}
                      >
                        🗑️ Clear All
                      </button>
                    </div>
                    <div className="d-flex flex-wrap gap-2 p-2 bg-light rounded border">
                      {(restaurant?.cuisines?.length > 0 ? restaurant.cuisines : CUISINE_TAGS).map(tag => {
                        const isSelected = (editingItem.cuisines || []).includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline-secondary'}`}
                            style={{ borderRadius: '20px', fontSize: '11px' }}
                            onClick={() => {
                              setEditingItem(p => ({
                                ...p,
                                cuisines: isSelected 
                                  ? (p.cuisines || []).filter(t => t !== tag)
                                  : [...(p.cuisines || []), tag]
                              }));
                            }}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted d-block">Dish Type</label>
                    <div className="d-flex gap-4 p-2 bg-light rounded border">
                      <div className="form-check">
                        <input className="form-check-input" type="radio" name="editDishType" id="editVeg" value="Veg" checked={editingItem.dishType === 'Veg'} onChange={e => setEditingItem(p => ({ ...p, dishType: e.target.value }))} />
                        <label className="form-check-label small fw-bold text-success" htmlFor="editVeg">Veg</label>
                      </div>
                      <div className="form-check">
                        <input className="form-check-input" type="radio" name="editDishType" id="editNonveg" value="Non-Veg" checked={editingItem.dishType === 'Non-Veg'} onChange={e => setEditingItem(p => ({ ...p, dishType: e.target.value }))} />
                        <label className="form-check-label small fw-bold text-danger" htmlFor="editNonveg">Non-Veg</label>
                      </div>
                      <div className="form-check">
                        <input className="form-check-input" type="radio" name="editDishType" id="editEgg" value="Egg" checked={editingItem.dishType === 'Egg'} onChange={e => setEditingItem(p => ({ ...p, dishType: e.target.value }))} />
                        <label className="form-check-label small fw-bold text-warning" htmlFor="editEgg">Egg</label>
                      </div>
                    </div>
                  </div>
                  <div className="mb-0">
                    <label className="form-label small fw-bold text-muted d-block">Dish Image</label>
                    <div className="d-flex align-items-center gap-3">
                      <input type="file" accept="image/*" className="d-none" id="edit-dish-upload"
                        onChange={async (e) => {
                          if (e.target.files?.[0]) {
                            const base64 = await handleFileRead(e.target.files[0]);
                            setEditingItem(p => ({ ...p, newImageUrl: base64 }));
                          }
                        }}
                      />
                      <label htmlFor="edit-dish-upload" className="btn btn-outline-secondary btn-sm fw-bold">
                        📁 Update Photo
                      </label>
                      {(editingItem.newImageUrl || editingItem.images?.[0]?.url) && (
                        <img src={editingItem.newImageUrl || editingItem.images[0].url} alt="Preview" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px" }} />
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light fw-bold" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" disabled={isUpdating} className="btn text-white fw-bold px-4" style={{ backgroundColor: "#e67e22", borderRadius: "8px" }}>
                    {isUpdating ? "Updating..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerDashboard;
