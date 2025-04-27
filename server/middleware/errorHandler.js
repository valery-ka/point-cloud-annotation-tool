const errorHandler = (err, req, res, next) => {
    const response = {
        success: false,
        error: {
            message: err.message || "Internal Server Error",
            code: err.code || "UNKNOWN_ERROR",
            details: process.env.NODE_ENV !== "production" ? err.stack : undefined,
            ...(err.details && { additionalInfo: err.details }),
        },
        timestamp: new Date().toISOString(),
        requestId: req.id || null,
    };

    console.error(`[${new Date().toISOString()}] Error:`, {
        message: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userId: err.userId || null,
        requestId: req.id || null,
    });

    const statusCode = err.statusCode || err.status || 500;

    if (process.env.NODE_ENV === "production" && statusCode === 500) {
        response.error.message = "Internal Server Error";
        delete response.error.details;
    }

    res.status(statusCode).json(response);
};

module.exports = errorHandler;
