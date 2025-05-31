import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";

import { useCuboids, useFileManager, useEditor } from "contexts";

import { useBatchEditorRenderer, useBatchEditorScene, useBatchModeCameras } from "hooks";

import { SIDE_VIEWS_GAP } from "constants";

export const useBatchEditor = (config) => {
    const { pcdFiles } = useFileManager();
    const { pointCloudRefs } = useEditor();
    const {
        selectedCuboid,
        selectedCuboidGeometryRef,
        batchMode,
        setBatchMode,
        batchEditorCameras,
    } = useCuboids();

    const BATCH_VIEWS = Object.values(batchEditorCameras);

    useBatchModeCameras();
    const { batchSceneRef } = useBatchEditorScene(config.handlers);
    const { canvasRef, containerRef, rendererRef } = useBatchEditorRenderer();

    useEffect(() => {
        const { filterFramePoints, handlePointCloudColors, handlePointsSize } = config.handlers;

        for (let frame = 0; frame < BATCH_VIEWS.length; frame++) {
            filterFramePoints(frame);
            handlePointCloudColors(null, frame);
            handlePointsSize(null, null, frame);
        }

        BATCH_VIEWS?.[0]?.[0].camera.position.set(3, 0, 1);
    }, [batchMode]);

    useFrame(() => {
        if (!rendererRef.current || !canvasRef.current || !batchMode) {
            canvasRef.current.style.display = "none";
            containerRef.current.style.display = "none";
            return;
        }

        const visible = selectedCuboid && selectedCuboidGeometryRef.current;
        canvasRef.current.style.display = visible ? "block" : "none";
        containerRef.current.style.display = visible ? "" : "none";

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        if (width !== rendererRef.current.width || height !== rendererRef.current.height) {
            rendererRef.current.setSize(width, height);
        }

        rendererRef.current.setScissorTest(true);

        const numFrames = BATCH_VIEWS.length;
        const viewsPerFrame = BATCH_VIEWS[0].length;
        const frameWidth = (width - SIDE_VIEWS_GAP * (numFrames - 1)) / numFrames;
        const viewHeight = (height - SIDE_VIEWS_GAP * (viewsPerFrame - 1)) / viewsPerFrame;

        if (frameWidth <= 0 || viewHeight <= 0) return;
        config.aspectRef.current = frameWidth / viewHeight;

        BATCH_VIEWS.forEach((frameViews, frameIdx) => {
            const filePath = pcdFiles[frameIdx];
            const cloud = pointCloudRefs.current[filePath];
            if (!cloud) return;

            batchSceneRef.current.children
                .filter((child) => child.userData.isPointCloud)
                .forEach((cloud) => batchSceneRef.current.remove(cloud));

            cloud.userData.isPointCloud = true;
            batchSceneRef.current.add(cloud);

            batchSceneRef.current.updateMatrixWorld(true);

            const x = frameIdx * (frameWidth + SIDE_VIEWS_GAP);
            frameViews.forEach((view, viewIdx) => {
                const y = height - (viewIdx + 1) * (viewHeight + SIDE_VIEWS_GAP) + SIDE_VIEWS_GAP;
                rendererRef.current.setViewport(x, y, frameWidth, viewHeight);
                rendererRef.current.setScissor(x, y, frameWidth, viewHeight);
                rendererRef.current.render(batchSceneRef.current, view.camera);
            });

            batchSceneRef.current.remove(cloud);
        });
    });

    // temp hook
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === "Tab") {
                setBatchMode((prev) => !prev);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);
};
