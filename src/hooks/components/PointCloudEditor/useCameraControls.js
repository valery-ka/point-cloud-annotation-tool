import { useEffect, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Group } from "@tweenjs/tween.js";

import { useEvent, useEditor, useTools, useSettings, useHoveredPoint } from "contexts";
import { useSubscribeFunction, useChangeTarget } from "hooks";

import { getToolsConfig } from "tools";
import { CameraControls, createCameraViews } from "utils/camera";
import { DISTANCE_TO_CENTER, LAYERS } from "constants";

const tweenGroup = new Group();

export const useCameraControls = (requestPixelProjectionsUpdate) => {
    const { camera, gl } = useThree();

    const { settings } = useSettings();
    const { cameraControlsRef, setPixelProjections } = useEditor();
    const { subscribe, unsubscribe } = useEvent();
    const { selectedTool, isDrawing } = useTools();
    const { setHighlightedPoint } = useHoveredPoint();

    // setup camera and camera controls
    useEffect(() => {
        if (!cameraControlsRef.current) {
            const { navigation } = settings.editorSettings;

            camera.position.set(-DISTANCE_TO_CENTER, 0, DISTANCE_TO_CENTER);
            camera.up.set(0, 0, 1);

            cameraControlsRef.current = new CameraControls(camera, gl.domElement);
            cameraControlsRef.current.zoomSpeed = navigation.zoomSpeed;
            cameraControlsRef.current.keyPanSpeed = navigation.keyPanSpeed;
            cameraControlsRef.current.minDistance = 0.5;
            cameraControlsRef.current.maxDistance = 500;
        }

        const onMouseDown = () => {
            tweenGroup.removeAll();
        };

        const onMouseWheel = () => {
            tweenGroup.removeAll();
        };

        gl.domElement.addEventListener("pointerdown", onMouseDown);
        gl.domElement.addEventListener("wheel", onMouseWheel);

        return () => {
            gl.domElement.removeEventListener("pointerdown", onMouseDown);
            gl.domElement.removeEventListener("wheel", onMouseWheel);
        };
    }, []);

    // setup controls events

    // clear projections when any camera action starts
    // to prevent keeping projections of previous camera position
    const onStart = useCallback(() => {
        // setPixelProjections(new Float32Array());
        // setHighlightedPoint(null);
    }, []);

    const onChange = useCallback(() => {
        setPixelProjections((prev) => (prev.length === 0 ? prev : new Float32Array()));
        setHighlightedPoint((prev) => (prev === null ? prev : null));
    }, []);

    // update projections when any camera action ends
    const onEnd = useCallback(() => {
        requestPixelProjectionsUpdate();
    }, []);

    useEffect(() => {
        cameraControlsRef.current.addEventListener("end", onEnd);
        cameraControlsRef.current.addEventListener("change", onChange);
        cameraControlsRef.current.addEventListener("start", onStart);

        return () => {
            cameraControlsRef.current.removeEventListener("end", onEnd);
            cameraControlsRef.current.removeEventListener("change", onChange);
            cameraControlsRef.current.removeEventListener("start", onStart);
        };
    }, []);

    const handleNavigationChange = useCallback((data) => {
        const value = data.value;
        const setting = data.settingKey;
        cameraControlsRef.current[setting] = value;
    }, []);

    useSubscribeFunction("navigationChange", handleNavigationChange, []);

    // setup camera presets for camera commands (i.g. top view, origin view)
    useChangeTarget(cameraControlsRef, tweenGroup, () => {
        onEnd();
    });

    useEffect(() => {
        camera.layers.set(LAYERS.SECONDARY);
        camera.layers.enable(LAYERS.MAIN);

        const cameraViews = createCameraViews(camera, cameraControlsRef.current, tweenGroup, () => {
            onEnd();
        });

        Object.entries(cameraViews).forEach(([event, handler]) => {
            const wrappedHandler = (e) => {
                onStart();
                handler(e);
            };
            subscribe(event, wrappedHandler);
        });

        return () => {
            Object.entries(cameraViews).forEach(([event, handler]) => {
                const wrappedHandler = (e) => {
                    onStart();
                    handler(e);
                };
                unsubscribe(event, wrappedHandler);
            });
        };
    }, [camera, subscribe, unsubscribe]);

    // setup controls behaviour for each selection tool when it's active
    useEffect(() => {
        if (cameraControlsRef.current) {
            const config = getToolsConfig(selectedTool, isDrawing);
            cameraControlsRef.current.enabledButtons.leftButton = config.enabledButtons.leftButton;
            cameraControlsRef.current.enabledButtons.rightButton =
                config.enabledButtons.rightButton;
            cameraControlsRef.current.enableZoom = config.enableZoom;
            cameraControlsRef.current.enabledKeys = config.enabledKeys;
        }
    }, [selectedTool, isDrawing]);

    // important for camera tween animation
    useFrame(() => {
        tweenGroup.update(Date.now());
    });
};
