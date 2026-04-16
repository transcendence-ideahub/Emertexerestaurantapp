// Import custom error handler used to send structured error responses
const ErrorHandler = require("../utils/errorHandler");

// Middleware for Role-Based Authorization
// This function checks whether the logged-in user has permission
// to access a particular route based on their role (user, admin, etc.)
exports.authorizeRoles = (...roles) => {

  // The function returns a middleware
  // Middleware runs before the actual controller
  return (req, res, next) => {

    // First check if user exists in request
    // This usually means the user has passed authentication middleware
    if (!req.user) {
      return next(new ErrorHandler("Not authenticated", 401));
    }

    // Check if the user's role is included in the allowed roles
    // Example: if route allows only "admin" but user is "user"
    // then access should be denied
    if (!roles.includes(req.user.role)) {

      return next(
        new ErrorHandler(
          `Role (${req.user.role}) is not allowed to access this resource`,
          403, // 403 = Forbidden (user exists but not allowed)
        ),
      );
    }

    // If role matches allowed roles
    // move to next middleware or controller
    next();
  };
};