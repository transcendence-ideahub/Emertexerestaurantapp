class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    // Capturing stack trace helps in debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ErrorHandler;