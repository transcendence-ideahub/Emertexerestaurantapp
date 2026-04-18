import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Home from './pages/Home';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import ForgotPassword from './pages/ForgotPassword';
import Menu from './components/Menu';
import Cart from './cart/Cart';
import OrderSuccess from './components/cart/OrderSuccess';
import Profile from './components/user/Profile';
import UpdateProfile from './components/user/UpdateProfile';
import UpdatePassword from './components/user/UpdatePassword';
import ListOrders from './components/order/ListOrders';
import PartnerDashboard from './components/partner/PartnerDashboard';
import ProtectedRoute from './components/route/ProtectedRoute';
import AdminDashboard from './components/admin/AdminDashboard';
import UserList from './components/admin/UserList';
import RestaurantList from './components/admin/RestaurantList';
import OrderList from './components/admin/OrderList';
import DeliveryDashboard from './components/delivery/DeliveryDashboard';
import DeliveryLogin from './pages/DeliveryLogin';
import DeliveryRegister from './pages/DeliveryRegister';
import PartnerLogin from './pages/PartnerLogin';
import { BASE_URL } from './utils/api';

function App() {
  useEffect(() => {
    // Periodic update every 30 seconds to track activity while tab is open
    const interval = setInterval(() => {
      localStorage.setItem('lastActiveTime', Date.now().toString());
    }, 30000);

    // Update on tab close/unload
    const handleUnload = () => {
      localStorage.setItem('lastActiveTime', Date.now().toString());
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  return (
    <Router>
      <Toaster position="top-center" />
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/password/forgot" element={<ForgotPassword />} />
          <Route path="/password/reset" element={<ResetPassword />} />
          <Route path="/restaurant/:id" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/success" element={<OrderSuccess />} />
          <Route path="/users/me" element={<Profile />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/users/me/update" element={<UpdateProfile />} />
          <Route path="/users/password/update" element={<UpdatePassword />} />
          <Route path="/orders/me" element={<ListOrders />} />
          <Route path="/partner/dashboard" element={<PartnerDashboard />} />
          <Route path="/delivery/login" element={<DeliveryLogin />} />
          <Route path="/delivery/register" element={<DeliveryRegister />} />
          <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
          <Route path="/partner/login" element={<PartnerLogin />} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute isAdmin={true}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute isAdmin={true}><UserList /></ProtectedRoute>} />
          <Route path="/admin/restaurants" element={<ProtectedRoute isAdmin={true}><RestaurantList /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute isAdmin={true}><OrderList /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;