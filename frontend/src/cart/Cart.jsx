import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { addItemToCart, removeItemFromCart } from '../actions/cartActions';
import { BASE_URL } from '../utils/api';
import '../styles/Cart.css';

const Cart = () => {
    const dispatch = useDispatch();
    const { cartItems } = useSelector((state) => state.cart);

    const navigate = useNavigate();

    const increaseQty = (item) => {
        const newQty = item.quantity + 1;
        if (newQty > item.stock) return toast.error("Stock limit reached");
        dispatch(addItemToCart(item.foodItem, newQty));
    };

    const decreaseQty = (item) => {
        const newQty = item.quantity - 1;
        if (newQty <= 0) return;
        dispatch(addItemToCart(item.foodItem, newQty));
    };

    const removeHandler = (id) => {
        dispatch(removeItemFromCart(id));
        toast.success("Item removed from cart");
    };

    const handleCheckout = async () => {
        try {
            // Check if cart has items
            if (cartItems.length === 0) return toast.error("Your cart is empty");

            // Format items for the backend
            const orderItems = cartItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                image: item.image,
                price: item.price,
                food: item.foodItem
            }));

            // Use the restaurant ID from the first item (assuming same restaurant)
            const restaurantId = cartItems[0].restaurant;

            const orderData = {
                orderItems,
                restaurantId,
                itemsPrice: subtotal,
                taxPrice: 0,
                deliveryPrice: 40,
                discountPrice: discount,
                totalPrice: total,
                shippingInfo: {
                    address: "Sector V, Salt Lake",
                    city: "Kolkata",
                    phoneNumber: "9876543210",
                    postalCode: "700091",
                    state: "West Bengal",
                    country: "India"
                },
                paymentInfo: {
                    id: "dummy_payment_id",
                    status: "Succeeded"
                }
            };

            const response = await fetch(`${BASE_URL}/orders/new`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData),
                credentials: "include"
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Order Placed Successfully!");
                navigate("/success");
            } else {
                toast.error(data.message || "Failed to place order");
            }
        } catch (error) {
            console.error("Checkout Error:", error);
            toast.error("An error occurred while placing your order");
        }
    };

    // Calculate Subtotal
    const subtotal = cartItems.reduce((acc, item) => acc + item.quantity * item.price, 0);

    // Calculate Discount (assuming all items from same restaurant)
    const restaurantData = cartItems[0]?.restaurantData || { discountPercentage: 0, maxDiscount: 0, minOrderValue: 0 };
    let discount = 0;
    if (subtotal >= restaurantData.minOrderValue && restaurantData.discountPercentage > 0) {
        discount = (subtotal * restaurantData.discountPercentage) / 100;
        if (restaurantData.maxDiscount > 0 && discount > restaurantData.maxDiscount) {
            discount = restaurantData.maxDiscount;
        }
    }

    const total = subtotal - discount + 40; // 40 is delivery fee

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
                    <div className="summary-row">
                        <span>Delivery Fee:</span>
                        <span>₹40</span>
                    </div>
                    {discount > 0 && (
                        <div className="summary-row discount text-success fw-bold">
                            <span>Restaurant Discount:</span>
                            <span>-₹{discount.toFixed(0)}</span>
                        </div>
                    )}
                    <div className="summary-row total">
                        <span>Total:</span>
                        <span>₹{total.toFixed(0)}</span>
                    </div>
                    <button 
                        onClick={handleCheckout} 
                        className="checkout-btn text-center text-decoration-none d-block w-100 border-0"
                        style={{ cursor: "pointer" }}
                    >
                        Proceed to Checkout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Cart;