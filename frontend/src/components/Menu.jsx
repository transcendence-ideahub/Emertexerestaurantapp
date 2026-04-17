import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getMenus } from '../actions/menuActions';
import Fooditem from './Fooditem';
import { BASE_URL } from '../utils/api';
import '../styles/Menu.css';

const Menu = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const [restaurant, setRestaurant] = useState(null);
  const menus = useSelector((state) => state.menus?.menus ?? []);
  const loading = useSelector((state) => state.menus?.loading ?? false);

  const [vegOnly, setVegOnly] = useState(false);
  const [eggOnly, setEggOnly] = useState(false);
  const [nonVegOnly, setNonVegOnly] = useState(false);

  const filterItems = (items) => {
    return items.filter(item => {
      const type = item.dishType?.toLowerCase() || (item.isVeg ? 'veg' : 'non-veg');
      if (vegOnly && type !== 'veg') return false;
      if (eggOnly && type !== 'egg') return false;
      if (nonVegOnly && type !== 'non-veg') return false;
      return true;
    });
  };

  useEffect(() => {
    dispatch(getMenus(id));
    
    // Fetch restaurant details for the header
    const fetchRestaurant = async () => {
      try {
        const res = await fetch(`${BASE_URL}/eats/stores/${id}`);
        const data = await res.json();
        if (data.success) setRestaurant(data.restaurant);
      } catch (err) {
        console.error("Failed to fetch restaurant details");
      }
    };
    fetchRestaurant();
  }, [dispatch, id]);

  if (loading) return (
    <div className="loader-container">
      <div className="loader"></div>
      <p className="mt-3 text-muted fw-bold">Cooking up your menu...</p>
    </div>
  );

  return (
    <div className="menu-page">
      {/* Swiggy Style Restaurant Header */}
      {restaurant && (
        <div className="restaurant-header">
          <div className="header-content">
            <div className="restaurant-info">
              <h1 className="res-name">{restaurant.name}</h1>
              <div className="res-cuisines">{restaurant.cuisines?.join(", ")}</div>
              <div className="res-address">{restaurant.address}</div>
              
              <div className="res-metrics">
                <div className="metric">
                  <span className="metric-icon">★</span>
                  <span className="metric-value">{restaurant.ratings || "New"}</span>
                </div>
                <div className="metric">
                  <span className="metric-value">{restaurant.deliveryTime || 30} MINS</span>
                </div>
                <div className="metric">
                  <span className="metric-value">₹{restaurant.costForTwo || 200} FOR TWO</span>
                </div>
              </div>
            </div>
            {restaurant.images?.[0]?.url && (
              <div className="header-image-container">
                <img src={restaurant.images[0].url} alt={restaurant.name} className="header-img" />
                {restaurant.discount && (
                  <div className="header-offer">
                    <span className="offer-text">{restaurant.discount}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="header-divider"></div>
        </div>
      )}

      <div className="menu-content">
        <div className="menu-filters-bar mb-4">
          <div className="d-flex gap-3 align-items-center">
            <button 
              className={`menu-filter-pill ${vegOnly ? 'active' : ''}`}
              onClick={() => { setVegOnly(!vegOnly); setEggOnly(false); setNonVegOnly(false); }}
            >
              🥬 Veg
            </button>
            <button 
              className={`menu-filter-pill ${nonVegOnly ? 'active' : ''}`}
              onClick={() => { setNonVegOnly(!nonVegOnly); setVegOnly(false); setEggOnly(false); }}
            >
              🍗 Non-Veg
            </button>
            <button 
              className={`menu-filter-pill ${eggOnly ? 'active' : ''}`}
              onClick={() => { setEggOnly(!eggOnly); setVegOnly(false); setNonVegOnly(false); }}
            >
              🥚 Egg
            </button>
            {(vegOnly || eggOnly || nonVegOnly) && (
              <button className="btn btn-link btn-sm text-muted text-decoration-none" onClick={() => { setVegOnly(false); setEggOnly(false); setNonVegOnly(false); }}>
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {menus && menus.length > 0 ? (
          menus.map((category) => {
            const filteredItems = filterItems(category.items);
            if (filteredItems.length === 0) return null;

            return (
              <div key={category._id} className="menu-category">
                <h3 className="category-header">
                  {category.category} 
                  <span className="item-count">({filteredItems.length})</span>
                </h3>
                <div className="food-list">
                  {filteredItems.map((item) => (
                    <Fooditem key={item._id} fooditem={item} />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-menu">
            <div className="empty-icon">🍽️</div>
            <h3>No items available yet</h3>
            <p>This restaurant hasn't added any dishes to their menu.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;