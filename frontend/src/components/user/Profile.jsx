import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Loader from "../layout/Loader";
import { BASE_URL } from "../../utils/api";
import "../../styles/Profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${BASE_URL}/users/me`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setUser(data.user);
          // Redirect restaurant owners to their dedicated dashboard
          if (data.user.role === "restaurant-owner") {
            navigate("/partner/dashboard");
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  if (loading) return <Loader />;

  if (!user) {
    return (
      <div className="container mt-5 text-center">
        <h2>Please log in to view your profile</h2>
        <Link to="/login" className="btn btn-primary mt-3">Log In</Link>
      </div>
    );
  }

  return (
    <div className="container profile-page-container mt-5">
      <div className="profile-glass-card p-5">
        <h2 className="profile-heading text-center mb-5">My Account</h2>
        <div className="row align-items-center">
          <div className="col-12 col-md-4 text-center profile-sidebar">
            <figure className="avatar-wrapper mb-4">
              <img
                className="profile-avatar shadow-lg"
                src={user?.avatar?.url || "/images/default_avatar.jpg"}
                alt={user?.name}
              />
            </figure>
            <Link
              to="/users/me/update"
              className="btn profile-btn-edit w-100 mb-3"
            >
              Edit Profile
            </Link>
            <Link
              to="/users/password/update"
              className="btn outline-btn w-100"
            >
              Change Password
            </Link>
          </div>

          <div className="col-12 col-md-8 profile-details ps-md-5 mt-4 mt-md-0">
            <div className="detail-group">
              <label className="text-muted text-uppercase tracking-wide small fw-bold">Full Name</label>
              <h4 className="detail-value">{user?.name}</h4>
            </div>
            
            <div className="detail-group mt-4">
              <label className="text-muted text-uppercase tracking-wide small fw-bold">Email Address</label>
              <h4 className="detail-value text-break">{user?.email}</h4>
            </div>

            <div className="detail-group mt-4">
              <label className="text-muted text-uppercase tracking-wide small fw-bold">Phone Number</label>
              <h4 className="detail-value">{user?.phoneNumber || "Not provided"}</h4>
            </div>

            <div className="detail-group mt-4">
              <label className="text-muted text-uppercase tracking-wide small fw-bold">Joined On</label>
              <h4 className="detail-value text-secondary">
                {new Date(user?.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h4>
            </div>

            {user?.role !== "admin" && (
              <div className="mt-5">
                <Link to="/orders/me" className="btn profile-btn-orders px-5 py-2">
                  <i className="fa fa-shopping-bag me-2"></i> View My Orders
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;