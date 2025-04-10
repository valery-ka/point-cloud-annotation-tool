import { useEffect, useRef, useCallback } from "react";
import { Vector3 } from "three";
import { useThree } from "@react-three/fiber";

import { useSettings, useHoveredPoint, useEvent } from "@contexts";
import { useBindHotkey } from "@hooks";

import { switchView, getPointPosition, getTargetPosition } from "@utils/camera";

export const useChangeTarget = (controlsRef, tweenGroup, requestPixelProjectionsUpdate) => {
    const { camera, gl } = useThree();

    const { settings } = useSettings();
    const { hotkeys } = settings;

    const { subscribe, unsubscribe } = useEvent();

    const { highlightedPoint } = useHoveredPoint();
    const highlightedPointRef = useRef(highlightedPoint);

    useEffect(() => {
        highlightedPointRef.current = highlightedPoint;
    }, [highlightedPoint]);

    const changeTarget = useCallback((event, position) => {
        const point = getPointPosition(highlightedPointRef.current, position);
        if (!point) return;

        const targetPos = getTargetPosition(camera, point, position);
        const targetTarget = new Vector3(point[0], point[1], point[2]);

        switchView(
            targetPos,
            targetTarget,
            camera,
            controlsRef.current,
            tweenGroup,
            requestPixelProjectionsUpdate,
        );
    }, []);

    useBindHotkey(hotkeys["camera"]["changeTarget"], changeTarget);

    const handleMouseWheelDown = useCallback((event) => {
        if (event.button === 1) {
            changeTarget();
        }
    }, []);

    useEffect(() => {
        gl.domElement.addEventListener("mousedown", handleMouseWheelDown);
        return () => {
            gl.domElement.addEventListener("mousedown", handleMouseWheelDown);
        };
    }, []);

    useEffect(() => {
        subscribe("switchCameraToIssue", (position) => changeTarget(null, position));

        return () => {
            unsubscribe("switchCameraToIssue", (position) => changeTarget(null, position));
        };
    }, [subscribe, unsubscribe]);
};
