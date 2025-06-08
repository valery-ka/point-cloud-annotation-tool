import { decode } from "@msgpack/msgpack";
import { inflate } from "pako";

import { API_PATHS } from "config/apiPaths";

const { NAVIGATOR } = API_PATHS;

export const loadObjects = (folderName) => {
    return new Promise((resolve, reject) => {
        fetch(NAVIGATOR.SOLUTION.OBJECTS(folderName), { method: "GET" })
            .then((response) => {
                if (!response.ok) {
                    return resolve([]);
                }

                const contentType = response.headers.get("Content-Type");

                if (contentType && contentType.includes("application/octet-stream")) {
                    return response.arrayBuffer().then((buffer) => {
                        const decompressed = inflate(buffer);
                        const decoded = decode(decompressed);
                        return decoded.map((item) => item.cuboids);
                    });
                } else {
                    console.warn(`Unsupported Content-Type: ${contentType}`);
                    return [];
                }
            })
            .then((data) => {
                resolve(data);
            })
            .catch((error) => {
                console.error(`Error getting objects for ${folderName}:`, error);
                resolve([]);
            });
    });
};
