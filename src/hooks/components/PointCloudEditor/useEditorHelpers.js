import { useEffect, useRef, useCallback, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { isEmpty } from "lodash";

import {
    useFileManager,
    useEditor,
    useFrames,
    useSettings,
    useImages,
    useCalibrations,
} from "contexts";
import { useSubscribeFunction, useRaycastClickSelect } from "hooks";

import {
    drawGlobalBox,
    drawCircleRuler,
    drawFrustumMesh,
    drawWireframe,
    drawAxesHelper,
} from "utils/editor";
import { getIntrinsicParameters, getCameraWorldPosition } from "utils/calibrations";

import { LAYERS, HIDDEN_POINT } from "constants";

export const useEditorHelpers = () => {
    const { scene } = useThree();
    const { settings } = useSettings();

    const { pcdFiles } = useFileManager();
    const { pointCloudRefs } = useEditor();
    const { activeFrameIndex, arePointCloudsLoading } = useFrames();

    const { loadedImages, selectedCamera, setSelectedCamera } = useImages();
    const { calibrations } = useCalibrations();

    // Axes
    useEffect(() => {
        const axes = drawAxesHelper();
        axes.layers.set(LAYERS.SECONDARY);
        scene.add(axes);
    }, [scene]);

    // Global Box
    const boundingBoxRef = useRef(null);
    const isBoxActive = useRef(settings.activeButtons.toggleGlobalBox);

    const updateGlobalBox = useCallback(() => {
        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const activeFrameCloud = pointCloudRefs.current[activeFrameFilePath];

        drawGlobalBox(
            activeFrameCloud?.geometry?.attributes?.position?.array,
            scene,
            boundingBoxRef,
            isBoxActive.current,
        );
    }, [pcdFiles, activeFrameIndex, arePointCloudsLoading]);

    const toggleGlobalBox = useCallback(() => {
        const activeFrameFilePath = pcdFiles[activeFrameIndex];
        const activeFrameCloud = pointCloudRefs.current[activeFrameFilePath];

        isBoxActive.current = !isBoxActive.current;
        drawGlobalBox(
            activeFrameCloud?.geometry?.attributes?.position?.array,
            scene,
            boundingBoxRef,
            isBoxActive.current,
        );
    }, [pcdFiles, activeFrameIndex, arePointCloudsLoading]);

    useSubscribeFunction("toggleGlobalBox", toggleGlobalBox, []);

    // Circle Ruler
    const circleRulerRef = useRef(null);
    const isCircleRulerActive = useRef(settings.activeButtons.toggleCircleRuler);

    const toggleCircleRuler = useCallback(() => {
        isCircleRulerActive.current = !isCircleRulerActive.current;
        drawCircleRuler(scene, circleRulerRef, isCircleRulerActive.current);
    }, []);

    useSubscribeFunction("toggleCircleRuler", toggleCircleRuler, []);

    useEffect(() => {
        drawCircleRuler(scene, circleRulerRef, isCircleRulerActive.current);
    }, []);

    // Camera Helpers
    const DEFAULT_COLOR = 0x0084ff;
    const SELECTED_COLOR = 0xffd500;

    const cameraMeshes = useRef({});

    const showCameraPositions = useMemo(() => {
        return settings.editorSettings.images.cameraPositions;
    }, [settings.editorSettings.images.cameraPositions]);

    useRaycastClickSelect({
        getMeshMap: () => cameraMeshes.current,
        onSelect: setSelectedCamera,
        groupKey: "camera",
    });

    const setCameraColor = useCallback((selectedCamera) => {
        if (!cameraMeshes.current) return;

        Object.entries(cameraMeshes.current).forEach(([camera, { material, children }]) => {
            const color = camera === selectedCamera ? SELECTED_COLOR : DEFAULT_COLOR;
            material.color.set(color);
            children[0].material.color.set(color);
        });
    }, []);

    useEffect(() => {
        setCameraColor(selectedCamera);
    }, [selectedCamera]);

    useEffect(() => {
        if (!calibrations || !scene || isEmpty(loadedImages)) return;

        const cameraDimensions = {};

        const cameraTypeRegex = /images\/([^\/]+)\/\d+\.jpg$/;

        Object.values(loadedImages).forEach((imageData) => {
            const match = imageData.src.match(cameraTypeRegex);
            if (match && match[1]) {
                const cameraType = match[1];
                if (!cameraDimensions[cameraType]) {
                    cameraDimensions[cameraType] = {
                        width: imageData.width,
                        height: imageData.height,
                    };
                }
            }
        });

        Object.entries(calibrations).forEach(([camera, calibration]) => {
            const { extrinsic, intrinsic } = calibration;
            if (!intrinsic || !extrinsic) return;

            const dimensions = cameraDimensions[camera];
            if (!dimensions) return;

            const existing = cameraMeshes.current[camera];
            if (existing) {
                if (showCameraPositions) {
                    const { position } = existing.userData;
                    existing.visible = true;
                    existing.position.copy(position);
                } else {
                    existing.visible = false;
                    existing.position.set(HIDDEN_POINT, HIDDEN_POINT, HIDDEN_POINT);
                }
                return;
            }

            const { fy } = getIntrinsicParameters(intrinsic);
            const { width, height } = dimensions;
            const aspect = width / height;
            const fovYRad = 2 * Math.atan(height / (2 * fy));

            const frustumMesh = drawFrustumMesh(fovYRad, aspect);
            const wireframe = drawWireframe(frustumMesh.geometry);

            frustumMesh.layers.set(LAYERS.SECONDARY);
            wireframe.layers.set(LAYERS.SECONDARY);

            frustumMesh.add(wireframe);

            const { position, rotation } = getCameraWorldPosition(extrinsic);
            frustumMesh.position.copy(position);
            frustumMesh.quaternion.copy(rotation);

            frustumMesh.userData.camera = camera;
            frustumMesh.userData.position = position;

            if (!showCameraPositions) {
                frustumMesh.visible = false;
                frustumMesh.position.set(HIDDEN_POINT, HIDDEN_POINT, HIDDEN_POINT);
            }

            scene.add(frustumMesh);
            cameraMeshes.current[camera] = frustumMesh;
        });

        setCameraColor(selectedCamera);
    }, [showCameraPositions, calibrations, loadedImages, scene]);

    return updateGlobalBox;
};
