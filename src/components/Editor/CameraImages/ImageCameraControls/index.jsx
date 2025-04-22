import * as THREE from "three";

import { useThree } from "@react-three/fiber";
import { useEffect, useRef, useCallback } from "react";

import { useImages } from "contexts";

const MIN_ZOOM = 1;
const MAX_ZOOM = 10;
const ZOOM_STEP = 0.3;
const PAN_SPEED = 2;
const TEMPORARY_PADDING = 0;

export const ImageCameraControls = ({ image, size, enabled = true, normXY = null }) => {
    const { camera, gl } = useThree();
    const { selectedCamera } = useImages();

    const zoomRef = useRef(1);
    const boundsRef = useRef(null);
    const prevSizeRef = useRef(null);

    const isDraggingRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });

    const calculateCameraBounds = useCallback(
        (viewWidth, viewHeight) => {
            const zoom = zoomRef.current;
            const halfViewWidth = (camera.right - camera.left) / 2 / zoom;
            const halfViewHeight = (camera.top - camera.bottom) / 2 / zoom;

            return {
                minX: -viewWidth / 2 + halfViewWidth,
                maxX: viewWidth / 2 - halfViewWidth,
                minY: -viewHeight / 2 + halfViewHeight,
                maxY: viewHeight / 2 - halfViewHeight,
            };
        },
        [camera],
    );

    const clampCameraPosition = useCallback(() => {
        const bounds = boundsRef.current;
        if (!bounds) return;

        const { minX, maxX, minY, maxY } = calculateCameraBounds(bounds.width, bounds.height);

        camera.position.x = Math.min(Math.max(camera.position.x, minX), maxX);
        camera.position.y = Math.min(Math.max(camera.position.y, minY), maxY);
    }, [calculateCameraBounds]);

    const resetCameraState = useCallback(() => {
        zoomRef.current = 1;
        camera.zoom = 1;
        camera.position.set(0, 0, 1);
        camera.updateProjectionMatrix();
        clampCameraPosition();
    }, [clampCameraPosition]);

    const updateCameraSize = useCallback(() => {
        if (!image || !size) return;

        const imgRatio = image.width / image.height;
        const aspectRatio = size.width / size.height;
        const scaleRatio =
            imgRatio > aspectRatio ? image.width / size.width : image.height / size.height;

        const viewWidth = image.width / scaleRatio;
        const viewHeight = image.height / scaleRatio;

        boundsRef.current = {
            width: viewWidth + TEMPORARY_PADDING,
            height: viewHeight + TEMPORARY_PADDING,
        };

        const worldPosBefore = new THREE.Vector3(0, 0, 0);
        if (prevSizeRef.current) {
            worldPosBefore.set(camera.position.x, camera.position.y, camera.position.z);
        }

        camera.left = -viewWidth / 2;
        camera.right = viewWidth / 2;
        camera.top = viewHeight / 2;
        camera.bottom = -viewHeight / 2;

        if (prevSizeRef.current) {
            const scaleX = viewWidth / prevSizeRef.current.width;
            const scaleY = viewHeight / prevSizeRef.current.height;

            camera.position.x = worldPosBefore.x * scaleX;
            camera.position.y = worldPosBefore.y * scaleY;
        } else {
            camera.position.set(0, 0, 1);
        }

        camera.zoom = zoomRef.current;
        camera.updateProjectionMatrix();
        clampCameraPosition();

        prevSizeRef.current = { width: viewWidth, height: viewHeight };
    }, [camera, size]);

    const handleWheel = useCallback(
        (event) => {
            event.preventDefault();

            const { offsetX, offsetY } = event;
            const rect = gl.domElement.getBoundingClientRect();

            const ndcX = (offsetX / rect.width) * 2 - 1;
            const ndcY = -((offsetY / rect.height) * 2 - 1);

            const mouse = new THREE.Vector3(ndcX, ndcY, 0).unproject(camera);

            const currentZoom = zoomRef.current;
            const newZoom = currentZoom * (event.deltaY > 0 ? 1 - ZOOM_STEP : 1 + ZOOM_STEP);
            const clampedZoom = Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM);

            camera.zoom = clampedZoom;
            zoomRef.current = clampedZoom;
            camera.updateProjectionMatrix();

            const newMouse = new THREE.Vector3(ndcX, ndcY, 0).unproject(camera);

            const dx = mouse.x - newMouse.x;
            const dy = mouse.y - newMouse.y;

            camera.position.x += dx;
            camera.position.y += dy;

            clampCameraPosition();
        },
        [camera, gl.domElement],
    );

    const handleMouseDown = useCallback((event) => {
        if (event.button !== 0) return;
        isDraggingRef.current = true;
        lastMousePosRef.current = { x: event.clientX, y: event.clientY };
    }, []);

    const handleMouseMove = useCallback(
        (event) => {
            if (!isDraggingRef.current) return;

            const deltaX = event.clientX - lastMousePosRef.current.x;
            const deltaY = event.clientY - lastMousePosRef.current.y;
            lastMousePosRef.current = { x: event.clientX, y: event.clientY };

            const zoom = zoomRef.current;
            const viewWidth = (camera.right - camera.left) / zoom;
            const viewHeight = (camera.top - camera.bottom) / zoom;

            const moveX = -deltaX * (viewWidth / gl.domElement.clientWidth) * PAN_SPEED;
            const moveY = deltaY * (viewHeight / gl.domElement.clientHeight) * PAN_SPEED;

            camera.position.x += moveX;
            camera.position.y += moveY;

            clampCameraPosition();
        },
        [camera, gl.domElement],
    );

    const handleMouseUp = useCallback(() => {
        isDraggingRef.current = false;
    }, []);

    const handleDoubleClick = useCallback(() => {
        resetCameraState();
    }, [resetCameraState]);

    useEffect(() => {
        updateCameraSize();
    }, [updateCameraSize]);

    useEffect(() => {
        if (!image) return;
        resetCameraState();
    }, [camera, selectedCamera]);

    useEffect(() => {
        if (!enabled) return;
        const domElement = gl.domElement;

        domElement.addEventListener("wheel", handleWheel, { passive: false });
        domElement.addEventListener("mousedown", handleMouseDown);
        domElement.addEventListener("dblclick", handleDoubleClick);
        domElement.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            domElement.removeEventListener("wheel", handleWheel);
            domElement.removeEventListener("mousedown", handleMouseDown);
            domElement.removeEventListener("dblclick", handleDoubleClick);
            domElement.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, gl.domElement, enabled]);

    // follow hovered point
    useEffect(() => {
        if (!normXY) return;
        const { normX, normY } = normXY;

        boundsRef.current = {
            width: image.width + TEMPORARY_PADDING,
            height: image.height + TEMPORARY_PADDING,
        };

        camera.position.x = normX * (boundsRef.current.width / 2);
        camera.position.y = normY * (boundsRef.current.height / 2);
        camera.updateProjectionMatrix();
    }, [normXY]);

    return null;
};
