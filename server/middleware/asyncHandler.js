/**
 * Wraps an async function to handle errors and pass them to Express's `next`.
 * @param {Function} fn - Async route handler (req, res, next) => Promise
 * @returns {Function} Wrapped middleware that catches errors automatically
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
