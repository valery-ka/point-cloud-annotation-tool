import { useEffect, useRef } from "react";

import { useFileManager, useEditor, useFrames, useBatch, useLoading } from "contexts";

import { useThree } from "@react-three/fiber";

import * as APP_CONSTANTS from "constants";

const { SELECTION } = APP_CONSTANTS.HIDDEN_POSITION;

export const useEditorFrameSwitcher = (onFrameChanged) => {
    const { gl, camera, scene } = useThree();

    const { pcdFiles } = useFileManager();
    const { activeFrameIndex } = useFrames();
    const { globalIsLoading } = useLoading();
    const { pointCloudRefs, setHasFilterSelectionPoint } = useEditor();
    const { batchMode } = useBatch();

    const previousFrameRef = useRef(null);

    useEffect(() => {
        if (globalIsLoading || !pcdFiles.length) return;

        const newFilePath = pcdFiles[activeFrameIndex];
        const newPointCloud = pointCloudRefs.current[newFilePath];

        if (previousFrameRef.current && scene.children.includes(previousFrameRef.current)) {
            scene.remove(previousFrameRef.current);
            previousFrameRef.current.geometry?.dispose();
        }

        if (newPointCloud) {
            scene.add(newPointCloud);

            scene.updateMatrixWorld(true);
            gl.render(scene, camera);

            previousFrameRef.current = newPointCloud;

            const hasFilterSelectionPoint = newPointCloud.geometry.attributes.position.array.some(
                (coord) => coord === SELECTION,
            );
            setHasFilterSelectionPoint(hasFilterSelectionPoint);
        }

        onFrameChanged?.();
    }, [activeFrameIndex, globalIsLoading, pcdFiles, batchMode]);
};
