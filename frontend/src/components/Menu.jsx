import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux'; // Added Redux hooks
import toast from 'react-hot-toast';
import { getMenus } from '../actions/menuActions'; // New path inside src
import Fooditem from './Fooditem';
import '../styles/Menu.css';

const Menu = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  // Assuming your store has a 'menus' state from your slices
  const { menus, loading } = useSelector((state) => state.menus || { menus: [] });

  useEffect(() => {
    dispatch(getMenus(id));
  }, [dispatch, id]);

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  return (
    <div className="menu-container">
      {menus && menus.length > 0 ? (
        menus.map((category) => (
          <div key={category._id} className="category-section">
            <h2 className="category-title">{category.category}</h2>
            <div className="food-grid">
              {category.items.map((item) => (
                <Fooditem key={item._id} fooditem={item} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center mt-5">No items available.</div>
      )}
    </div>
  );
};

export default Menu;