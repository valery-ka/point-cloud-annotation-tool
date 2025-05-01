import { encode } from "@msgpack/msgpack";
import { deflate } from "pako";

onmessage = function (e) {
    const { labelsData } = e.data;

    const formattedLabels = labelsData.map(({ folderName, fileName, labels }) => ({
        folderName,
        fileName,
        labels: new Uint8Array(labels),
    }));

    const encoded = encode(formattedLabels);
    const compressed = deflate(encoded, { level: 5 });

    postMessage({ shouldSave: true, payload: compressed }, [compressed.buffer]);
};
