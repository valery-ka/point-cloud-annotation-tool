const API_BASE = "/api";
const API_NAVIGATOR_BASE = `${API_BASE}/navigator`;

export const API_PATHS = {
    NAVIGATOR: {
        ROOT: API_NAVIGATOR_BASE,
        PCD: (folder, file) => `${API_NAVIGATOR_BASE}/${folder}/pointclouds/${file}`,
        IMG: (folder, camera, file) => `${API_NAVIGATOR_BASE}/${folder}/images/${camera}/${file}`,
        CALIBRATIONS: (folder, camera) =>
            `${API_NAVIGATOR_BASE}/${folder}/calibrations/${camera}.json`,
        CONFIG: {
            JOB: (folder) => `${API_NAVIGATOR_BASE}/${folder}/config/job-config.json`,
            CLASSES: (folder) => `${API_NAVIGATOR_BASE}/${folder}/config/classes-config.json`,
            OBJECTS: (folder) => `${API_NAVIGATOR_BASE}/${folder}/config/objects-config.json`,
            MODERATION: (folder) => `${API_NAVIGATOR_BASE}/${folder}/config/moderation-config.json`,
        },
        SOLUTION: {
            LABELS: (folder) => `${API_NAVIGATOR_BASE}/${folder}/labels.msgpack.lz4`,
            OBJECTS: (folder) => `${API_NAVIGATOR_BASE}/${folder}/objects.json`,
            MODERATION: (folder) => `${API_NAVIGATOR_BASE}/${folder}/moderation.json`,
        },
    },
};
