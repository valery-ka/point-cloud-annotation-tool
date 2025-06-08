import { encode } from "@msgpack/msgpack";
import { deflate } from "pako";

onmessage = function (e) {
    const { objectsData } = e.data;

    const encoded = encode(objectsData);
    const compressed = deflate(encoded, { level: 5 });

    postMessage({ shouldSave: true, payload: compressed }, [compressed.buffer]);
};
