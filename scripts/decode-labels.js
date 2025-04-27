const fs = require("fs");
const { decode } = require("@msgpack/msgpack");
const { decompress } = require("lz4js");

// node decode-labels.js labels.msgpack.lz4
const filePath = process.argv[2];

if (!filePath) {
    console.error("Error: No file path provided.");
    process.exit(1);
}

const decodeLabels = (filePath) => {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err.message}`);
            return;
        }

        try {
            const decompressedData = decompress(new Uint8Array(data));
            const decodedData = decode(decompressedData);

            const formattedLabels = decodedData.map(({ folderName, fileName, labels }) => ({
                folderName,
                fileName,
                labels: Array.from(labels),
            }));

            const outputFileName = filePath.replace(/\.msgpack\.lz4$/, ".json");

            fs.writeFile(outputFileName, JSON.stringify(formattedLabels, null, 2), (err) => {
                if (err) {
                    console.error(`Error writing to file: ${err.message}`);
                    return;
                }
                console.log(`Data successfully saved to ${outputFileName}`);
            });
        } catch (error) {
            console.error("Error processing data:", error.message);
        }
    });
};

decodeLabels(filePath);
