import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getRestaurants } from "../redux/actions/restaurantAction";

const CountRestaurant = () => {
  const dispatch = useDispatch();
  const { count, loading, error, showVegOnly, pureVegRestaurantsCount, restaurants } = useSelector(
    (state) => state.restaurants
  );

  useEffect(() => {
    dispatch(getRestaurants());
  }, [dispatch]);

  return (
    <div className="count-restaurant">
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error loading count</p>
      ) : (
        <p>
          <span className="count-number">
            {showVegOnly ? pureVegRestaurantsCount : count}
          </span>{" "}
          {showVegOnly
            ? pureVegRestaurantsCount === 1
              ? "Restaurant"
              : "Restaurants"
            : count === 1
            ? "Restaurant"
            : "Restaurants"}
        </p>
      )}
      <hr />
    </div>
  );
};

export default CountRestaurant;
