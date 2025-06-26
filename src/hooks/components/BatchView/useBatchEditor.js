import { useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";

import { useCuboids, useFileManager, useEditor, useBatch } from "contexts";

import {
    useBatchEditorRenderer,
    useBatchEditorScene,
    useBatchModeCameras,
    useBatchCloudsUpdater,
    useBatchEditorGeometrySelector,
    useMousetrapPause,
    useSubscribeFunction,
} from "hooks";

import { SIDE_VIEWS_GAP } from "constants";
import { getBatchLayout } from "utils/cuboids";

export const useBatchEditor = ({ handlers, views }) => {
    const { pcdFiles } = useFileManager();
    const { pointCloudRefs } = useEditor();

    const { batchMode, setBatchMode, batchEditorCameras, selectedCuboidBatchGeometriesRef } =
        useBatch();
    const { selectedCuboid, selectedCuboidGeometryRef, cuboidsSolutionRef, cuboidsGeometriesRef } =
        useCuboids();

    const BATCH_CAMERAS = Object.values(batchEditorCameras);

    const [aspect, setAspect] = useState(null);

    useMousetrapPause(batchMode);
    useBatchEditorGeometrySelector(handlers);
    useBatchModeCameras({ aspect, views });
    useBatchCloudsUpdater({ handlers, cameras: BATCH_CAMERAS });
    const { batchSceneRef } = useBatchEditorScene({ handlers });
    const { canvasRef, containerRef, wrapperRef, rendererRef } = useBatchEditorRenderer();

    const updateVisibility = () => {
        if (!rendererRef.current || !canvasRef.current || !batchMode) {
            canvasRef.current.style.display = "none";
            containerRef.current.style.display = "none";
            return false;
        }

        const visible = selectedCuboid && selectedCuboidGeometryRef.current;
        canvasRef.current.style.display = visible ? "block" : "none";
        containerRef.current.style.display = visible ? "" : "none";

        return visible;
    };

    const updateRendererSize = () => {
        const height = wrapperRef.current.clientHeight;
        const width = wrapperRef.current.clientWidth;

        rendererRef.current.setSize(width, height);
        return { width, height };
    };

    const calculateViewportDimensions = (width, height) => {
        const numFrames = BATCH_CAMERAS.length;
        const viewsPerFrame = BATCH_CAMERAS[0].length;
        const { rows, framesPerRow } = getBatchLayout(numFrames);

        const frameWidth = (width - SIDE_VIEWS_GAP * (framesPerRow - 1)) / framesPerRow;
        const viewHeight =
            (height - SIDE_VIEWS_GAP * (viewsPerFrame * rows - 1)) / (viewsPerFrame * rows);

        if (frameWidth <= 0 || viewHeight <= 0) return null;

        setAspect(frameWidth / viewHeight);
        return { frameWidth, viewHeight, numFrames, viewsPerFrame, rows, framesPerRow };
    };

    const addCloudToScene = (frame, tempObjects) => {
        const filePath = pcdFiles[frame];
        const cloud = pointCloudRefs.current[filePath];
        if (!cloud) return;

        cloud.userData = { isPointCloud: true };
        batchSceneRef.current.add(cloud);
        tempObjects.push(cloud);
    };

    const addCuboidsToScene = (frame, tempObjects) => {
        const geometries = cuboidsGeometriesRef.current;
        const solution = cuboidsSolutionRef.current;

        const cuboids = solution[frame] || [];
        cuboids.forEach((cuboid) => {
            if (cuboid.id === selectedCuboid?.id || !cuboid.visible) return;

            const originalGeometry = geometries[cuboid.id]?.cube?.mesh;
            if (!originalGeometry) return;

            const meshClone = originalGeometry.clone();
            const { position, scale, rotation } = cuboid.psr;

            meshClone.position.set(position.x, position.y, position.z);
            meshClone.scale.set(scale.x, scale.y, scale.z);
            meshClone.rotation.set(rotation.x, rotation.y, rotation.z);

            meshClone.userData = { cuboidId: cuboid.id };
            batchSceneRef.current.add(meshClone);
            tempObjects.push(meshClone);
        });
    };

    const addBatchCuboidsToScene = (frame, tempObjects) => {
        const selectedBatchCuboid = selectedCuboidBatchGeometriesRef.current;
        if (!selectedBatchCuboid) return;

        const batchClone = selectedBatchCuboid[frame];

        batchSceneRef.current.add(batchClone);
        tempObjects.push(batchClone);
    };

    const renderBatches = (width, height, frameWidth, viewHeight, rows, framesPerRow) => {
        const viewsPerFrame = BATCH_CAMERAS[0].length;

        BATCH_CAMERAS.forEach((frameViews, frameIdx) => {
            const frame = frameViews[0].frame;
            const tempObjects = [];

            addCloudToScene(frame, tempObjects);
            addCuboidsToScene(frame, tempObjects);
            addBatchCuboidsToScene(frame, tempObjects);

            batchSceneRef.current.updateMatrixWorld(true);

            const row = rows === 2 && frameIdx >= framesPerRow ? 1 : 0;
            const col = rows === 2 ? frameIdx % framesPerRow : frameIdx;

            const x = col * (frameWidth + SIDE_VIEWS_GAP);
            frameViews.forEach((view, viewIdx) => {
                const rowOffset = row * (viewsPerFrame * (viewHeight + SIDE_VIEWS_GAP));
                const y =
                    height -
                    (viewIdx + 1 + rowOffset / (viewHeight + SIDE_VIEWS_GAP)) *
                        (viewHeight + SIDE_VIEWS_GAP) +
                    SIDE_VIEWS_GAP;

                rendererRef.current.setViewport(x, y, frameWidth, viewHeight);
                rendererRef.current.setScissor(x, y, frameWidth, viewHeight);
                rendererRef.current.render(batchSceneRef.current, view.camera);
            });

            tempObjects.forEach((obj) => batchSceneRef.current.remove(obj));
        });
    };

    useFrame(() => {
        if (!updateVisibility()) return;

        rendererRef.current.setScissorTest(true);
        const { width, height } = updateRendererSize();

        const dimensions = calculateViewportDimensions(width, height);
        if (!dimensions) return;

        renderBatches(
            width,
            height,
            dimensions.frameWidth,
            dimensions.viewHeight,
            dimensions.rows,
            dimensions.framesPerRow,
        );
    });

    //
    // Batch Mode activate / deactivate start
    const openBatchEditor = () => {
        setBatchMode(true);
    };

    useSubscribeFunction("openBatchMode", openBatchEditor, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === "Escape") {
                setBatchMode(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);
    // Batch Mode activate / deactivate end
    //
};
