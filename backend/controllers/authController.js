import crypto from "crypto";
import jwt from "jsonwebtoken";
import { promisify } from "util";

import User from "../models/user.js";
import OTP from "../models/otpModel.js";
import Restaurant from "../models/restaurant.js";
import ErrorHandler from "../utils/errorHandler.js";
import Email from "../utils/email.js";
import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import sendToken from "../utils/sendToken.js";

// Generate a 6 digit random number
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send Registration OTP
export const sendRegistrationOTP = catchAsyncErrors(async (req, res, next) => {
  console.log("sendRegistrationOTP called with body:", req.body);
  const { email, name } = req.body;
  if (!email || !name) return next(new ErrorHandler("Please provide name and email", 400));

  const otpCode = generateOTP();
  console.log("-----------------------------------------");
  console.log(`🚀 REGISTRATION OTP FOR ${email}: ${otpCode}`);
  console.log("-----------------------------------------");

  const userExists = await User.findOne({ email });
  if (userExists) {
    console.log(`User already exists for email: ${email}`);
    return next(new ErrorHandler("Email already registered", 400));
  }

  // Create OTP record (hashing is handled by pre('save') hook, but wait, findOneAndUpdate skips 'save' hooks!)
  // Mongoose findOneAndUpdate bypasses pre-save. Better to explicitly delete and create.
  await OTP.findOneAndDelete({ email });
  await OTP.create({ email, otp: otpCode });

  try {
    const emailObj = new Email({ email, name }, "");
    await emailObj.sendOTP(otpCode);
    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    await OTP.findOneAndDelete({ email });
    return next(new ErrorHandler("Email could not be sent", 500));
  }
});

// Register user
export const signup = catchAsyncErrors(async (req, res, next) => {
  const { 
    name, email, password, passwordConfirm, phoneNumber, 
    avatar, otp, role, restaurantName, restaurantAddress, 
    address, location 
  } = req.body;

  // Verify OTP first
  const otpRecord = await OTP.findOne({ email });
  if (!otpRecord) return next(new ErrorHandler("OTP expired or invalid", 400));

  const isOTPMatch = await otpRecord.correctOTP(otp, otpRecord.otp);
  if (!isOTPMatch) return next(new ErrorHandler("Incorrect OTP", 400));

  // Prepare user data
  const userData = {
    name,
    email,
    password,
    passwordConfirm,
    phoneNumber,
    avatar: avatar || {
      public_id: "default_avatar",
      url: "https://res.cloudinary.com/demo/image/upload/v1690000000/default_avatar.png"
    },
    role: role || "user",
    address: address || restaurantAddress,
  };

  // Format GeoJSON location if coordinates provided
  if (location && location.lat && location.lng) {
    userData.location = {
      type: "Point",
      coordinates: [location.lng, location.lat]
    };
  }

  const user = await User.create(userData);

  // If registering as restaurant-owner, create their restaurant immediately
  if (role === "restaurant-owner") {
    if (!restaurantName || !restaurantAddress) {
      await User.findByIdAndDelete(user._id);
      return next(new ErrorHandler("Please provide restaurant name and address", 400));
    }
    await Restaurant.create({
      name: restaurantName,
      address: restaurantAddress,
      owner: user._id,
      images: [{
        public_id: "default_restaurant",
        url: "https://res.cloudinary.com/demo/image/upload/v1690000000/default_restaurant.png"
      }],
    });
  }

  await OTP.deleteOne({ _id: otpRecord._id });

  sendToken(user, 201, res);
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

// Restrict access to specific roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ErrorHandler("You do not have permission to perform this action", 403));
    }
    next();
  };
};

// Get profile
export const getUserProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});

// Send Password OTP
export const sendPasswordOTP = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const otpCode = generateOTP();
  console.log("-----------------------------------------");
  console.log(`🔑 PASSWORD UPDATE OTP FOR ${user.email}: ${otpCode}`);
  console.log("-----------------------------------------");

  await OTP.findOneAndDelete({ email: user.email });
  await OTP.create({ email: user.email, otp: otpCode });

  try {
    const emailObj = new Email(user, "");
    await emailObj.sendOTP(otpCode);
    res.status(200).json({ success: true, message: "OTP sent to your registered email" });
  } catch (error) {
    await OTP.findOneAndDelete({ email: user.email });
    return next(new ErrorHandler("Email could not be sent", 500));
  }
});

// Update Password
export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const { oldPassword, newPassword, newPasswordConfirm, otp } = req.body;
  if (!otp) return next(new ErrorHandler("Please enter your OTP", 400));

  const user = await User.findById(req.user.id).select("+password");

  const otpRecord = await OTP.findOne({ email: user.email });
  if (!otpRecord) return next(new ErrorHandler("OTP expired or invalid", 400));

  const isOTPMatch = await otpRecord.correctOTP(otp, otpRecord.otp);
  if (!isOTPMatch) return next(new ErrorHandler("Incorrect OTP", 400));

  const isMatched = await user.correctPassword(oldPassword, user.password);

  if (!isMatched) {
    return next(new ErrorHandler("Old password is incorrect", 400));
  }

  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;

  await user.save();
  await OTP.deleteOne({ _id: otpRecord._id });

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});

// Forgot Password (Send OTP)
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("There is no user with that email address.", 404));
  }

  const otpCode = generateOTP();
  console.log("-----------------------------------------");
  console.log(`🔑 PASSWORD RESET OTP FOR ${user.email}: ${otpCode}`);
  console.log("-----------------------------------------");

  await OTP.findOneAndDelete({ email: user.email });
  await OTP.create({ email: user.email, otp: otpCode });

  try {
    const emailObj = new Email(user, "");
    await emailObj.sendOTP(otpCode);

    res.status(200).json({
      success: true,
      message: "OTP sent to your registered email",
    });
  } catch (err) {
    await OTP.findOneAndDelete({ email: user.email });
    return next(new ErrorHandler("There was an error sending the email, try again later!", 500));
  }
});

// Reset Password (Verify OTP and update)
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { email, otp, password, passwordConfirm } = req.body;

  if (!email || !otp || !password || !passwordConfirm) {
    return next(new ErrorHandler("Please provide email, otp, password and passwordConfirm", 400));
  }

  const otpRecord = await OTP.findOne({ email });
  if (!otpRecord) {
    return next(new ErrorHandler("OTP expired or invalid", 400));
  }

  const isOTPMatch = await otpRecord.correctOTP(otp, otpRecord.otp);
  if (!isOTPMatch) {
    return next(new ErrorHandler("Incorrect OTP", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  
  // Clear any old reset tokens
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  await OTP.deleteOne({ _id: otpRecord._id });

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

// Update Profile
export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    phoneNumber: req.body.phoneNumber,
    address: req.body.address,
  };

  if (req.body.location && req.body.location.lat && req.body.location.lng) {
    newUserData.location = {
      type: "Point",
      coordinates: [req.body.location.lng, req.body.location.lat],
    };
  }

  if (req.body.avatar) {
    newUserData.avatar = req.body.avatar;
  }

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    user,
  });
});