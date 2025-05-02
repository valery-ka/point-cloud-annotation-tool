import { useEffect } from "react";

import { useFileManager, useEditor, useFrames } from "contexts";

import * as APP_CONSTANTS from "constants";

const { SELECTION } = APP_CONSTANTS.HIDDEN_POSITION;

export const useEditorFrameSwitcher = (onFrameChanged) => {
    const { pcdFiles } = useFileManager();
    const { activeFrameIndex, arePointCloudsLoading } = useFrames();
    const { pointCloudRefs, setHasFilterSelectionPoint } = useEditor();

    // update geometry attributes (positions, sizes, colors) for active frame
    useEffect(() => {
        if (arePointCloudsLoading || !pcdFiles.length) return;

        pcdFiles.forEach((filePath, index) => {
            const pointCloud = pointCloudRefs.current[filePath];
            if (pointCloud) {
                pointCloud.visible = index === activeFrameIndex;
            }
        });

        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const activeFrameCloud = pointCloudRefs.current[activeFrameFilePath];

        const hasFilterSelectionPoint = activeFrameCloud.geometry.attributes.position.array.some(
            (coord) => coord === SELECTION,
        );
        setHasFilterSelectionPoint(hasFilterSelectionPoint);
        onFrameChanged?.();
    }, [activeFrameIndex, arePointCloudsLoading, pcdFiles]);
};
