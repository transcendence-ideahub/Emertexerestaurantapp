import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BASE_URL } from '../utils/api'; // Importing the central backend URL
import '../styles/Header.css';

const Header = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false); 
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Using the BASE_URL from api.js
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
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      // Using the BASE_URL from api.js
      await fetch(`${BASE_URL}/users/logout`, {
        method: 'GET',
        credentials: 'include'
      });
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg">
      <div className="container-fluid">
        
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand">
          <img src="/image.png" alt="OrderEat Logo" className="logo-img" />
        </Link>

        {/* Search Bar */}
        <div className="mx-auto" style={{width: '40%'}}>
          <div className="input-group">
            <input
              type="text"
              className="form-control rounded-pill bg-light border-0"
              placeholder="Search for restaurants..."
            />
          </div>
        </div>

        {/* Navigation Right Side */}
        <div className="d-flex align-items-center">
          <Link to="/cart" className="text-dark text-decoration-none me-4">
            Cart <span className="badge bg-orange" style={{backgroundColor: '#e67e22'}}>0</span>
          </Link>

          {!loading && (
            isAuthenticated && user ? (
              <div className="dropdown">
                <button 
                  className="btn dropdown-toggle d-flex align-items-center" 
                  type="button" 
                  id="userMenu" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                  style={{border: 'none'}}
                >
                  <img 
                    src={user?.avatar?.url || "https://via.placeholder.com/150"} 
                    alt="User" 
                    className="rounded-circle me-2" 
                    style={{width: '35px', height: '35px'}} 
                  />
                  <span>{user?.name}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow border-0" aria-labelledby="userMenu">
                  <li><Link className="dropdown-item" to="/orders">Orders</Link></li>
                  <li><Link className="dropdown-item" to="/profile">Profile</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <Link to="/login" className="btn btn-warning rounded-pill px-4">
                Login
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;