import { API_PATHS } from "config/apiPaths";

const { LABELS } = API_PATHS;

export const loadLabels = (folderName) => {
    return new Promise((resolve, reject) => {
        fetch(LABELS(folderName), { method: "GET" })
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
                console.error(`Ошибка при получении JSON с лейблами для ${folderName}:`, error);
                resolve([]);
            });
    });
};
