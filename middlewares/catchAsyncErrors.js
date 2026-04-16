// This utility is used to handle errors in async functions automatically.
// Normally when we use async/await in Express controllers,
// we need to wrap them in try/catch blocks to catch errors.

// Instead of writing try/catch in every controller,
// we create this reusable function.

// It takes a controller function as an argument
module.exports = (func) => (req, res, next) =>

  // Promise.resolve ensures that the function runs as a promise
  // so that any error inside async code can be caught
  Promise.resolve(func(req, res, next))

    // If any error happens, it will be passed to Express error middleware
    // using next(error)
    .catch(next);