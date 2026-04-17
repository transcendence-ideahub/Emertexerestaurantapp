import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addItemToCart } from '../actions/cartActions';
import { BASE_URL } from '../utils/api';
import '../styles/Home.css';

const CUISINE_FILTERS = ['All', 'North Indian', 'South Indian', 'Chinese', 'Pizza', 'Biryani', 'Street Food', 'Desserts', 'Healthy'];
const SORT_OPTIONS = ['Relevance', 'Rating', 'Delivery Time'];

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [discoveryItems, setDiscoveryItems] = useState([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCuisine, setActiveCuisine] = useState('All');
  const [activeSort, setActiveSort] = useState('Relevance');
  const [activeFilter, setActiveFilter] = useState(null); // 'Pure Veg' etc.
  
  const dispatch = useDispatch();

  const [userLocation, setUserLocation] = useState(null);
  const location = useLocation();
  const searchQuery = new URLSearchParams(location.search).get('search') || '';

  const fetchRestaurants = useCallback(async (keyword = '', lat = null, lng = null) => {
    setLoading(true);
    try {
      let url = `${BASE_URL}/eats/stores`;
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (lat && lng) {
        params.append('lat', lat);
        params.append('lng', lng);
      }
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setRestaurants(data.restaurants || []);
        setFilteredRestaurants(data.restaurants || []);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  const fetchDiscoveryItems = useCallback(async (cuisine = 'All', filter = null, search = '') => {
    setDiscoveryLoading(true);
    try {
      let url = `${BASE_URL}/eats/item/discovery`;
      const params = new URLSearchParams();
      if (cuisine && cuisine !== 'All') params.append('cuisine', cuisine);
      if (filter) params.append('dishType', filter);
      if (search) params.append('search', search);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setDiscoveryItems(data.foodItems || []);
      }
    } catch (error) {
      console.error("Discovery fetch failed", error);
    } finally {
      setDiscoveryLoading(false);
    }
  }, []);

  useEffect(() => {
    // Get user location for real distance/relevance
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        fetchRestaurants(searchQuery, latitude, longitude);
      }, () => {
        // Fallback if location denied
        fetchRestaurants(searchQuery);
      });
    } else {
      fetchRestaurants(searchQuery);
    }

    const checkAuth = async () => {
      try {
        const res = await fetch(`${BASE_URL}/users/me`, { credentials: 'include' });
        setIsAuthenticated(res.ok);
      } catch { setIsAuthenticated(false); }
    };
    checkAuth();
  }, [searchQuery, fetchRestaurants]);

  // Fetch discovery items when filters or search change
  useEffect(() => {
    fetchDiscoveryItems(activeCuisine, activeFilter, searchQuery);
  }, [activeCuisine, activeFilter, searchQuery, fetchDiscoveryItems]);

  // Client-side filter+sort
  useEffect(() => {
    let result = [...restaurants];
    
    // 1. Filtering
    if (activeFilter === 'Pure Veg') result = result.filter(r => r.isVeg);
    if (activeFilter === 'Non-Veg') result = result.filter(r => r.hasNonVeg);
    if (activeFilter === 'Egg') result = result.filter(r => r.hasEgg);
    if (activeFilter === 'Rating 4.0+') result = result.filter(r => r.ratings >= 4.0);

    // 2. Sorting
    if (activeSort === 'Rating') {
      // High to low rating
      result.sort((a, b) => b.ratings - a.ratings);
    } else if (activeSort === 'Delivery Time') {
      // Low to high delivery time
      result.sort((a, b) => (a.deliveryTime || 45) - (b.deliveryTime || 45));
    } else if (activeSort === 'Relevance') {
      // Weighted score: Rating (60%) + Distance (40%)
      // Lower distance is better, so we use (MaxDistance - Distance)
      const maxDist = Math.max(...result.map(r => r.distance || 5), 10);
      result.sort((a, b) => {
        const scoreA = (a.ratings * 0.6) + ((maxDist - (a.distance || 5)) / maxDist * 5 * 0.4);
        const scoreB = (b.ratings * 0.6) + ((maxDist - (b.distance || 5)) / maxDist * 5 * 0.4);
        return scoreB - scoreA;
      });
    }

    setFilteredRestaurants(result);
  }, [restaurants, activeFilter, activeSort]);

  const StarRating = ({ rating }) => {
    const isNew = rating === 0;
    const ratingColor = rating >= 4 ? '#2ecc71' : rating >= 3 ? '#f39c12' : '#e74c3c';
    return (
      <span className="rating-chip" style={{ 
        backgroundColor: ratingColor,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderRadius: '6px',
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        ★ {isNew ? 'New' : rating.toFixed(1)}
      </span>
    );
  };

  const handleAddToCart = (e, dishId) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addItemToCart(dishId, 1));
    // Optional: Add a toast notification here
  };

  return (
    <div className="home-container">

      {/* Hero Section */}
      {!searchQuery && (
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">Hunger? We got you 🍔</h1>
            <p className="hero-subtitle">Order from the best restaurants near you, delivered fast!</p>
            <div className="hero-badges">
              <span className="hero-badge">🚀 30-min delivery</span>
              <span className="hero-badge">✅ 100% safe & hygienic</span>
              <span className="hero-badge">📍 Live tracking</span>
            </div>
          </div>
        </section>
      )}

      {/* Search result banner */}
      {searchQuery && (
        <div className="search-result-banner">
          <span>🔍 Showing results for <strong>"{searchQuery}"</strong></span>
          <Link to="/" className="clear-search">✕ Clear</Link>
        </div>
      )}

      {/* Cuisine Filter Pills */}
      <section className="cuisine-section">
        <div className="cuisine-scroll">
          {CUISINE_FILTERS.map(c => (
            <button key={c} className={`cuisine-pill ${activeCuisine === c ? 'active' : ''}`}
              onClick={() => setActiveCuisine(c)}>
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* Explore Dishes Discovery Section */}
      {!searchQuery && (
        <section className="discovery-section">
          <div className="section-header">
            <h2 className="section-title">Explore Dishes</h2>
            <p className="section-subtitle">Randomized favorites just for you</p>
          </div>
          
          <div className="discovery-scroll-container">
            {discoveryLoading ? (
              <div className="discovery-skeleton-scroll">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="skeleton-dish-card" />
                ))}
              </div>
            ) : discoveryItems.length === 0 ? (
              <div className="discovery-empty">No dishes found matching your filters.</div>
            ) : (
              <div className="discovery-scroll">
                {discoveryItems.map((item) => (
                  <div key={item._id} className={`dish-card ${item.stock === 0 ? 'is-out-of-stock' : ''}`}>
                    <div className="dish-img-wrapper">
                      <img 
                        src={item.images?.[0]?.url || "https://via.placeholder.com/200"} 
                        alt={item.name} 
                        className="dish-img"
                      />
                      <div className="dish-overlay">
                        <button 
                          className="quick-add-btn"
                          onClick={(e) => handleAddToCart(e, item._id)}
                          disabled={item.stock === 0}
                        >
                          {item.stock === 0 ? 'OUT OF STOCK' : 'ADD +'}
                        </button>
                      </div>
                      {item.dishType === 'Veg' && <span className="dish-badge-veg">🌿</span>}
                      {item.dishType === 'Non-Veg' && <span className="dish-badge-nonveg">🍗</span>}
                      {item.dishType === 'Egg' && <span className="dish-badge-egg">🥚</span>}
                      {item.stock === 0 && <div className="out-of-stock-label">SOLD OUT</div>}
                    </div>
                    <div className="dish-info">
                      <div className="dish-name-row">
                        <h4 className="dish-name">{item.name}</h4>
                        <div className="dish-rating">★ {item.ratings ? item.ratings.toFixed(1) : 'New'}</div>
                      </div>
                      <p className="dish-restaurant">{item.restaurant?.name || "Restaurant"}</p>
                      <div className="dish-footer">
                        <span className="dish-price">₹{item.price}</span>
                        <button 
                          className="mobile-add-btn"
                          onClick={(e) => handleAddToCart(e, item._id)}
                          disabled={item.stock === 0}
                        >
                          {item.stock === 0 ? 'Out of Stock' : 'Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Sort + Filter Bar */}
      <section className="filter-bar">
        <div className="filter-bar-left">
          <span className="results-count">{filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="filter-bar-right">
          <button className={`filter-chip ${activeFilter === 'Pure Veg' ? 'chip-active' : ''}`}
            onClick={() => setActiveFilter(prev => prev === 'Pure Veg' ? null : 'Pure Veg')}>
            🌿 Pure Veg
          </button>
          <button className={`filter-chip ${activeFilter === 'Non-Veg' ? 'chip-active' : ''}`}
            onClick={() => setActiveFilter(prev => prev === 'Non-Veg' ? null : 'Non-Veg')}>
            🍗 Non-Veg
          </button>
          <button className={`filter-chip ${activeFilter === 'Egg' ? 'chip-active' : ''}`}
            onClick={() => setActiveFilter(prev => prev === 'Egg' ? null : 'Egg')}>
            🥚 Egg
          </button>
          <button className={`filter-chip ${activeFilter === 'Rating 4.0+' ? 'chip-active' : ''}`}
            onClick={() => setActiveFilter(prev => prev === 'Rating 4.0+' ? null : 'Rating 4.0+')}>
            ⭐ Ratings 4.0+
          </button>
          {SORT_OPTIONS.map(opt => (
            <button key={opt} className={`filter-chip ${activeSort === opt ? 'chip-active' : ''}`}
              onClick={() => setActiveSort(opt)}>
              {opt}
            </button>
          ))}
        </div>
      </section>

      {/* Restaurant Grid */}
      <section className="restaurants-section">
        {loading ? (
          <div className="home-skeleton-grid">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="skeleton-card">
                <div className="sk-img" />
                <div className="sk-line sk-title" />
                <div className="sk-line sk-subtitle" />
                <div className="sk-line sk-short" />
              </div>
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '64px' }}>🍽️</div>
            <h3>No restaurants found</h3>
            <p className="text-muted">{searchQuery ? `No results for "${searchQuery}"` : 'No restaurants available right now.'}</p>
            {searchQuery && <Link to="/" className="back-home-btn">Browse All Restaurants</Link>}
          </div>
        ) : (
          <div className="restaurant-grid">
            {filteredRestaurants.map((restaurant) => {
              const discount = restaurant.discount;
              const menuTarget = isAuthenticated
                ? `/restaurant/${restaurant._id}`
                : `/login?redirect=/restaurant/${restaurant._id}`;

              return (
                <Link key={restaurant._id} to={menuTarget} className="restaurant-card">
                  <div className="card-img-wrapper">
                    <img
                      src={restaurant.images?.[0]?.url || `https://source.unsplash.com/400x250/?restaurant,food`}
                      alt={restaurant.name}
                      className="card-img"
                      loading="lazy"
                    />
                    {restaurant.isVeg && <span className="badge-veg">🌿 Pure Veg</span>}
                    {discount && <div className="discount-ribbon">{discount}</div>}
                    <div className="img-overlay" />
                  </div>

                  <div className="card-body">
                    <div className="card-top-row">
                      <h3 className="card-title">{restaurant.name}</h3>
                      <StarRating rating={restaurant.ratings} />
                    </div>

                    <p className="card-cuisine">{restaurant.cuisines?.join(" • ") || "North Indian • Chinese • Biryani"}</p>

                    <p className="card-address">
                      📍 {restaurant.address}
                    </p>

                    <div className="card-meta">
                      <span className="meta-item">🕐 {restaurant.deliveryTime || 30} mins</span>
                      <span className="meta-dot">·</span>
                      <span className="meta-item">₹{restaurant.costForTwo || 200} for two</span>
                      {restaurant.numOfReviews > 0 && (
                        <>
                          <span className="meta-dot">·</span>
                          <span className="meta-item">{restaurant.numOfReviews} reviews</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;