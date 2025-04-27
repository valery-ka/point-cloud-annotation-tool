const { logToClients } = require("./wsLogger");

let totalSentToClient = 0;
let totalReceivedFromClient = 0;
let requestBytes = 0;
let responseBytes = 0;

const bytesToMB = (bytes) => (bytes / (1024 * 1024)).toFixed(2);

const sendTrafficLog = () => {
    const log = [
        `[TRAFFIC] Total traffic in the last minute:`,
        `  Client downloaded: ${bytesToMB(responseBytes)} MB`,
        `  Client uploaded:   ${bytesToMB(requestBytes)} MB`,
        `  Total downloaded:  ${bytesToMB(totalSentToClient)} MB`,
        `  Total uploaded:    ${bytesToMB(totalReceivedFromClient)} MB`,
    ].join("\n");

    console.log("\n" + log + "\n");
    logToClients(log);

    responseBytes = 0;
    requestBytes = 0;
};

setInterval(sendTrafficLog, 60 * 1000);

const trafficLogger = (req, res, next) => {
    let requestBytesTemp = 0;
    let responseBytesTemp = 0;

    req.on("data", (chunk) => {
        requestBytesTemp += chunk.length;
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
        responseBytesTemp = body.length;

        if (requestBytesTemp === 0 && Buffer.isBuffer(req.body)) {
            requestBytesTemp = req.body.length;
        }

        totalSentToClient += responseBytesTemp;
        totalReceivedFromClient += requestBytesTemp;

        responseBytes += responseBytesTemp;
        requestBytes += requestBytesTemp;

        return originalEnd.apply(res, [chunk, ...args]);
    };

    next();
};

module.exports = trafficLogger;
