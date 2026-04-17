import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "../layout/Loader";
import "../../styles/Profile.css";
const Profile = () => {
  const { user, loading } = useSelector((state) => state.auth);

  if (loading) return <Loader />;

  return (
    <div className="container mt-5 profile-container">
      <h2 className="mb-4">My Profile</h2>
      <div className="row justify-content-around mt-5 user-info">
        <div className="col-12 col-md-3 text-center">
          <figure className="avatar avatar-profile">
            <img
              className="rounded-circle img-fluid"
              src={user?.avatar?.url || "/images/default_avatar.jpg"}
              alt={user?.name}
            />
          </figure>
          <Link
            to="/users/me/update"
            id="edit_profile"
            className="btn btn-primary btn-block my-5"
            style={{ backgroundColor: "#e67e22", border: "none" }}
          >
            Edit Profile
          </Link>
        </div>

        <div className="col-12 col-md-5">
          <h4>Full Name</h4>
          <p>{user?.name}</p>

          <h4>Email Address</h4>
          <p>{user?.email}</p>

          <h4>Joined On</h4>
          <p>{String(user?.createdAt).substring(0, 10)}</p>

          {user?.role !== "admin" && (
            <Link to="/orders/me" className="btn btn-danger btn-block mt-5">
              My Orders
            </Link>
          )}

          <Link
            to="/users/password/update"
            className="btn btn-primary btn-block mt-3"
          >
            Change Password
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;