import { API_PATHS } from "config/apiPaths";

const { SOLUTION } = API_PATHS;

export const loadLabels = (folderName) => {
    return new Promise((resolve, reject) => {
        fetch(SOLUTION.LABELS(folderName), { method: "GET" })
            .then((response) => {
                if (!response.ok) {
                    return resolve([]);
                }
                return response.json();
            })
            .then((data) => {
                resolve(data);
            })
            .catch((error) => {
                console.error(`Error getting labels for ${folderName}:`, error);
                resolve([]);
            });
    });
};
