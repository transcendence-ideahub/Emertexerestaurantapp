import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  removeItemFromCart,
  updateCartQuantity,
} from "../redux/actions/cartActions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faIndianRupee } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify"; 

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { cartItems, restaurant } = useSelector((state) => state.cart);

  const removeCartItemHandler = (id) => {
    const updatedItems = cartItems.filter(item => item._id !== id);
    dispatch(removeItemFromCart(id));
    toast.success("Item removed from cart"); 
  };

  const increaseQty = (id, quantity, stock) => {
    const newQty = quantity + 1;
    if (stock && newQty > stock) {
      toast.error("Exceeded stock limit");
      return;
    }
    dispatch(updateCartQuantity(id, newQty));
  };

  const decreaseQty = (id, quantity) => {
    if (quantity > 1) {
      const newQty = quantity - 1;
      dispatch(updateCartQuantity(id, newQty));
    } else {
      toast.error("Minimum quantity reached"); 
    }
  };

  const checkoutHandler = () => {
    toast.info("Checkout feature coming soon!");
  };

  const getItemName = (item) => item.name || item.foodItem?.name;
  const getItemPrice = (item) => item.price || item.foodItem?.price;
  const getItemImage = (item) => item.images?.[0]?.url || item.foodItem?.images?.[0]?.url;
  const getItemId = (item) => item._id || item.foodItem?._id;

  return (
    <>
      {cartItems.length === 0 ? (
        <h2 className="mt-5">Your Cart is empty</h2>
      ) : (
        <>
          <h2 className="mt-5">
            Your Cart: <b>{cartItems.length} items</b>
          </h2>
          <h3 className="mt-5">
            Restaurant: <b>{restaurant?.name || "Selected Restaurant"}</b>
          </h3>

          <div className="row d-flex justify-content-between cartt">
            <div className="col-12 col-lg-8">
              {cartItems.map((item) => (
                <div className="cart-item" key={getItemId(item)}>
                  <div className="row">
                    <div className="col-4 col-lg-3">
                      <img
                        src={getItemImage(item)}
                        alt="items"
                        height="90"
                        width="115"
                      />
                    </div>

                    <div className="col-5 col-lg-3">
                      {getItemName(item)}
                    </div>

                    <div className="col-4 col-lg-2 mt-4 mt-lg-0">
                      <p id="card_item_price">
                        <FontAwesomeIcon icon={faIndianRupee} size="xs" />
                        {getItemPrice(item)}
                      </p>
                    </div>

                    <div className="col-4 col-lg-3 mt-4 mt-lg-0">
                      <div className="stockCounter d-inline">
                        <span
                          className="btn btn-danger minus"
                          onClick={() =>
                            decreaseQty(getItemId(item), item.quantity)
                          }
                        >
                          -
                        </span>

                        <input
                          type="number"
                          className="form-control count d-inline"
                          value={item.quantity}
                          readOnly
                        />

                        <span
                          className="btn btn-primary plus"
                          onClick={() =>
                            increaseQty(
                              getItemId(item),
                              item.quantity,
                              item.stock
                            )
                          }
                        >
                          +
                        </span>
                      </div>
                    </div>

                    <div className="col-4 col-lg-1 mt-4 mt-lg-0">
                      <i
                        id="delete_cart_item"
                        className="fa fa-trash btn btn-danger"
                        onClick={() =>
                          removeCartItemHandler(getItemId(item))
                        }
                      ></i>
                    </div>
                  </div>
                  <hr />
                </div>
              ))}
            </div>

            <div className="col-12 col-lg-3 my-4">
              <div id="order_summary">
                <h4>Order Summary</h4>
                <hr />

                <p>
                  Subtotal:
                  <span className="order-summary-values">
                    {cartItems.reduce(
                      (acc, item) => acc + Number(item.quantity),
                      0
                    )}
                    (Units)
                  </span>
                </p>

                <p>
                  Total:
                  <span className="order-summary-values">
                    <FontAwesomeIcon icon={faIndianRupee} size="xs" />
                    {cartItems
                      .reduce(
                        (acc, item) =>
                          acc + item.quantity * (getItemPrice(item) || 0),
                        0
                      )
                      .toFixed(2)}
                  </span>
                </p>

                <hr />

                <button
                  id="checkout_btn"
                  className="btn btn-primary btn-block"
                  onClick={checkoutHandler}
                >
                  Check Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Cart;