import { useEffect, useRef, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Group } from "@tweenjs/tween.js";

import { useEvent, useEditor, useTools, useSettings, useHoveredPoint } from "contexts";
import { useSubscribeFunction, useChangeTarget } from "hooks";

import { getToolsConfig } from "tools";
import { CameraControls, createCameraViews } from "utils/camera";
import * as APP_CONSTANTS from "constants";

const tweenGroup = new Group();
const { DISTANCE_TO_CENTER } = APP_CONSTANTS;

export const useCameraControls = (requestPixelProjectionsUpdate) => {
    const { camera, gl } = useThree();

    const { settings } = useSettings();
    const { setPixelProjections } = useEditor();
    const { subscribe, unsubscribe } = useEvent();
    const { selectedTool, isDrawing } = useTools();
    const { setHighlightedPoint } = useHoveredPoint();

    const controlsRef = useRef(null);

    // setup camera and camera controls
    useEffect(() => {
        if (!controlsRef.current) {
            const { navigation } = settings.editorSettings;

            camera.position.set(-DISTANCE_TO_CENTER, 0, DISTANCE_TO_CENTER);
            camera.up.set(0, 0, 1);

            controlsRef.current = new CameraControls(camera, gl.domElement);
            controlsRef.current.zoomSpeed = navigation.zoomSpeed;
            controlsRef.current.keyPanSpeed = navigation.keyPanSpeed;
            controlsRef.current.minDistance = 0.5;
            controlsRef.current.maxDistance = 500;
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
        controlsRef.current.addEventListener("end", onEnd);
        controlsRef.current.addEventListener("change", onChange);
        controlsRef.current.addEventListener("start", onStart);

        return () => {
            controlsRef.current.removeEventListener("end", onEnd);
            controlsRef.current.removeEventListener("change", onChange);
            controlsRef.current.removeEventListener("start", onStart);
        };
    }, []);

    const handleNavigationChange = useCallback((data) => {
        const value = data.value;
        const setting = data.settingKey;
        controlsRef.current[setting] = value;
    }, []);

    useSubscribeFunction("navigationChange", handleNavigationChange, []);

    // setup camera presets for camera commands (i.g. top view, origin view)
    useChangeTarget(controlsRef, tweenGroup, () => {
        onEnd();
    });

    useEffect(() => {
        const cameraViews = createCameraViews(camera, controlsRef.current, tweenGroup, () => {
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
    }, [subscribe, unsubscribe]);

    // setup controls behaviour for each selection tool when it's active
    useEffect(() => {
        if (controlsRef.current) {
            const config = getToolsConfig(selectedTool, isDrawing);
            controlsRef.current.enabledButtons.leftButton = config.enabledButtons.leftButton;
            controlsRef.current.enabledButtons.rightButton = config.enabledButtons.rightButton;
            controlsRef.current.enableZoom = config.enableZoom;
            controlsRef.current.enabledKeys = config.enabledKeys;
        }
    }, [selectedTool, isDrawing]);

    // important for camera tween animation
    useFrame(() => {
        tweenGroup.update(Date.now());
    });
};
