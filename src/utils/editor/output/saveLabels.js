import { API_PATHS } from "config/apiPaths";

const { SOLUTION } = API_PATHS;

export const saveLabels = (folderName, labelsData, worker) => {
    return new Promise((resolve, reject) => {
        worker.onmessage = (e) => {
            const { shouldSave, payload } = e.data;

            if (!shouldSave) {
                resolve({ saved: false });
                return;
            }

            fetch(SOLUTION.LABELS(folderName), {
                method: "POST",
                headers: {
                    "Content-Type": "application/octet-stream",
                },
                body: payload,
            })
                .then((response) => response.json())
                .then((data) => resolve({ saved: true, data }))
                .catch((error) => reject(error));
        };

        worker.onerror = (error) => {
            reject(error);
        };

        worker.postMessage({ labelsData });
    });
};
