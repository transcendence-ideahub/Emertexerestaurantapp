// Function to create JWT token and send it as a cookie
const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken();


  // Use different cookie options for local development
  const isLocal = process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes('localhost');
  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.COOKIE_EXPIRES_TIME || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite: isLocal ? 'lax' : 'none',
    secure: isLocal ? false : true
  };

  res.cookie("jwt", token, cookieOptions);

  // Exclude password from response
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: { user },
  });
};

export default sendToken;