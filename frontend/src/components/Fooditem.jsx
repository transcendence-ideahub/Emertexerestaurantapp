import React from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { addItemToCart } from '../actions/cartActions';
import '../styles/Fooditem.css';

const Fooditem = ({ fooditem }) => {
  const dispatch = useDispatch();

  const handleAddToCart = () => {
    // We pass the fooditem object and a default quantity of 1
    dispatch(addItemToCart(fooditem, 1));
    toast.success(`${fooditem.name} added to cart!`, { duration: 3000 });
  };

  return (
    <div className="food-card">
      <div className="food-img-wrapper">
        <img 
          src={fooditem.images[0]?.url || "https://via.placeholder.com/150"} 
          className="food-img" 
          alt={fooditem.name} 
        />
      </div>
      
      <div className="food-details">
        <h3 className="food-name">{fooditem.name}</h3>
        <p className="food-desc">{fooditem.description}</p>
        
        <div className="food-footer">
          <span className="food-price">₹{fooditem.price}</span>
          <button 
            className="add-to-cart-btn" 
            onClick={handleAddToCart}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default Fooditem;