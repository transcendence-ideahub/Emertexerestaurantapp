import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { deleteRestaurant } from "../redux/actions/restaurantAction";

const Restaurant = ({ restaurant }) => {
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector(
    (state) => state.user || {}
  );

  //DELETE
  const handleDelete = () => {
    if (!window.confirm("Delete this restaurant?")) return;

    dispatch(deleteRestaurant(restaurant._id)).catch(() => {
      alert("Unable to delete");
    });
  };

  return (
    <div className="col-sm-12 col-md-6 col-lg-3 my-3">
      <div className="card p-3 rounded">
        <Link to={`/eats/stores/${restaurant._id}/menus`}>
          <img
            className="card-img-top mx-auto"
            src={restaurant.images?.[0]?.url}
            alt={restaurant.name}
          />
        </Link>

        <div className="card-body d-flex flex-column">
          <h5 className="card-title">{restaurant.name}</h5>
          <p className="rest_address">{restaurant.address}</p>

          {/* Ratings */}
          <div className="ratings mt-auto">
            <div className="rating-outer">
              <div
                className="rating-inner"
                style={{
                  width: `${(restaurant.ratings / 5) * 100}%`,
                }}
              ></div>
            </div>
            <span>({restaurant.numOfReviews} Reviews)</span>
          </div>

          {/*AI INSIGHTS (ONLY FOR USERS) */}
          {user?.role === "user" &&
            restaurant.reviewSentiment && (
              <div className="mt-2 p-2 border rounded bg-light">
                <strong>AI Insights</strong>

                <p>
                  Sentiment: <b>{restaurant.reviewSentiment}</b>
                </p>

                <ul>
                  {(restaurant.reviewSummaryBullets || []).map(
                    (point, i) => (
                      <li key={i}>{point}</li>
                    )
                  )}
                </ul>

                <small>
                  Top:{" "}
                  {(restaurant.reviewTopMentions || []).join(
                    ", "
                  )}
                </small>
              </div>
            )}

          {/* ADMIN CONTROLS (ONLY DELETE NOW) */}
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