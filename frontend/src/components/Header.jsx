import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { BASE_URL } from '../utils/api';
import '../styles/Header.css';

const Header = () => {
  const { cartItems } = useSelector((state) => state.cart);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${BASE_URL}/users/me`, {
          method: 'GET',
          credentials: 'include'
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setIsAuthenticated(true);
          setUser(data.user);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Close dropdown on outside click
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${BASE_URL}/users/logout`, { method: 'GET', credentials: 'include' });
    } catch {}
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/';
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isOwner = user?.role === 'restaurant-owner';
  const isAdmin = user?.role === 'admin';

  return (
    <nav className="header-nav">
      <div className="header-inner">

        {/* Logo */}
        <Link to="/" className="header-logo">
          <img src="/image.png" alt="OrderEat Logo" className="logo-img" />
          <span className="logo-text">OrderEat</span>
        </Link>

        {/* Search Bar */}
        <form className="header-search" onSubmit={handleSearch}>
          <span className="search-icon-left">🔍</span>
          <input
            type="text"
            className="header-search-input"
            placeholder="Search for restaurants or food..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </form>

        {/* Right Actions */}
        <div className="header-actions">

          {/* Cart — hidden for restaurant owners */}
          {!isOwner && (
            <Link to="/cart" className="header-cart-btn">
              <span className="cart-icon">🛒</span>
              <span className="cart-label">Cart</span>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          )}

          {/* Auth Section */}
          {!loading && (
            isAuthenticated && user ? (
              <div className="header-user-menu" ref={dropdownRef}>
                <button
                  className="user-pill"
                  onClick={() => setDropdownOpen(prev => !prev)}
                >
                  <img
                    src={user?.avatar?.url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'U') + '&background=e67e22&color=fff'}
                    alt="avatar"
                    className="user-avatar"
                  />
                  <span className="user-name-text">{user?.name?.split(' ')[0]}</span>
                  <span className="dropdown-chevron">{dropdownOpen ? '▴' : '▾'}</span>
                </button>

                {dropdownOpen && (
                  <div className="user-dropdown">
                    {/* Admin Menu */}
                    {isAdmin ? (
                      <>
                        <div className="dropdown-header">
                          <span className="dropdown-role-badge admin" style={{ backgroundColor: '#e74c3c' }}>🛡️ Admin Panel</span>
                          <div className="dropdown-user-name">{user?.name}</div>
                          <div className="dropdown-user-email">{user?.email}</div>
                        </div>
                        <div className="dropdown-divider" />
                        <Link className="dropdown-link" to="/admin/dashboard" onClick={() => setDropdownOpen(false)}>
                          <span>📊</span> Admin Dashboard
                        </Link>
                        <Link className="dropdown-link" to="/admin/users" onClick={() => setDropdownOpen(false)}>
                          <span>👥</span> Manage Users
                        </Link>
                        <Link className="dropdown-link" to="/admin/restaurants" onClick={() => setDropdownOpen(false)}>
                          <span>🏪</span> Manage Restaurants
                        </Link>
                      </>
                    ) : isOwner ? (
                      <>
                        <div className="dropdown-header">
                          <span className="dropdown-role-badge owner">🏪 Restaurant Partner</span>
                          <div className="dropdown-user-name">{user?.name}</div>
                          <div className="dropdown-user-email">{user?.email}</div>
                        </div>
                        <div className="dropdown-divider" />
                        <Link className="dropdown-link" to="/partner/dashboard" onClick={() => setDropdownOpen(false)}>
                          <span>📊</span> Partner Dashboard
                        </Link>
                        <Link className="dropdown-link" to="/users/me/update" onClick={() => setDropdownOpen(false)}>
                          <span>✏️</span> Edit Profile
                        </Link>
                        <Link className="dropdown-link" to="/users/password/update" onClick={() => setDropdownOpen(false)}>
                          <span>🔒</span> Change Password
                        </Link>
                      </>
                    ) : (
                      <>
                        {/* Customer Menu */}
                        <div className="dropdown-header">
                          <span className="dropdown-role-badge customer">🛵 Customer</span>
                          <div className="dropdown-user-name">{user?.name}</div>
                          <div className="dropdown-user-email">{user?.email}</div>
                        </div>
                        <div className="dropdown-divider" />
                        <Link className="dropdown-link" to="/orders/me" onClick={() => setDropdownOpen(false)}>
                          <span>📋</span> My Orders
                        </Link>
                        <Link className="dropdown-link" to="/users/me" onClick={() => setDropdownOpen(false)}>
                          <span>👤</span> My Profile
                        </Link>
                        <Link className="dropdown-link" to="/users/me/update" onClick={() => setDropdownOpen(false)}>
                          <span>✏️</span> Edit Profile
                        </Link>
                        <Link className="dropdown-link" to="/users/password/update" onClick={() => setDropdownOpen(false)}>
                          <span>🔒</span> Change Password
                        </Link>
                        <Link className="dropdown-link" to="/cart" onClick={() => setDropdownOpen(false)}>
                          <span>🛒</span> My Cart {cartCount > 0 && <span className="cart-badge-sm">{cartCount}</span>}
                        </Link>
                      </>
                    )}
                    <div className="dropdown-divider" />
                    <button className="dropdown-link logout-link" onClick={handleLogout}>
                      <span>🚪</span> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="header-auth-btns">
                <Link to="/login" className="btn-login">Login</Link>
                <Link to="/register" className="btn-signup">Sign Up</Link>
              </div>
            )
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;