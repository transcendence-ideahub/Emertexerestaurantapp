import React from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { addItemToCart } from '../actions/cartActions';
import '../styles/Fooditem.css';

const Fooditem = ({ fooditem, isClosed }) => {
  const dispatch = useDispatch();

  const handleAddToCart = () => {
    if (isClosed) {
      return toast.error("This restaurant is currently closed.");
    }
    dispatch(addItemToCart(fooditem._id, 1));
    toast.success(`${fooditem.name} added to cart!`, {
      style: {
        borderRadius: '8px',
        background: '#333',
        color: '#fff',
      },
    });
  };

  const [showReviews, setShowReviews] = React.useState(false);

  return (
    <div className={`menu-item-card ${fooditem.stock === 0 || isClosed ? 'is-out-of-stock' : ''}`}>
      <div className="item-details">
        <div className="item-meta">
          <span className={`veg-nonveg-icon ${fooditem.dishType?.toLowerCase() || (fooditem.isVeg ? 'veg' : 'non-veg')}`}>
            <span className="dot"></span>
          </span>
          {fooditem.ratings > 0 && (
            <span className="item-best-seller">★ {fooditem.ratings.toFixed(1)}</span>
          )}
          {fooditem.numOfReviews > 0 && (
            <button 
              className="btn btn-link btn-sm p-0 text-muted ms-2 text-decoration-none"
              onClick={() => setShowReviews(!showReviews)}
              style={{ fontSize: '12px' }}
            >
              {fooditem.numOfReviews} review{fooditem.numOfReviews !== 1 ? 's' : ''} {showReviews ? '▲' : '▼'}
            </button>
          )}
        </div>
        <h4 className="item-name">{fooditem.name}</h4>
        <div className="item-price">₹{fooditem.price}</div>
        <p className="item-description">{fooditem.description}</p>

        {showReviews && fooditem.reviews?.length > 0 && (
          <div className="item-reviews-section mt-3 p-2 bg-light rounded" style={{ fontSize: '13px' }}>
            <h6 className="fw-bold mb-2" style={{ fontSize: '14px' }}>Customer Reviews</h6>
            {fooditem.reviews.map((rev, i) => (
              <div key={i} className="mb-2 pb-2 border-bottom">
                <div className="d-flex justify-content-between">
                  <span className="fw-bold">{rev.name}</span>
                  <span style={{ color: '#f39c12' }}>{'★'.repeat(rev.rating)}</span>
                </div>
                <p className="mb-0 text-muted italic">"{rev.Comment}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="item-image-wrapper">
        {fooditem.images?.[0]?.url ? (
          <img 
            src={fooditem.images[0].url} 
            className="item-img" 
            alt={fooditem.name} 
          />
        ) : (
          <div className="item-img-placeholder">🍽️</div>
        )}
        <div className="add-button-container">
          <button 
            className="swiggy-add-btn" 
            onClick={handleAddToCart}
            disabled={fooditem.stock === 0 || isClosed}
          >
            {isClosed ? 'CLOSED' : fooditem.stock === 0 ? 'SOLD OUT' : 'ADD'}
            {!isClosed && fooditem.stock > 0 && <span className="plus-icon">+</span>}
          </button>
          {fooditem.stock < 5 && fooditem.stock > 0 && (
            <div className="stock-warning">Only {fooditem.stock} left</div>
          )}
          {fooditem.stock === 0 && (
            <div className="out-of-stock">Out of Stock</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Fooditem;