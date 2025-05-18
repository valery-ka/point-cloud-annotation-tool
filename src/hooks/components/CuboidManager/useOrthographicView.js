import { useEffect, useRef, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrthographicCamera, WebGLRenderer, Quaternion, Euler } from "three";

import { useSideViews } from "contexts";

import { getCuboidHandlesPositions } from "utils/cuboids";
import { SIDE_VIEWS_GAP, INITIAL_SIDE_VIEWS_ZOOM } from "constants";

export const useOrthographicView = () => {
    const { size, scene } = useThree();

    const {
        sideViews,
        setSideViews,
        selectedCuboidRef,
        setHandlePositions,
        sideViewsCamerasNeedUpdate,
    } = useSideViews();

    const canvasRef = useRef(null);
    const rendererRef = useRef(null);
    const aspectRef = useRef(null);

    const setupCamera = useCallback((name) => {
        const camera = new OrthographicCamera();
        camera.name = name;
        camera.zoom = INITIAL_SIDE_VIEWS_ZOOM;
        return camera;
    }, []);

    const getOrientationQuaternion = useCallback((euler) => {
        const orientation = new Quaternion();
        orientation.setFromEuler(euler);
        return orientation;
    }, []);

    useEffect(() => {
        const sideViewsList = [
            {
                name: "top",
                camera: setupCamera("top"),
                scaleOrder: ["x", "y", "z"],
                getOrientation: () => getOrientationQuaternion(new Euler(0, 0, -Math.PI / 2)),
            },
            {
                name: "left",
                camera: setupCamera("left"),
                scaleOrder: ["z", "x", "y"],
                getOrientation: () => getOrientationQuaternion(new Euler(Math.PI / 2, 0, 0)),
            },
            {
                name: "front",
                camera: setupCamera("front"),
                scaleOrder: ["y", "z", "x"],
                getOrientation: () =>
                    getOrientationQuaternion(new Euler(Math.PI / 2, -Math.PI / 2, 0)),
            },
        ];

        setSideViews(sideViewsList);
    }, []);

    const updateCamera = useCallback(
        (camera, mesh, scaleOrder, getOrientation) => {
            if (!camera || !mesh) return;

            const aspect = aspectRef.current;
            const cameraDepth = 0;

            const scale = mesh.scale;
            const [w, h, d] = scaleOrder.map((axis) => scale[axis] + cameraDepth);

            let camWidth = w;
            let camHeight = h;
            let camDepth = d;

            if (camWidth / camHeight > aspect) {
                camHeight = camWidth / aspect;
            } else {
                camWidth = camHeight * aspect;
            }

            camera.left = -camWidth / 2;
            camera.right = camWidth / 2;
            camera.top = camHeight / 2;
            camera.bottom = -camHeight / 2;
            camera.near = -camDepth / 2;
            camera.far = camDepth / 2;

            camera.position.copy(mesh.position);

            camera.quaternion.copy(mesh.quaternion).multiply(getOrientation());

            camera.updateProjectionMatrix();
            camera.updateMatrixWorld(true);
        },
        [sideViews],
    );

    const updateAllCameras = useCallback(
        (mesh) => {
            sideViews.forEach(({ camera, scaleOrder, getOrientation }) => {
                updateCamera(camera, mesh, scaleOrder, getOrientation);
            });
            updateHandlePositions(mesh);
        },
        [updateCamera],
    );

    const updateHandlePositions = useCallback(
        (mesh) => {
            if (!mesh) return;
            const newPositions = {};
            sideViews.forEach(({ name, scaleOrder }) => {
                newPositions[name] = getCuboidHandlesPositions(mesh, scaleOrder);
            });
            setHandlePositions(newPositions);
        },
        [updateCamera],
    );

    useEffect(() => {
        const canvas = document.getElementById("side-views-canvas");
        if (!canvas || !scene) return;

        canvasRef.current = canvas;

        const renderer = new WebGLRenderer({ canvas, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        rendererRef.current = renderer;

        return () => {
            renderer.dispose();
        };
    }, [scene]);

    useEffect(() => {
        sideViewsCamerasNeedUpdate.current = true;
    }, [size]);

    useFrame(() => {
        if (sideViewsCamerasNeedUpdate.current) {
            updateAllCameras(selectedCuboidRef.current);
            sideViewsCamerasNeedUpdate.current = false;
        }
    });

    useFrame(() => {
        if (!rendererRef.current || !canvasRef.current) return;

        const width = canvasRef.current.clientWidth;
        const height = size.height;

        rendererRef.current.setSize(width, height);
        rendererRef.current.setScissorTest(true);

        const viewCount = sideViews.length;
        const viewHeight = (height - SIDE_VIEWS_GAP * (viewCount - 1)) / viewCount;

        aspectRef.current = width / viewHeight;

        sideViews.forEach((view, idx) => {
            const y = (viewCount - 1 - idx) * (viewHeight + SIDE_VIEWS_GAP);
            rendererRef.current.setViewport(0, y, width, viewHeight);
            rendererRef.current.setScissor(0, y, width, viewHeight);
            rendererRef.current.render(scene, view.camera);
        });
    });

    return {
        addView: (name, scaleOrder, getOrientation) => {
            const camera = setupCamera();
            setSideViews((prev) => [...prev, { name, camera, scaleOrder, getOrientation }]);
        },
        removeView: (name) => {
            setSideViews((prev) => prev.filter((view) => view.name !== name));
        },
    };
};
