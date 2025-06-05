import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { useCuboids, useEditor, useFileManager, useFrames } from "contexts";

import { getPointsInsideCuboid } from "utils/cuboids";

export const useUpdateCuboidInfoCard = () => {
    const { pcdFiles } = useFileManager();
    const { activeFrameIndex } = useFrames();
    const { pointCloudRefs } = useEditor();
    const { selectedCuboid, selectedCuboidGeometryRef, selectedCuboidInfoRef } = useCuboids();

    const prevFrameRef = useRef(activeFrameIndex);
    const prevCuboidRef = useRef(selectedCuboid?.id);
    const prevLabelRef = useRef(null);

    useFrame(() => {
        const geometry = selectedCuboidGeometryRef.current;
        if (!geometry) {
            selectedCuboidInfoRef.current.selected = false;
            return;
        }

        const { position, scale, rotation, quaternion } = geometry;
        const { label } = geometry.userData;

        const newPosition = [position.x, position.y, position.z];
        const newScale = [scale.x, scale.y, scale.z];
        const newRotation = [rotation.x, rotation.y, rotation.z];

        const info = selectedCuboidInfoRef.current;

        const frameChanged = prevFrameRef.current !== activeFrameIndex;
        const cuboidChanged = prevCuboidRef.current !== selectedCuboid?.id;
        const labelChanged = prevLabelRef.current !== label;
        const positionChanged = !newPosition.every((v, i) => v === info.position[i]);
        const scaleChanged = !newScale.every((v, i) => v === info.scale[i]);
        const rotationChanged = !newRotation.every((v, i) => v === info.rotation[i]);

        const cardNeedsUpdate =
            positionChanged ||
            scaleChanged ||
            rotationChanged ||
            frameChanged ||
            cuboidChanged ||
            labelChanged;

        if (cardNeedsUpdate) {
            prevFrameRef.current = activeFrameIndex;
            prevCuboidRef.current = selectedCuboid?.id;
            prevLabelRef.current = label;

            info.position = newPosition;
            info.scale = newScale;
            info.rotation = newRotation;
            info.selected = true;

            const activeFrameFilePath = pcdFiles[activeFrameIndex];
            const activeFrame = pointCloudRefs.current[activeFrameFilePath];
            if (!activeFrame) return;

            const positions = activeFrame.geometry.attributes.position.array;

            const insidePoints = getPointsInsideCuboid(positions, position, quaternion, scale);
            const insidePointsCount = insidePoints.length;
            if (insidePointsCount !== info.insidePointsCount) {
                info.insidePointsCount = insidePointsCount;
            }
        }
    });
};
