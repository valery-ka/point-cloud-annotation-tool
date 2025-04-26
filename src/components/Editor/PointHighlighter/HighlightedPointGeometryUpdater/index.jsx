import { memo, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";

import {
    useCalibrations,
    useEditor,
    useFrames,
    useFileManager,
    useSettings,
    useHoveredPoint,
} from "contexts";

import {
    invalidateHighlighterPointsColor,
    invalidateHighlighterPointsSize,
    invalidateHighlighterPointsVisibility,
} from "utils/editor/";

const MS_TO_SEC = 1000;

export const HighlightedPointGeometryUpdater = memo(({ image }) => {
    const { pcdFiles } = useFileManager();
    const { projectedPointsRef } = useCalibrations();
    const { pointCloudRefs } = useEditor();
    const { activeFrameIndex } = useFrames();
    const { settings } = useSettings();
    const { highlightedPoint } = useHoveredPoint();

    const pointSize = useMemo(() => {
        return settings.editorSettings.highlighter.generalPointSize;
    }, [settings.editorSettings.highlighter.generalPointSize]);

    const highlighterFPS = useMemo(() => {
        return settings.editorSettings.performance.highlighterFPS;
    }, [settings.editorSettings.performance.highlighterFPS]);

    const lastFrameTimeRef = useRef(0);
    const FRAME_INTERVAL_MS = MS_TO_SEC / highlighterFPS;

    useFrame(({ clock }) => {
        const now = clock.elapsedTime * MS_TO_SEC;
        if (now - lastFrameTimeRef.current < FRAME_INTERVAL_MS) return;

        lastFrameTimeRef.current = now;

        if (!highlightedPoint) return;

        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const activeFrameCloudGeometry = pointCloudRefs.current[activeFrameFilePath].geometry;
        const projectedPoints = projectedPointsRef.current;
        const imageGeometry = projectedPoints[image.src].geometry;

        invalidateHighlighterPointsVisibility({
            cloudData: { geometry: activeFrameCloudGeometry, point: highlightedPoint },
            imageData: { image, projectedPoints },
        });
        invalidateHighlighterPointsColor({
            cloudData: { geometry: activeFrameCloudGeometry },
            imageData: { image, projectedPoints },
        });
        invalidateHighlighterPointsSize({
            imageData: { geometry: imageGeometry },
            sizeData: { defaultSize: pointSize },
        });
    });

    return null;
});
