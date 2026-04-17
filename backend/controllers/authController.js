import crypto from "crypto";
import jwt from "jsonwebtoken";
import { promisify } from "util";

import User from "../models/user.js";
import ErrorHandler from "../utils/errorHandler.js";
import Email from "../utils/email.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import sendToken from "../utils/sendToken.js";

// Register user
export const signup = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, passwordConfirm, phoneNumber, avatar } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    phoneNumber,
    avatar: avatar || {
      public_id: "default_avatar",
      url: "https://res.cloudinary.com/demo/image/upload/v1690000000/default_avatar.png"
    },
  });

  sendToken(user, 200, res);
});

// Login
export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please enter email & password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }

  const isPasswordMatched = await user.correctPassword(password, user.password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }

  sendToken(user, 200, res);
});

// Protect Route
export const protect = catchAsyncErrors(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new ErrorHandler("You are not logged in! Please log in to get access.", 401));
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(new ErrorHandler("User no longer exists. Please login again.", 401));
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new ErrorHandler("User recently changed password! Please log in again.", 404));
  }

  req.user = currentUser;
  next();
});

// Get profile
export const getUserProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});

// Update Password
export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const { oldPassword, newPassword, newPasswordConfirm } = req.body;
  const user = await User.findById(req.user.id).select("+password");

  const isMatched = await user.correctPassword(oldPassword, user.password);

  if (!isMatched) {
    return next(new ErrorHandler("Old password is incorrect", 400));
  }

  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});

// Forgot Password
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("There is no user with that email address.", 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    const resetURL = `${process.env.FRONTEND_URL}/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler("There was an error sending the email, try again later!", 500));
  }
});

// Reset Password
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorHandler("Token is invalid or has expired", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  sendToken(user, 200, res);
});

// Logout
export const logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("jwt", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out",
  });
});