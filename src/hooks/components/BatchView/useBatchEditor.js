import { useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";

import { useCuboids, useFileManager, useEditor } from "contexts";

import {
    useBatchEditorRenderer,
    useBatchEditorScene,
    useBatchModeCameras,
    useBatchCloudsUpdater,
} from "hooks";

import { SIDE_VIEWS_GAP } from "constants";

export const useBatchEditor = ({ handlers, views }) => {
    const { pcdFiles } = useFileManager();
    const { pointCloudRefs } = useEditor();

    const { batchMode, setBatchMode, batchEditorCameras } = useCuboids();
    const { selectedCuboid, selectedCuboidGeometryRef } = useCuboids();
    const { cuboidsSolutionRef, cuboidsGeometriesRef } = useCuboids();

    const BATCH_CAMERAS = Object.values(batchEditorCameras);

    const [aspect, setAspect] = useState(null);

    useBatchModeCameras({ aspect, views });
    useBatchCloudsUpdater({ handlers, cameras: BATCH_CAMERAS });
    const { batchSceneRef } = useBatchEditorScene({ handlers });
    const { canvasRef, containerRef, rendererRef } = useBatchEditorRenderer();

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
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        if (width !== rendererRef.current.width || height !== rendererRef.current.height) {
            rendererRef.current.setSize(width, height);
        }

        return { width, height };
    };

    const calculateViewportDimensions = (width, height) => {
        const numFrames = BATCH_CAMERAS.length;
        const viewsPerFrame = BATCH_CAMERAS[0].length;
        const frameWidth = (width - SIDE_VIEWS_GAP * (numFrames - 1)) / numFrames;
        const viewHeight = (height - SIDE_VIEWS_GAP * (viewsPerFrame - 1)) / viewsPerFrame;

        if (frameWidth <= 0 || viewHeight <= 0) return null;

        setAspect(frameWidth / viewHeight);
        return { frameWidth, viewHeight, numFrames, viewsPerFrame };
    };

    const addCloudToScene = (frameIdx, tempObjects) => {
        const filePath = pcdFiles[frameIdx];
        const cloud = pointCloudRefs.current[filePath];
        if (!cloud) return;

        cloud.userData = { isPointCloud: true };
        batchSceneRef.current.add(cloud);
        tempObjects.push(cloud);
    };

    const addCuboidsToScene = (frameIdx, tempObjects) => {
        const geometries = cuboidsGeometriesRef.current;
        const solution = cuboidsSolutionRef.current;

        const cuboids = solution[frameIdx] || [];
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

    const renderBatches = (width, height, frameWidth, viewHeight) => {
        BATCH_CAMERAS.forEach((frameViews, frameIdx) => {
            const tempObjects = [];

            addCuboidsToScene(frameIdx, tempObjects);
            addCloudToScene(frameIdx, tempObjects);

            batchSceneRef.current.updateMatrixWorld(true);

            const x = frameIdx * (frameWidth + SIDE_VIEWS_GAP);
            frameViews.forEach((view, viewIdx) => {
                const y = height - (viewIdx + 1) * (viewHeight + SIDE_VIEWS_GAP) + SIDE_VIEWS_GAP;
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

        renderBatches(width, height, dimensions.frameWidth, dimensions.viewHeight);
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
