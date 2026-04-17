import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { BASE_URL } from "../../utils/api";

const UpdatePassword = () => {
  const [step, setStep] = useState(1);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const requestOTP = async (e) => {
    e.preventDefault();

    if (newPassword !== newPasswordConfirm) {
      toast.error("New passwords do not match", { duration: 5000 });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/users/me/send-password-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Verification code sent to your email!", { duration: 5000 });
        setStep(2);
      } else {
        toast.error(data.message || "Failed to send OTP", { duration: 5000 });
      }
    } catch (err) {
      toast.error("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      return toast.error("Please enter a valid 6-digit OTP", { duration: 5000 });
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/users/password/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword, newPasswordConfirm, otp }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Password updated successfully", { duration: 5000 });
        window.location.href = "/users/me";
      } else {
        toast.error(data.message || "Failed to update password", { duration: 5000 });
      }
    } catch (err) {
      toast.error("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "500px" }}>
      <div className="card shadow-lg border-0" style={{ borderRadius: "20px" }}>
        <div className="card-body p-5">
          <h2 className="text-center mb-4 fw-bold" style={{ color: "#2c3e50" }}>
            {step === 1 ? "Change Password" : "Confirm Changes"}
          </h2>
          
          {step === 1 && (
            <form onSubmit={requestOTP}>
              <div className="mb-4">
                <label className="form-label text-muted fw-bold small">Current Password</label>
                <input 
                  type="password" 
                  className="form-control py-2" 
                  value={oldPassword} 
                  onChange={(e) => setOldPassword(e.target.value)} 
                  required 
                />
              </div>

              <div className="mb-4">
                <label className="form-label text-muted fw-bold small">New Password</label>
                <input 
                  type="password" 
                  className="form-control py-2" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  minLength={6}
                />
              </div>

              <div className="mb-5">
                <label className="form-label text-muted fw-bold small">Confirm New Password</label>
                <input 
                  type="password" 
                  className="form-control py-2" 
                  value={newPasswordConfirm} 
                  onChange={(e) => setNewPasswordConfirm(e.target.value)} 
                  required 
                />
              </div>

              <button type="submit" disabled={loading} className="btn w-100 py-3 fw-bold text-white shadow-sm mb-3" style={{ backgroundColor: "#2ecc71", borderRadius: "10px" }}>
                {loading ? "Requesting OTP..." : "CONTINUE"}
              </button>

              <div className="text-center">
                  <Link to="/users/me" className="text-decoration-none text-muted small fw-bold">Cancel</Link>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={submitHandler}>
              <div className="text-center mb-4">
                <i className="fa fa-lock" style={{ fontSize: "40px", color: "#e67e22" }}></i>
                <p className="mt-3 text-muted">To protect your account, we sent a verification code to your email. Enter it below to authorize this password change.</p>
              </div>

              <div className="mb-4 text-center">
                <input 
                  type="text" 
                  className="form-control mx-auto text-center py-3" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  required 
                  maxLength={6}
                  placeholder="• • • • • •"
                  style={{ fontSize: "24px", letterSpacing: "8px", maxWidth: "250px", fontWeight: "bold" }}
                />
              </div>

              <button type="submit" disabled={loading} className="btn w-100 py-3 fw-bold text-white shadow-sm mb-3" style={{ backgroundColor: "#2c3e50", borderRadius: "10px" }}>
                {loading ? "Updating..." : "VERIFY AND UPDATE PASSWORD"}
              </button>

              <div className="text-center">
                <button type="button" onClick={() => setStep(1)} className="btn btn-link text-muted text-decoration-none fw-bold small">
                  Back
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdatePassword;
