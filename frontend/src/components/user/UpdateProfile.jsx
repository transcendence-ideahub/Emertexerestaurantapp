import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { BASE_URL } from "../../utils/api";
import Loader from "../layout/Loader";

import AddressAutocomplete from "../AddressAutocomplete";

const UpdateProfile = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [avatarPreview, setAvatarPreview] = useState("/images/default_avatar.jpg");
  const [newAvatar, setNewAvatar] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
          setName(data.user.name);
          setEmail(data.user.email);
          setPhoneNumber(data.user.phoneNumber || "");
          setAddress(data.user.address || "");
          if (data.user.location?.coordinates) {
            setLocation({
              lng: data.user.location.coordinates[0],
              lat: data.user.location.coordinates[1]
            });
          }
          setAvatarPreview(data.user.avatar?.url || "/images/default_avatar.jpg");
        } else {
          toast.error("Please log in to update your profile.");
          navigate("/login");
        }
      } catch (error) {
        toast.error("Failed to load user details.");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleAvatarChange = (e) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.readyState === 2) {
        setAvatarPreview(reader.result);
        setNewAvatar(reader.result);
      }
    };
    if (e.target.files[0]) {
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleAddressSelect = (data) => {
    setAddress(data.address);
    setLocation({ lat: data.lat, lng: data.lng });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name,
      email,
      phoneNumber,
      address,
      location
    };

    if (newAvatar) {
      payload.avatar = {
        public_id: "user_upload",
        url: newAvatar
      };
    }

    try {
      const response = await fetch(`${BASE_URL}/users/me/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Profile updated successfully", { duration: 5000 });
        window.location.href = "/users/me"; // Force reload to update header too
      } else {
        toast.error(data.message || "Update failed", { duration: 5000 });
      }
    } catch (err) {
      toast.error("Failed to connect to the server.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container mt-5" style={{ maxWidth: "600px" }}>
      <div className="card shadow-lg border-0" style={{ borderRadius: "20px" }}>
        <div className="card-body p-5">
          <h2 className="text-center mb-4 fw-bold" style={{ color: "#2c3e50" }}>Update Profile</h2>
          
          <form onSubmit={submitHandler}>
            <div className="d-flex align-items-center mb-4 mt-3">
              <div>
                <figure className="avatar mr-3 item-rtl" style={{width: "70px", height: "70px", borderRadius: "50%", overflow: "hidden", border: "3px solid #e67e22", marginRight: "20px"}}>
                  <img src={avatarPreview} alt="Avatar Preview" style={{width: "100%", height: "100%", objectFit: "cover"}} />
                </figure>
              </div>
              <div className="custom-file ms-4 flex-grow-1">
                <label className="form-label text-muted small fw-bold">Change Profile Picture</label>
                <input type="file" name="avatar" className="form-control" accept="image/*" onChange={handleAvatarChange} />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label text-muted fw-bold small">Full Name</label>
              <input type="text" className="form-control py-2" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="mb-3">
              <label className="form-label text-muted fw-bold small">Email Address</label>
              <input type="email" className="form-control py-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="mb-3">
              <label className="form-label text-muted fw-bold small">Phone Number</label>
              <input type="text" className="form-control py-2" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
            </div>

            <div className="mb-4">
              <label className="form-label text-muted fw-bold small">Delivery Address</label>
              <AddressAutocomplete 
                placeholder="Search for your area..." 
                onAddressSelect={handleAddressSelect}
                initialValue={address}
              />
            </div>

            <button type="submit" disabled={saving} className="btn w-100 py-2 fw-bold text-white shadow-sm" style={{ backgroundColor: "#e67e22", borderRadius: "10px" }}>
              {saving ? "Saving..." : "UPDATE"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateProfile;
