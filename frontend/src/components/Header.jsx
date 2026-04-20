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
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const searchContainerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      // === SESSION TIMEOUT CHECK ===
      const lastActive = localStorage.getItem('lastActiveTime');
      const now = Date.now();
      const TIMEOUT = 5 * 60 * 1000; // 5 minutes

      if (lastActive && (now - parseInt(lastActive)) > TIMEOUT) {
        console.log("Session timed out. Logging out...");
        try {
          await fetch(`${BASE_URL}/users/logout`, { 
            method: 'GET', 
            credentials: 'include' 
          });
        } catch (err) {
          console.error("Auto-logout fetch failed", err);
        }
        localStorage.removeItem('lastActiveTime');
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return; // Don't proceed to fetch profile
      }
      // ==============================

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

    // Re-check timeout when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUser();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Close suggestions/dropdown on outside click
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [navigate]); // Added navigate to satisfy linter if needed

  // Debounced Search Suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        fetchSuggestions();
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSuggestions = async () => {
    try {
      const res = await fetch(`${BASE_URL}/eats/stores/search?q=${searchQuery}`);
      const data = await res.json();
      if (data.success) {
        setSuggestions(data.results);
        setShowSuggestions(data.results.length > 0);
        setActiveIndex(-1);
      }
    } catch (err) {
      console.error("Fetch suggestions failed", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${BASE_URL}/users/logout`, { method: 'GET', credentials: 'include' });
    } catch (err) {
      console.error("Logout fetch failed", err);
    }
    
    // Clear local storage and state
    localStorage.removeItem('lastActiveTime');
    setIsAuthenticated(false);
    setUser(null);
    
    // Redirect to home and force a hard reload to clear any cached data
    window.location.href = '/';
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        e.preventDefault();
        handleSuggestionClick(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (item) => {
    setShowSuggestions(false);
    setSearchQuery('');
    if (item.type === 'restaurant') {
      navigate(`/restaurant/${item._id}`);
    } else {
      navigate(`/?search=${encodeURIComponent(item.name)}`);
    }
  };

  const isOwner = user?.role === 'restaurant-owner';
  const isAdmin = user?.role === 'admin';
  const isDelivery = user?.role === 'delivery';

  return (
    <nav className="header-nav">
      <div className="header-inner">

        {/* Logo */}
        <Link to="/" className="header-logo">
          <img src="/image.png" alt="OrderEat Logo" className="logo-img" />
          <span className="logo-text">Order<span className="logo-accent">Eat</span></span>
        </Link>

        {/* Search Bar */}
        <div className="header-search-container" ref={searchContainerRef}>
          <form className="header-search ai-search" onSubmit={handleSearch}>
            <span className="search-icon-left ai-sparkle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
            </span>
            <input
              type="text"
              className="header-search-input ai-input"
              placeholder="What are you craving today? ✨"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => searchQuery.trim().length > 1 && suggestions.length > 0 && setShowSuggestions(true)}
            />
            <div className="search-right-icons">
              {searchQuery ? (
                <button type="button" className="search-clear-btn" onClick={() => { setSearchQuery(''); setSuggestions([]); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              ) : (
                <button type="button" className="ai-voice-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                </button>
              )}
            </div>
          </form>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && (
            <div className="search-suggestions">
              {suggestions.map((item, index) => (
                <div
                  key={`${item.type}-${item._id}`}
                  className={`suggestion-item ${index === activeIndex ? 'active' : ''}`}
                  onClick={() => handleSuggestionClick(item)}
                >
                  <div className="suggestion-img-wrapper">
                    <img src={item.image || "https://via.placeholder.com/40"} alt={item.name} />
                  </div>
                  <div className="suggestion-details">
                    <div className="suggestion-name">{item.name}</div>
                    <div className="suggestion-info">
                      {item.type === 'restaurant' ? (
                        <span className="type-badge rest">Restaurant</span>
                      ) : (
                        <span className="type-badge dish">Dish</span>
                      )}
                      <span className="info-text">• {item.info}</span>
                      {item.rating > 0 && <span className="info-rating"> • ★ {item.rating.toFixed(1)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="header-actions">

          {/* Cart — hidden for restaurant owners and delivery partners */}
          {!isOwner && !isDelivery && (
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
                    ) : isDelivery ? (
                      <>
                        <div className="dropdown-header">
                          <span className="dropdown-role-badge delivery" style={{ backgroundColor: '#f39c12' }}>🛵 Delivery Partner</span>
                          <div className="dropdown-user-name">{user?.name}</div>
                          <div className="dropdown-user-email">{user?.email}</div>
                        </div>
                        <div className="dropdown-divider" />
                        <Link className="dropdown-link" to="/delivery/dashboard" onClick={() => setDropdownOpen(false)}>
                          <span>🗺️</span> Delivery Dashboard
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