import { useEffect, useRef, useCallback, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { isEmpty } from "lodash";
import { Vector2, Raycaster } from "three";

import {
    useFileManager,
    useEditor,
    useFrames,
    useSettings,
    useImages,
    useCalibrations,
    useTools,
} from "contexts";
import { useSubscribeFunction } from "hooks";

import { drawGlobalBox, drawCircleRuler, drawFrustumMesh, drawWireframe } from "utils/editor";
import { getIntrinsicParameters, getCameraWorldPosition } from "utils/calibrations";

import { DEFAULT_TOOL } from "constants";

export const useEditorHelpers = () => {
    const { gl, camera, scene } = useThree();
    const { settings } = useSettings();

    const { pcdFiles } = useFileManager();
    const { pointCloudRefs } = useEditor();
    const { selectedTool } = useTools();
    const { activeFrameIndex, arePointCloudsLoading } = useFrames();

    const { loadedImages, selectedCamera, setSelectedCamera } = useImages();
    const { calibrations } = useCalibrations();

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
    const raycasterRef = useRef(new Raycaster());
    const mouseRef = useRef(new Vector2());

    const showCameraPositions = useMemo(() => {
        return settings.editorSettings.images.cameraPositions;
    }, [settings.editorSettings.images.cameraPositions]);

    useEffect(() => {
        raycasterRef.current.params.Line.threshold = 0;
    }, []);

    const handleMouseDown = useCallback(
        (event) => {
            if (event.button !== 0) return;

            const { current: raycaster } = raycasterRef;
            const { current: mouse } = mouseRef;

            const canvas = event.currentTarget;
            const rect = canvas.getBoundingClientRect();

            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);

            const meshes = Object.values(cameraMeshes.current).filter((obj) => obj.isMesh);
            const intersects = raycaster.intersectObjects(meshes);

            mouseRef.current.downIntersect = intersects[0]?.object || null;
        },
        [camera],
    );

    const handleMouseUp = useCallback(
        (event) => {
            const { current: raycaster } = raycasterRef;
            const { current: mouse } = mouseRef;

            if (!mouse.downIntersect) return;

            const canvas = event.currentTarget;
            const rect = canvas.getBoundingClientRect();

            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);

            const meshes = Object.values(cameraMeshes.current).filter((obj) => obj.isMesh);
            const intersects = raycaster.intersectObjects(meshes);

            const isSameObject = intersects.some(
                (intersect) => intersect.object === mouse.downIntersect,
            );

            if (isSameObject && selectedTool === DEFAULT_TOOL) {
                const clickedCamera = Object.keys(cameraMeshes.current).find(
                    (name) => cameraMeshes.current[name] === mouse.downIntersect,
                );
                setSelectedCamera(clickedCamera);
            }

            mouseRef.current.downIntersect = null;
        },
        [selectedTool, camera],
    );

    useEffect(() => {
        const canvas = gl.domElement;
        canvas.addEventListener("mousedown", handleMouseDown);
        canvas.addEventListener("mouseup", handleMouseUp);

        return () => {
            canvas.removeEventListener("mousedown", handleMouseDown);
            canvas.removeEventListener("mouseup", handleMouseUp);
        };
    }, [handleMouseDown, handleMouseUp, gl.domElement]);

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

        Object.values(cameraMeshes.current).forEach((mesh) => scene.remove(mesh));
        cameraMeshes.current = {};

        if (!showCameraPositions) return;

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

        Object.entries(calibrations).forEach(([selectedCamera, calibration]) => {
            const { extrinsic, intrinsic } = calibration;
            if (!intrinsic || !extrinsic) return null;

            const { fy } = getIntrinsicParameters(intrinsic);
            const { position, rotation } = getCameraWorldPosition(extrinsic);
            const dimensions = cameraDimensions[selectedCamera];
            if (!dimensions) return;

            const { width, height } = dimensions;
            const aspect = width / height;
            const fovYRad = 2 * Math.atan(height / (2 * fy));

            const frustumMesh = drawFrustumMesh(fovYRad, aspect);
            const wireframe = drawWireframe(frustumMesh.geometry);

            frustumMesh.add(wireframe);
            frustumMesh.position.copy(position);
            frustumMesh.quaternion.copy(rotation);

            frustumMesh.userData.selectedCamera = selectedCamera;

            scene.add(frustumMesh);
            cameraMeshes.current[selectedCamera] = frustumMesh;
        });

        setCameraColor(selectedCamera);

        return () => {
            Object.values(cameraMeshes.current).forEach((obj) => scene.remove(obj));
        };
    }, [showCameraPositions, calibrations, loadedImages, scene]);

    return updateGlobalBox;
};
