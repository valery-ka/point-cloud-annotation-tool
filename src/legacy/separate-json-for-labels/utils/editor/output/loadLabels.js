import { API_PATHS } from "config/apiPaths";

const { LABELS } = API_PATHS;

export const loadLabels = (path, worker) => {
    return new Promise((resolve, reject) => {
        fetch(LABELS(path.folderName, path.fileName), {
            method: "GET",
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Error fetching JSON labels");
                }
                return response.text();
            })
            .then((json) => {
                worker.onmessage = (e) => {
                    resolve(e.data);
                };

                worker.onerror = (error) => {
                    reject(error);
                };

                worker.postMessage({ json });
            })
            .catch((error) => reject(error));
    });
};
