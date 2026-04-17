import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BASE_URL } from '../utils/api';
import '../styles/Home.css';

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // New auth state

  useEffect(() => {
    // 1. Fetch Restaurants
    const fetchRestaurants = async () => {
      try {
        const response = await fetch(`${BASE_URL}/eats/stores`);
        const data = await response.json();
        if (response.ok && data.success) {
          setRestaurants(data.restaurants || data.stores || []);
        } else {
          toast.error('Failed to fetch restaurants');
        }
      } catch (err) {
        toast.error('Network error. Is your backend running?');
      } finally {
        setLoading(false);
      }
    };

    // 2. Check if user is logged in (so we know where to send them when they click a card)
    const checkAuth = async () => {
      try {
        const response = await fetch(`${BASE_URL}/users/me`, { credentials: 'include' });
        if (response.ok) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    fetchRestaurants();
    checkAuth();
  }, []);

  return (
    <div className="home-container">
      <section className="hero-section">
        <h1 className="hero-title">Delicious food, delivered to you</h1>
        <p className="hero-subtitle">Explore the best restaurants in your city</p>
      </section>

      <section className="restaurants-section">
        <h2 className="section-heading">Top Restaurants</h2>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner-border text-warning" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Finding the best food...</p>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="alert alert-info text-center">
            No restaurants found in your area right now.
          </div>
        ) : (
          <div className="restaurant-grid">
            {restaurants.map((restaurant) => (
              <div key={restaurant._id} className="restaurant-card">
                <div className="card-img-wrapper">
                  <img
                    src={restaurant.images?.[0]?.url || "https://via.placeholder.com/400x250?text=No+Image"}
                    alt={restaurant.name}
                    className="card-img"
                  />
                  {restaurant.isVeg && <span className="badge-veg">Pure Veg</span>}
                </div>

                <div className="card-body">
                  <h3 className="card-title">{restaurant.name}</h3>
                  <p className="card-address">
                    <i className="fa fa-map-marker text-muted me-1"></i> 
                    {restaurant.address}
                  </p>

                  <div className="ratings-container">
                    <div className="rating-outer">
                      <div 
                        className="rating-inner" 
                        style={{ width: `${(restaurant.ratings / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="reviews-count">({restaurant.numOfReviews} Reviews)</span>
                  </div>

                  {/* DYNAMIC LINK LOGIC: Routes to login first if not authenticated */}
                  <Link 
                    to={isAuthenticated ? `/restaurant/${restaurant._id}` : `/login?redirect=/restaurant/${restaurant._id}`} 
                    className="btn btn-block view-menu-btn"
                  >
                    View Menu
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;