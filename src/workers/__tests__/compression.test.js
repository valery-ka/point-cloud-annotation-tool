import { TextEncoder, TextDecoder } from "fast-text-encoding";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import { encode } from "@msgpack/msgpack";
import { deflate } from "pako";

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
        const testData = realData.map((item) => {
            return {
                folderName: `folder_name`,
                fileName: `file_name.pcd`,
                labels: new Uint8Array(item.labels),
            };
        });

        const encodeStart = performance.now();
        const encoded = encode(testData);
        const encodeTime = performance.now() - encodeStart;
        const encodedSize = formatBytes(encoded.length);

        const compressStart = performance.now();
        const compressed = deflate(encoded, { level: 5 });
        const compressTime = performance.now() - compressStart;
        const compressedSize = formatBytes(compressed.length, 2, false);

        const compressionRatio = ((compressed.length / encoded.length) * 100).toFixed(2);

        console.log(`
            MessagePack encoded in ${encodeTime.toFixed(2)}ms
            MessagePack size: ${encodedSize}
            Pako compressed in ${compressTime.toFixed(2)}ms
            Compressed size: ${compressedSize}
            Compression ratio: ${compressionRatio}%
        `);

        expect(compressed).toBeInstanceOf(Uint8Array);
        expect(compressed.length).toBeGreaterThan(0);
        expect(compressed.length).toBeLessThan(encoded.length);
    });
});
