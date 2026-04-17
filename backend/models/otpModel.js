import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // Document is automatically deleted after 5 minutes (300 seconds)
  },
});

// A hook to hash the OTP before saving to DB
otpSchema.pre("save", async function () {
  if (this.isModified("otp")) {
    this.otp = await bcrypt.hash(this.otp, 12);
  }
});

otpSchema.methods.correctOTP = async function (candidateOTP, userOTP) {
  return await bcrypt.compare(candidateOTP, userOTP);
};

const OTP = mongoose.model("OTP", otpSchema);
export default OTP;
