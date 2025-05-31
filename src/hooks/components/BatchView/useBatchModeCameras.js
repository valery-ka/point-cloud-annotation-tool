import { useEffect, useState } from "react";
import { Euler } from "three";

import { useCuboids } from "contexts";

import { setupCamera, getOrientationQuaternion } from "utils/cuboids";

export const useBatchModeCameras = () => {
    const { setBatchEditorCameras } = useCuboids();

    const [viewsCount, setViewsCount] = useState(5);

    const VIEW_CONFIGS = [
        {
            name: "top",
            scaleOrder: ["x", "y", "z"],
            getOrientation: () => getOrientationQuaternion(new Euler(0, 0, -Math.PI / 2)),
        },
        {
            name: "left",
            scaleOrder: ["z", "x", "y"],
            getOrientation: () => getOrientationQuaternion(new Euler(Math.PI / 2, 0, 0)),
        },
        {
            name: "front",
            scaleOrder: ["y", "z", "x"],
            getOrientation: () => getOrientationQuaternion(new Euler(Math.PI / 2, -Math.PI / 2, 0)),
        },
    ];

    useEffect(() => {
        const batchFramesList = {};
        for (let i = 0; i < viewsCount; i++) {
            batchFramesList[i] = VIEW_CONFIGS.map((config) => {
                const batchName = `batch_${config.name}`;
                return {
                    ...config,
                    name: batchName,
                    camera: setupCamera(batchName),
                    frame: i,
                };
            });
        }
        setBatchEditorCameras(batchFramesList);
    }, [viewsCount]);
};
