const API_BASE = "/api";

export const API_PATHS = {
    NAVIGATOR: {
        ROOT: `${API_BASE}/navigator`,
        FILE: (folder, file) => `${API_BASE}/navigator/${folder}/${file}`,
    },
    CONFIG: (folder, endpoint) => `${API_BASE}/config/${folder}/${endpoint}`,
    LABELS: (folder) => `${API_BASE}/solution/${folder}/labels.json`,
    MODERATION: (folder) => `${API_BASE}/solution/${folder}/moderation.json`,
};
