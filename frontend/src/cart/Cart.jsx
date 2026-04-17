import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { addItemToCart, removeItemFromCart } from '../actions/cartActions';
import '../styles/Cart.css';

const Cart = () => {
    const dispatch = useDispatch();
    const { cartItems } = useSelector((state) => state.cart);

    const increaseQty = (item) => {
        const newQty = item.quantity + 1;
        if (newQty > item.stock) return toast.error("Stock limit reached");
        dispatch(addItemToCart(item, newQty));
    };

    const decreaseQty = (item) => {
        const newQty = item.quantity - 1;
        if (newQty <= 0) return;
        dispatch(addItemToCart(item, newQty));
    };

    const removeHandler = (id) => {
        dispatch(removeItemFromCart(id));
        toast.success("Item removed from cart");
    };

    // Calculate Subtotal
    const subtotal = cartItems.reduce((acc, item) => acc + item.quantity * item.price, 0);

    if (cartItems.length === 0) {
        return (
            <div className="empty-cart text-center">
                <h2>Your Cart is Empty</h2>
                <Link to="/" className="btn btn-warning mt-3">Go to Restaurants</Link>
            </div>
        );
    }

    return (
        <div className="cart-container">
            <h2 className="cart-title">Your Cart ({cartItems.length} items)</h2>
            <div className="cart-layout">
                {/* Item List */}
                <div className="cart-items-list">
                    {cartItems.map((item) => (
                        <div key={item.foodItem} className="cart-item-card">
                            <img src={item.image} alt={item.name} className="cart-item-img" />
                            <div className="cart-item-details">
                                <h4>{item.name}</h4>
                                <p className="item-price">₹{item.price}</p>
                            </div>
                            <div className="quantity-controls">
                                <button onClick={() => decreaseQty(item)}>-</button>
                                <span>{item.quantity}</span>
                                <button onClick={() => increaseQty(item)}>+</button>
                            </div>
                            <button className="delete-btn" onClick={() => removeHandler(item.foodItem)}>
                                <i className="fa fa-trash"></i>
                            </button>
                        </div>
                    ))}
                </div>

                {/* Order Summary Sidebar */}
                <div className="order-summary">
                    <h3>Order Summary</h3>
                    <div className="summary-row">
                        <span>Subtotal:</span>
                        <span>₹{subtotal}</span>
                    </div>
                    <div className="summary-row total">
                        <span>Total:</span>
                        <span>₹{subtotal}</span>
                    </div>
                    <Link to="/success" className="checkout-btn text-center text-decoration-none d-block">
                        Proceed to Checkout
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Cart;