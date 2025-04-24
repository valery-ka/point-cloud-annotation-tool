const { logToClients } = require("./wsLogger");

let totalSentToClient = 0;
let totalReceivedFromClient = 0;

const bytesToMB = (bytes) => (bytes / (1024 * 1024)).toFixed(2);

const trafficLogger = (req, res, next) => {
    let requestBytes = 0;
    let responseBytes = 0;

    req.on("data", (chunk) => {
        requestBytes += chunk.length;
    });

    const originalWrite = res.write;
    const originalEnd = res.end;
    const chunks = [];

    res.write = function (chunk, ...args) {
        if (chunk) {
            chunks.push(Buffer.from(chunk));
        }
        return originalWrite.apply(res, [chunk, ...args]);
    };

    res.end = function (chunk, ...args) {
        if (chunk) {
            chunks.push(Buffer.from(chunk));
        }

        const body = Buffer.concat(chunks);
        responseBytes = body.length;

        if (requestBytes === 0 && Buffer.isBuffer(req.body)) {
            requestBytes = req.body.length;
        }

        totalSentToClient += responseBytes;
        totalReceivedFromClient += requestBytes;

        const log = [
            `[TRAFFIC] ${req.method} ${req.originalUrl}`,
            `  Client downloaded: ${bytesToMB(responseBytes)} MB`,
            `  Client uploaded:   ${bytesToMB(requestBytes)} MB`,
            `  Total downloaded:  ${bytesToMB(totalSentToClient)} MB`,
            `  Total uploaded:    ${bytesToMB(totalReceivedFromClient)} MB`,
        ].join("\n");

        console.log("\n" + log + "\n");
        logToClients(log);

        return originalEnd.apply(res, [chunk, ...args]);
    };

    next();
};

module.exports = trafficLogger;
