import { useEffect } from "react";

import { useCuboids } from "contexts";

export const useBatchCloudsUpdater = ({ handlers, cameras }) => {
    const { batchMode } = useCuboids();

    useEffect(() => {
        const { filterFramePoints, handlePointCloudColors, handlePointsSize } = handlers;

        for (let frame = 0; frame < cameras.length; frame++) {
            filterFramePoints(frame);
            handlePointCloudColors(null, frame);
            handlePointsSize(null, null, frame);
        }
    }, [batchMode]);
};
