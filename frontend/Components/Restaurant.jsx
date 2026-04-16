import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getRestaurants,
  deleteRestaurant   
} from "../redux/actions/restaurantAction";

const Restaurant = ({ restaurant }) => {
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector(
    (state) => state.user || {}
  );

  const handleDelete = () => {
    if (!window.confirm("Delete this restaurant?")) return;

    dispatch(deleteRestaurant(restaurant._id))
      .unwrap()
      .then(() => {
        // No need to refetch — state already updated
      })
      .catch((err) => {
        alert(err || "Unable to delete");
      });
  };

  return (
    <div className="col-sm-12 col-md-6 col-lg-3 my-3">
      <div className="card p-3 rounded">
        <Link
          to={`/eats/stores/${restaurant._id}/menus`}
          className="btn btn-block"
        >
          <img
            className="card-img-top mx-auto"
            src={restaurant.images?.[0]?.url}  //SAFE ACCESS
            alt={restaurant.name}
          />
        </Link>

        <div className="card-body d-flex flex-column">
          <h5 className="card-title">{restaurant.name}</h5>
          <p className="rest_address">{restaurant.address}</p>

          <div className="ratings mt-auto">
            <div className="rating-outer">
              <div
                className="rating-inner"
                style={{ width: `${(restaurant.ratings / 5) * 100}%` }}
              ></div>
            </div>

            <span id="no_of_reviews">
              ({restaurant.numOfReviews} Reviews)
            </span>
          </div>

          {isAuthenticated && user?.role === "admin" && (
            <button
              className="btn btn-danger btn-sm mt-2"
              onClick={handleDelete}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Restaurant;