import { useFrame } from "@react-three/fiber";

import { useEffect, useCallback } from "react";

import { useCuboids, useEditor, useFileManager, useFrames, useEvent } from "contexts";
import { useTransformControls, useRaycastClickSelect, useOrthographicView } from "hooks";
import { useHoveredCuboid } from "./useHoveredCuboid";

import { getPointsInsideCuboid } from "utils/cuboids";

import { TABS } from "constants";

export const useCuboidManager = () => {
    const { pcdFiles } = useFileManager();
    const { activeFrameIndex } = useFrames();
    const { publish } = useEvent();
    const { pointCloudRefs, cameraControlsRef, transformControlsRef } = useEditor();
    const {
        cuboids,
        cuboidsGeometriesRef,
        selectedCuboid,
        selectedCuboidGeometryRef,
        selectedCuboidInfoRef,
        sideViewsCamerasNeedUpdateRef,
        setSelectedCuboid,
        setKeyFramesIndices,
        cuboidsSolutionRef,
    } = useCuboids();

    const findkeyFrameIndices = useCallback(() => {
        if (selectedCuboidGeometryRef.current) {
            const id = selectedCuboidGeometryRef.current.name;
            const indices = [];

            for (const [frameIndex, frameSolution] of Object.entries(cuboidsSolutionRef.current)) {
                for (const cuboid of Object.values(frameSolution)) {
                    if (cuboid.id === id && cuboid.manual) {
                        indices.push(Number(frameIndex));
                        break;
                    }
                }
            }

            setKeyFramesIndices(indices);
        }
    }, []);

    useOrthographicView();
    useTransformControls({ findkeyFrameIndices });

    const onCuboidSelect = useCallback(
        (id) => {
            const geometry = cuboidsGeometriesRef.current[id].cube.mesh;
            selectedCuboidGeometryRef.current = geometry;
            transformControlsRef.current.detach();
            cameraControlsRef.current.enabled = true;
            sideViewsCamerasNeedUpdateRef.current = true;
            setSelectedCuboid(cuboids.find((cube) => cube.id === id));
            findkeyFrameIndices();
            publish("setActiveTab", TABS.OBJECT_CARD);
        },
        [cuboids],
    );

    const unselectCuboid = useCallback(() => {
        transformControlsRef.current.detach();
        selectedCuboidGeometryRef.current = null;
        cameraControlsRef.current.enabled = true;
        setKeyFramesIndices([]);
    }, []);

    useHoveredCuboid({
        meshMap: () => {
            const meshMap = {};
            for (const id in cuboidsGeometriesRef.current) {
                meshMap[id] = cuboidsGeometriesRef.current[id].cube.mesh;
            }
            return meshMap;
        },
    });

    useRaycastClickSelect({
        getMeshMap: () => {
            const meshMap = {};
            for (const id in cuboidsGeometriesRef.current) {
                meshMap[id] = cuboidsGeometriesRef.current[id].cube.mesh;
            }
            return meshMap;
        },
        onSelect: onCuboidSelect,
        groupKey: "cuboid",
    });

    useEffect(() => {
        const id = selectedCuboid?.id;
        id ? onCuboidSelect(id) : unselectCuboid();
    }, [selectedCuboid?.id]);

    useEffect(() => {
        const geometries = cuboidsGeometriesRef.current;

        Object.values(geometries).forEach((entry) => {
            const cube = entry.cube?.mesh;
            if (!cube) return;

            const psrByFrame = cube.userData.psrByFrame;
            if (!psrByFrame) return;

            const frameData = psrByFrame[activeFrameIndex];

            if (frameData) {
                cube.position.copy(frameData.position);
                cube.scale.copy(frameData.scale);
                cube.rotation.copy(frameData.rotation);
            }
        });

        sideViewsCamerasNeedUpdateRef.current = true;
    }, [activeFrameIndex]);

    // update info card
    useFrame(() => {
        const geometry = selectedCuboidGeometryRef.current;
        if (!geometry) {
            selectedCuboidInfoRef.current.selected = false;
            return;
        }

        const { position, scale, rotation, quaternion } = geometry;
        const newPosition = [position.x, position.y, position.z];
        const newScale = [scale.x, scale.y, scale.z];
        const newRotation = [rotation.x, rotation.y, rotation.z];

        const info = selectedCuboidInfoRef.current;

        const positionChanged = !newPosition.every((v, i) => v === info.position[i]);
        const scaleChanged = !newScale.every((v, i) => v === info.scale[i]);
        const rotationChanged = !newRotation.every((v, i) => v === info.rotation[i]);

        if (positionChanged || scaleChanged || rotationChanged) {
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
