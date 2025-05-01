import { TextEncoder, TextDecoder } from "fast-text-encoding";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import { encode } from "@msgpack/msgpack";
import { compress } from "lz4js";

// 4 лейбла, 200 облаков точек по 70000-90000 точек
import realData from "../__fixtures__/labels.json";

describe("Compression performance test with real data", () => {
    const formatBytes = (bytes, decimals = 2, binaryUnits = true) => {
        if (bytes === 0) return "0 Bytes";

        const k = binaryUnits ? 1024 : 1000;
        const sizes = binaryUnits ? ["Bytes", "KiB", "MiB", "GiB"] : ["Bytes", "KB", "MB", "GB"];

        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i];
    };

    it("should measure compression performance on real data", () => {
        console.log("Startin test with real data...");
        const testData = realData.map((item) => {
            return {
                folderName: `folder_name`,
                fileName: `file_name.pcd`,
                labels: new Uint8Array(item.labels),
            };
        });

        console.log("Encoding to MessagePack...");
        const encodeStart = performance.now();
        const encoded = encode(testData);
        const encodeTime = performance.now() - encodeStart;
        console.log(`MessagePack encoded in ${encodeTime.toFixed(2)}ms`);
        console.log(`MessagePack size: ${formatBytes(encoded.length)}`);

        console.log("Compressing with LZ4...");
        const compressStart = performance.now();
        const compressed = compress(encoded);
        const compressTime = performance.now() - compressStart;
        console.log(`LZ4 compressed in ${compressTime.toFixed(2)}ms`);
        console.log(`Compressed size (binary): ${formatBytes(compressed.length)}`);
        console.log(`Compressed size (decimal): ${formatBytes(compressed.length, 2, false)}`);

        const compressionRatio = ((compressed.length / encoded.length) * 100).toFixed(2);
        console.log(`Compression ratio: ${compressionRatio}%`);

        expect(compressed).toBeInstanceOf(Uint8Array);
        expect(compressed.length).toBeGreaterThan(0);
        expect(compressed.length).toBeLessThan(encoded.length);
    });
});
