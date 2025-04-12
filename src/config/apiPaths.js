const API_BASE = "/api";

export const API_PATHS = {
    NAVIGATOR: {
        ROOT: `${API_BASE}/navigator`,
        FILE: (folder, subdir, file) => `${API_BASE}/navigator/${folder}/${subdir}/${file}`,
    },
    CONFIG: {
        JOB: (folder) => `${API_BASE}/config/${folder}/job.json`,
        CLASSES: (folder) => `${API_BASE}/config/${folder}/classes.json`,
        OBJECTS: (folder) => `${API_BASE}/config/${folder}/objects.json`,
        MODERATION: (folder) => `${API_BASE}/config/${folder}/moderation.json`,
    },
    SOLUTION: {
        LABELS: (folder) => `${API_BASE}/solution/${folder}/labels.json`,
        OBJECTS: (folder) => `${API_BASE}/solution/${folder}/objects.json`,
        MODERATION: (folder) => `${API_BASE}/solution/${folder}/moderation.json`,
    },
};
