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
            src="/order_success_illustration.png"
            alt="Order Success"
            style={{ width: "300px", height: "auto", borderRadius: "20px" }}
          />

          <h2 style={{ color: "#27ae60", fontWeight: "900", fontSize: "2.5rem", marginBottom: "20px" }}>
            Order Placed Successfully!
          </h2>
          <p style={{ color: "#7f8c8d", fontSize: "1.1rem", marginBottom: "30px" }}>
            Sit back and relax! Your delicious meal is being prepared and will be at your doorstep soon.
          </p>

          <Link
            to="/orders/me"
            className="btn btn-warning mt-4 fw-bold text-white px-5 py-3"
            style={{ 
              backgroundColor: "#e67e22", 
              border: "none", 
              borderRadius: "50px",
              fontSize: "1.1rem",
              boxShadow: "0 4px 15px rgba(230, 126, 34, 0.3)",
              transition: "transform 0.2s"
            }}
          >
            Track My Order
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;