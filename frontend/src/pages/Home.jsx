import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { addItemToCart } from '../actions/cartActions';
import { BASE_URL } from '../utils/api';
import '../styles/Home.css';

import AddressAutocomplete from '../components/AddressAutocomplete';

const CUISINE_FILTERS = ['All', 'North Indian', 'South Indian', 'Chinese', 'Pizza', 'Biryani', 'Street Food', 'Desserts', 'Healthy', 'Bread', 'Fried Chicken'];
const SORT_OPTIONS = ['Relevance', 'Rating', 'Delivery Time'];

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [discoveryItems, setDiscoveryItems] = useState([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCuisine, setActiveCuisine] = useState('All');
  const [activeSort, setActiveSort] = useState('Relevance');
  const [activeFilter, setActiveFilter] = useState(null); // 'Pure Veg' etc.
  const [locationAddress, setLocationAddress] = useState('');

  const dispatch = useDispatch();

  const [userLocation, setUserLocation] = useState(null);
  const location = useLocation();
  const searchQuery = new URLSearchParams(location.search).get('search') || '';

  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      if (data && data.display_name) {
        return data.display_name;
      }
    } catch (e) {
      console.error("Reverse geocode failed", e);
    }
    return "Current Location";
  }, []);

  const handleLocationSelect = (data) => {
    setUserLocation({ lat: data.lat, lng: data.lng });
    setLocationAddress(data.address);
    fetchRestaurants(searchQuery, data.lat, data.lng, activeCuisine);
  };

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await reverseGeocode(latitude, longitude);
        handleLocationSelect({ address, lat: latitude, lng: longitude });
      });
    }
  };

  const fetchRestaurants = useCallback(async (keyword = '', lat = null, lng = null, cuisine = 'All') => {
    setLoading(true);
    try {
      let url = `${BASE_URL}/eats/stores`;
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (cuisine && cuisine !== 'All') params.append('cuisine', cuisine);
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
      }
    } catch { }
    finally { setLoading(false); }
  }, []);

  const fetchDiscoveryItems = useCallback(async (cuisine = 'All', filter = null, search = '', lat = null, lng = null) => {
    setDiscoveryLoading(true);
    try {
      let url = `${BASE_URL}/eats/item/discovery`;
      const params = new URLSearchParams();
      if (cuisine && cuisine !== 'All') params.append('cuisine', cuisine);

      if (lat && lng) {
        params.append('lat', lat);
        params.append('lng', lng);
      }
      // Correctly map filter to backend params
      if (filter === 'Rating 4.0+') {
        params.append('rating', '4');
      } else if (filter) {
        params.append('dishType', filter);
      }

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
    const checkAuthAndLocation = async () => {
      try {
        const res = await fetch(`${BASE_URL}/users/me`, { credentials: 'include' });
        const data = await res.json();

        if (res.ok && data.success) {
          setIsAuthenticated(true);
          const user = data.user;

          // If user has a saved location, use it
          if (user.location?.coordinates) {
            const [lng, lat] = user.location.coordinates;
            setUserLocation({ lat, lng });
            setLocationAddress(user.address || "");
            return;
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }

      // Fallback to browser GPS if no profile location
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          const address = await reverseGeocode(latitude, longitude);
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationAddress(address);
        }, () => {
          // No action needed, useEffects will trigger with null location
        });
      }
    };

    checkAuthAndLocation();
  }, [reverseGeocode]);

  // Fetch restaurants when filters or search change
  useEffect(() => {
    fetchRestaurants(searchQuery, userLocation?.lat, userLocation?.lng, activeCuisine);
  }, [activeCuisine, searchQuery, fetchRestaurants, userLocation?.lat, userLocation?.lng]);

  // Fetch discovery items when filters or search change
  useEffect(() => {
    fetchDiscoveryItems(activeCuisine, activeFilter, searchQuery, userLocation?.lat, userLocation?.lng);
  }, [activeCuisine, activeFilter, searchQuery, fetchDiscoveryItems, userLocation?.lat, userLocation?.lng]);

  // Unified Filtering and Sorting for Restaurants
  const filteredRestaurantsList = useMemo(() => {
    let result = [...restaurants];

    // 1. Filtering
    if (activeFilter === 'Pure Veg') result = result.filter(r => r.hasVeg || r.isVeg);
    if (activeFilter === 'Non-Veg') result = result.filter(r => r.hasNonVeg);
    if (activeFilter === 'Egg') result = result.filter(r => r.hasEgg);
    if (activeFilter === 'Rating 4.0+') result = result.filter(r => r.ratings >= 4.0);

    // 2. Sorting
    if (activeSort === 'Rating') {
      result.sort((a, b) => b.ratings - a.ratings);
    } else if (activeSort === 'Delivery Time') {
      result.sort((a, b) => (a.deliveryTime || 30) - (b.deliveryTime || 30));
    } else if (activeSort === 'Relevance') {
      const maxDist = Math.max(...result.map(r => r.distance || 5), 10);
      result.sort((a, b) => {
        const scoreA = (a.ratings * 0.6) + ((maxDist - (a.distance || 5)) / maxDist * 5 * 0.4);
        const scoreB = (b.ratings * 0.6) + ((maxDist - (b.distance || 5)) / maxDist * 5 * 0.4);
        return scoreB - scoreA;
      });
    }
    return result;
  }, [restaurants, activeFilter, activeSort]);

  // Unified Sorting and Filtering for Discovery Dishes
  const sortedDiscoveryDishes = useMemo(() => {
    let result = [...discoveryItems];

    // 1. Client-side Filtering (Extra safety)
    if (activeFilter === 'Pure Veg') result = result.filter(i => i.dishType === 'Veg');
    if (activeFilter === 'Non-Veg') result = result.filter(i => i.dishType === 'Non-Veg');
    if (activeFilter === 'Egg') result = result.filter(i => i.dishType === 'Egg');
    if (activeFilter === 'Rating 4.0+') result = result.filter(i => i.ratings >= 4.0);

    // 2. Sorting
    if (activeSort === 'Rating') {
      result.sort((a, b) => b.ratings - a.ratings);
    } else if (activeSort === 'Delivery Time') {
      result.sort((a, b) => (a.restaurant?.deliveryTime || 30) - (b.restaurant?.deliveryTime || 30));
    } else if (activeSort === 'Relevance') {
      // For dishes, relevance is Rating (70%) + Restaurant Rating (30%)
      result.sort((a, b) => {
        const scoreA = (a.ratings * 0.7) + ((a.restaurant?.ratings || 0) * 0.3);
        const scoreB = (b.ratings * 0.7) + ((b.restaurant?.ratings || 0) * 0.3);
        return scoreB - scoreA;
      });
    }
    return result;
  }, [discoveryItems, activeSort, activeFilter]);

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

  const handleAddToCart = (e, dishId, isClosed) => {
    e.stopPropagation();
    e.preventDefault();
    if (isClosed) {
      return toast.error("This restaurant is currently closed.");
    }
    dispatch(addItemToCart(dishId, 1));
    toast.success("Added to cart!");
  };

  return (
    <div className="home-container">
      {/* Location Bar */}
      <div className="location-bar-container py-3 bg-white shadow-sm sticky-top">
        <div className="container d-flex align-items-center">
          <div className="location-label me-3 d-none d-md-block">
            <span className="fw-bold text-orange">📍 Delivery Location:</span>
          </div>
          <div className="flex-grow-1" style={{ maxWidth: '500px' }}>
            <AddressAutocomplete
              placeholder={locationAddress || "Search your delivery location..."}
              onAddressSelect={handleLocationSelect}
              className="location-autocomplete"
            />
          </div>
          <div className="ms-3 d-none d-sm-block">
            <button className="btn btn-outline-orange btn-sm fw-bold" onClick={handleUseCurrentLocation}>
              🧭 Use Current
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      {!searchQuery && (
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">Exquisite Dining, <span className="text-accent">Delivered.</span></h1>
            <p className="hero-subtitle">Curated flavors from the city's finest kitchens, brought to your doorstep with precision.</p>
            <div className="hero-badges">
              <span className="hero-badge">✨ Premium Selection</span>
              <span className="hero-badge">🚀 Priority Delivery</span>
              <span className="hero-badge">💎 Exceptional Quality</span>
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
      {(discoveryItems.length > 0) && (
        <section className="discovery-section">
          <div className="section-header">
            <h2 className="section-title">{searchQuery ? `Dishes matching "${searchQuery}"` : "Explore Dishes"}</h2>
            <p className="section-subtitle">{searchQuery ? "Delicious finds from top restaurants" : "Randomized favorites just for you"}</p>
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
                {sortedDiscoveryDishes.map((item) => {
                  const isClosed = item.restaurant?.isActive === false;
                  return (
                    <div key={item._id} className={`dish-card ${item.stock === 0 || isClosed ? 'is-out-of-stock' : ''}`}>
                      <div className="dish-img-wrapper">
                        <img
                          src={item.images?.[0]?.url || "https://via.placeholder.com/200"}
                          alt={item.name}
                          className="dish-img"
                        />
                        <div className="dish-overlay">
                          <button
                            className="swiggy-add-btn-discovery"
                            onClick={(e) => handleAddToCart(e, item._id, isClosed)}
                            disabled={item.stock === 0 || isClosed}
                          >
                            {isClosed ? 'UNAVAILABLE' : item.stock === 0 ? 'OUT OF STOCK' : 'ADD +'}
                          </button>
                        </div>
                        {item.dishType === 'Veg' && <span className="dish-badge-veg">🌿</span>}
                        {item.dishType === 'Non-Veg' && <span className="dish-badge-nonveg">🍗</span>}
                        {item.dishType === 'Egg' && <span className="dish-badge-egg">🥚</span>}
                        {(item.stock === 0 || isClosed) && <div className="out-of-stock-label">{isClosed ? 'CLOSED' : 'SOLD OUT'}</div>}
                      </div>
                      <div className="dish-info">
                        <div className="dish-name-row">
                          <h4 className="dish-name">{item.name}</h4>
                          <div className="dish-rating">★ {item.ratings ? item.ratings.toFixed(1) : 'New'}</div>
                        </div>
                        <div className="mb-1">
                          <p className="dish-restaurant mb-0">{item.restaurant?.name || "Restaurant"}</p>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-1">
                          {item.deliveryTime && <span className="small text-muted fw-bold">🕐 {item.deliveryTime} mins</span>}
                          {item.cuisines && item.cuisines.filter(c => c !== 'Other').map(c => (
                            <span key={c} className="dish-cuisine-tag">🏷️ {c}</span>
                          ))}
                        </div>
                        <div className="dish-footer">
                          <span className="dish-price">₹{item.price}</span>
                          <button
                            className="mobile-add-btn"
                            onClick={(e) => handleAddToCart(e, item._id, isClosed)}
                            disabled={item.stock === 0 || isClosed}
                          >
                            {isClosed ? 'Unavailable' : item.stock === 0 ? 'Out of Stock' : 'Add'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Sort + Filter Bar */}
      <section className="filter-bar">
        <div className="filter-bar-left">
          <span className="results-count">{filteredRestaurantsList.length} restaurant{filteredRestaurantsList.length !== 1 ? 's' : ''}</span>
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
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="skeleton-card">
                <div className="sk-img" />
                <div className="sk-line sk-title" />
                <div className="sk-line sk-subtitle" />
                <div className="sk-line sk-short" />
              </div>
            ))}
          </div>
        ) : filteredRestaurantsList.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '64px' }}>🍽️</div>
            <h3>No restaurants found</h3>
            <p className="text-muted">{searchQuery ? `No results for "${searchQuery}"` : 'No restaurants available right now.'}</p>
            {searchQuery && <Link to="/" className="back-home-btn">Browse All Restaurants</Link>}
          </div>
        ) : (
          <div className="restaurant-grid">
            {filteredRestaurantsList.map((restaurant) => {
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
                      style={{ filter: restaurant.isActive === false ? 'grayscale(100%) brightness(70%)' : 'none' }}
                      loading="lazy"
                    />
                    {restaurant.isVeg && <span className="badge-veg">🌿 Pure Veg</span>}
                    {restaurant.isActive === false && <div className="closed-badge">CLOSED NOW</div>}
                    {discount && restaurant.isActive !== false && <div className="discount-ribbon">{discount}</div>}
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