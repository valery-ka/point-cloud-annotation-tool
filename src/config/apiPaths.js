const API_BASE = "/api";

export const API_PATHS = {
    NAVIGATOR: {
        ROOT: `${API_BASE}/navigator`,
        PCD: (folder, file) => `${API_BASE}/navigator/${folder}/pointclouds/${file}`,
        IMG: (folder, camera, file) => `${API_BASE}/navigator/${folder}/images/${camera}/${file}`,
        CALIBRATIONS: (folder, camera) =>
            `${API_BASE}/navigator/${folder}/calibrations/${camera}.json`,
    },
    CONFIG: {
        JOB: (folder) => `${API_BASE}/config/${folder}/job-config.json`,
        CLASSES: (folder) => `${API_BASE}/config/${folder}/classes-config.json`,
        OBJECTS: (folder) => `${API_BASE}/config/${folder}/objects-config.json`,
        MODERATION: (folder) => `${API_BASE}/config/${folder}/moderation-config.json`,
    },
    SOLUTION: {
        LABELS: (folder) => `${API_BASE}/solution/${folder}/labels.msgpack.lz4`,
        OBJECTS: (folder) => `${API_BASE}/solution/${folder}/objects.json`,
        MODERATION: (folder) => `${API_BASE}/solution/${folder}/moderation.json`,
    },
};
