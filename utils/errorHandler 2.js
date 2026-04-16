// Custom ErrorHandler class
// This class is used to create our own error objects with a message and status code
// It extends the default JavaScript Error class
class ErrorHandler extends Error {
  constructor(message, statusCode) {
    // Call the parent (Error) constructor with the error message
    super(message);

    // Store the HTTP status code (like 404, 500, etc.)
    this.statusCode = statusCode;

    // This line helps to remove this constructor from the stack trace
    // It keeps the error stack clean and easier to debug
    Error.captureStackTrace(this, this.constructor);
  }
}

// Exporting the ErrorHandler so it can be used in other files
module.exports = ErrorHandler;