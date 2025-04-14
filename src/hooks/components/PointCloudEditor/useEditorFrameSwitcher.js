import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";

import { useFileManager, useEditor, useFrames } from "contexts";

import * as APP_CONSTANTS from "constants";

const { SELECTION } = APP_CONSTANTS.HIDDEN_POSITION;

export const useEditorFrameSwitcher = (onFrameChanged) => {
    const { pcdFiles } = useFileManager();
    const { activeFrameIndex, areFramesLoading } = useFrames();
    const {
        pointCloudRefs,
        originalPositionsRef,
        activeFramePositionsRef,
        setHasFilterSelectionPoint,
    } = useEditor();

    // update active frame ref to keep current frame points positions
    // update geometry attributes (positions, sizes, colors) for active frame
    useEffect(() => {
        if (areFramesLoading || !pcdFiles.length) return;

        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const activeFrameRef = pointCloudRefs.current[activeFrameFilePath];

        if (activeFrameRef && originalPositionsRef.current[activeFrameFilePath]) {
            activeFramePositionsRef.current = activeFrameRef.geometry.attributes.position.array;
        }

        const hasFilterSelectionPoint = activeFramePositionsRef.current.some(
            (coord) => coord === SELECTION,
        );
        setHasFilterSelectionPoint(hasFilterSelectionPoint);
        onFrameChanged?.();
    }, [activeFrameIndex, pointCloudRefs, areFramesLoading, pcdFiles]);

    // hide previous frame, show active frame
    useFrame(() => {
        if (areFramesLoading || !pcdFiles.length) return;
        pcdFiles.forEach((filePath, index) => {
            const pointCloud = pointCloudRefs.current[filePath];
            if (pointCloud) {
                pointCloud.visible = index === activeFrameIndex;
            }
        });
    });
};
