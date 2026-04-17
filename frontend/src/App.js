import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home'; // Import the new Home page
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import ForgotPassword from './pages/ForgotPassword';
import Menu from './components/Menu';
import Cart from './cart/Cart';
import OrderSuccess from './components/cart/OrderSuccess';
import Profile from './components/user/Profile';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        {/* Render the Routes outside of standard containers to let Home handle its own padding */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/password/forgot" element={<ForgotPassword />} />
          <Route path="/users/resetPassword/:token" element={<ResetPassword />} />
          <Route path="/restaurant/:id" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/success" element={<OrderSuccess />} />
          <Route path="/users/me" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;