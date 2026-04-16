import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetPassword } from "../../redux/actions/userActions";
import { clearErrors } from "../../redux/slices/userSlice";
import { useParams, useNavigate } from "react-router-dom";

import { toast } from "react-toastify"; 

const NewPassword = () => {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setpasswordConfirm] = useState("");

  const dispatch = useDispatch();

  const { error, success } = useSelector(
    (state) => state.forgotPassword
  );

  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      toast.error(error); 
      dispatch(clearErrors());
    }

    if (success) {
      toast.success("Password updated successfully"); 
      navigate("/users/login");
    }
  }, [dispatch, error, success, navigate]);

  const submitHandler = (e) => {
    e.preventDefault();

    //optional validation
    if (password !== passwordConfirm) {
      toast.error("Passwords do not match ");
      return;
    }

    const formData = new FormData();
    formData.set("password", password);
    formData.set("passwordConfirm", passwordConfirm);

    dispatch(resetPassword(token, formData));
  };

  return (
    <>
      <div className="row wrapper">
        <div className="col-10 col-lg-5">
          <form className="shadow-lg" onSubmit={submitHandler}>
            <h1 className="mb-3">New Password</h1>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                className="form-control"
                value={passwordConfirm}
                onChange={(e) => setpasswordConfirm(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-block py-3"
            >
              Set Password
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default NewPassword;