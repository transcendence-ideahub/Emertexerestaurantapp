import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearCart } from "../../actions/cartActions";
import "../../styles/App.css";

const OrderSuccess = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Clear the cart in Redux once the user reaches this page
    dispatch(clearCart());
  }, [dispatch]);

  return (
    <div className="container mt-5 text-center order-success-container">
      <div className="row justify-content-center">
        <div className="col-6 mt-5 text-center">
          <img
            className="my-5 img-fluid d-block mx-auto"
            src="https://res.cloudinary.com/dp67g9p02/image/upload/v1675841289/Order_Success_vvv76k.png"
            alt="Order Success"
            width="200"
            height="200"
          />

          <h2 style={{ color: "#2ecc71", fontWeight: "800" }}>
            Your Order has been placed successfully!
          </h2>

          <Link
            to="/orders/me"
            className="btn btn-warning mt-4 fw-bold text-white px-4 py-2"
            style={{ backgroundColor: "#e67e22", border: "none", borderRadius: "50px" }}
          >
            Go to Orders
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;