const API_BASE = "/api";

export const API_PATHS = {
    FOLDERS: `${API_BASE}/folders`,
    CONFIG: (endpoint) => `${API_BASE}/config/${endpoint}`,
    MODERATION: (folderName) =>
        `${API_BASE}/output/${folderName}/moderation.json`,
    FILES: (folder, file) => `${API_BASE}/files/${folder}/${file}`,
    // LABELS: (folderName, fileName) =>
    //   `${API_BASE}/output/${folderName}/${fileName.split(".")[0]}.json`,
    LABELS: (folderName) => `${API_BASE}/output/${folderName}/labels.json`,
};
