import { encode } from "@msgpack/msgpack";

onmessage = function (e) {
    const { labelsData } = e.data;

    const formattedLabels = labelsData.map(({ fileName, labels }) => ({
        fileName,
        labels: Array.from(labels),
    }));

    // const payload = JSON.stringify(formattedLabels);

    // const start = performance.now();

    const encoded = encode(formattedLabels);
    // const buffer = encoded.buffer;

    // const end = performance.now();
    // const total = (end - start).toFixed(2);
    // console.log(`Total time ${total}ms`)

    postMessage({ shouldSave: true, payload: encoded }, [encoded.buffer]);
};
