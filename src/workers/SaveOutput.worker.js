import { encode } from "@msgpack/msgpack";
import { compress } from "lz4js";

onmessage = function (e) {
    const { labelsData } = e.data;

    const formattedLabels = labelsData.map(({ folderName, fileName, labels }) => ({
        folderName,
        fileName,
        labels: Array.from(labels),
    }));

    // const start = performance.now();

    const encoded = encode(formattedLabels);
    const compressed = compress(encoded);

    // const end = performance.now();
    // const total = (end - start).toFixed(2);
    // console.log(`Total compression time ${total}ms`);

    postMessage({ shouldSave: true, payload: compressed }, [compressed.buffer]);
};
