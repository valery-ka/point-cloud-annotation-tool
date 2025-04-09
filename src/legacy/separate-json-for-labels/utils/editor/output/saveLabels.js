import { API_PATHS } from "@config/apiPaths";

const { LABELS } = API_PATHS;

export const saveLabels = (path, newLabels, prevLabels, worker) => {
    return new Promise((resolve, reject) => {
        worker.onmessage = (e) => {
            const { shouldSave, payload } = e.data;

            if (!shouldSave) {
                resolve({ saved: false });
                return;
            }

            fetch(LABELS(path.folderName, path.fileName), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
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

        worker.postMessage({ newLabels, prevLabels });
    });
};
