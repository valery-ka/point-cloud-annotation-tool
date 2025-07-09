import { LineBasicMaterial, LineSegments } from "three";

import { useMemo, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";

import { useCuboids, useCalibrations, useImages, useSettings } from "contexts";

import { getProjectedCuboidGeometry } from "utils/cuboids";
import { getCalibrationByUrl, buildImageCuboidsGeometry } from "utils/calibrations";

export const ImageSceneCuboids = ({ image, scale = 1 }) => {
    const { scene } = useThree();

    const { settings } = useSettings();
    const { imagesByCamera } = useImages();
    const { cuboidsGeometriesRef, selectedCuboid, updateProjectedCuboidsRef } = useCuboids();
    const { calibrations, projectedCuboidsRef } = useCalibrations();

    const distortionThreshold = useMemo(() => {
        return settings.editorSettings.images.distortionThreshold;
    }, [settings.editorSettings.images.distortionThreshold]);

    const projectedCuboids = useMemo(() => {
        return settings.editorSettings.images.projectedCuboids;
    }, [settings.editorSettings.images.projectedCuboids]);

    const createCuboidLines = (cube) => {
        if (cube.visible) {
            const calibration = getCalibrationByUrl(image?.src, imagesByCamera, calibrations) ?? {};

            const cuboidEdges = getProjectedCuboidGeometry(cube);

            const geometry = buildImageCuboidsGeometry(
                image,
                calibration,
                distortionThreshold,
                cuboidEdges,
            );
            const material = new LineBasicMaterial({
                color: cube.userData.color,
            });

            const lines = new LineSegments(geometry, material);
            lines.scale.set(scale, scale, 1);
            lines.name = cube.name;

            return lines;
        }
    };

    const cleanupProjectedCuboids = () => {
        Object.values(projectedCuboidsRef.current).forEach((lines) => {
            scene.remove(lines);
            lines.geometry?.dispose();
            lines.material?.dispose();
        });
        projectedCuboidsRef.current = {};
    };

    const updateAllCuboids = () => {
        if (updateProjectedCuboidsRef.current) {
            cleanupProjectedCuboids();

            const cuboids = cuboidsGeometriesRef.current;
            for (const cuboid of Object.values(cuboids)) {
                const obj = cuboid.cube.mesh;
                if (!projectedCuboidsRef.current[obj.name]) {
                    const lines = createCuboidLines(obj);
                    if (lines) {
                        projectedCuboidsRef.current[obj.name] = lines;
                        scene.add(lines);
                    }
                }
            }

            updateProjectedCuboidsRef.current = false;
        }
    };

    const updateSelectedCuboid = ({ id }) => {
        if (!id && updateProjectedCuboidsRef.current) return;

        if (projectedCuboidsRef.current[id]) {
            const oldLines = projectedCuboidsRef.current[id];
            scene.remove(oldLines);
            oldLines.geometry?.dispose();
            oldLines.material?.dispose();
            delete projectedCuboidsRef.current[id];
        }

        const cuboid = cuboidsGeometriesRef.current[id];

        if (cuboid) {
            const lines = createCuboidLines(cuboid.cube.mesh);
            if (lines) {
                projectedCuboidsRef.current[id] = lines;
                scene.add(lines);
            }
        }
    };

    useEffect(() => {
        return () => {
            cleanupProjectedCuboids();
        };
    }, []);

    useEffect(() => {
        updateProjectedCuboidsRef.current = true;
    }, [image, scale, projectedCuboids]);

    useFrame(() => {
        switch (projectedCuboids) {
            case "all":
                updateSelectedCuboid({ id: selectedCuboid?.id });
                updateAllCuboids();
                break;
            case "selected":
                cleanupProjectedCuboids();
                updateSelectedCuboid({ id: selectedCuboid?.id });
                break;
            case "none":
                cleanupProjectedCuboids();
                break;
            default:
                break;
        }
    });

    return null;
};
