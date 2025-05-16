import { useEffect, useRef, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrthographicCamera, WebGLRenderer, Quaternion, Euler } from "three";

const GAP = 2;
const INITIAL_ZOOM = 0.8;

export const useOrthographicView = ({ selectedCuboidRef }) => {
    const { size, scene } = useThree();

    const canvasRef = useRef(null);
    const rendererRef = useRef(null);
    const viewsRef = useRef([]);
    const aspectRef = useRef(null);

    const setupCamera = useCallback(() => {
        const aspect = 1;
        const camera = new OrthographicCamera(-3 * aspect, 3 * aspect, 3, -3, -3, 3);
        return camera;
    }, []);

    const getOrientationQuaternion = useCallback((euler) => {
        const orientation = new Quaternion();
        orientation.setFromEuler(euler);
        return orientation;
    }, []);

    useEffect(() => {
        viewsRef.current = [
            {
                name: "top",
                camera: setupCamera(),
                scaleOrder: ["x", "y", "z"],
                getOrientation: () => getOrientationQuaternion(new Euler(0, 0, -Math.PI / 2)),
            },
            {
                name: "left",
                camera: setupCamera(),
                scaleOrder: ["z", "x", "y"],
                getOrientation: () => getOrientationQuaternion(new Euler(Math.PI / 2, 0, 0)),
            },
            {
                name: "front",
                camera: setupCamera(),
                scaleOrder: ["y", "z", "x"],
                getOrientation: () =>
                    getOrientationQuaternion(new Euler(Math.PI / 2, -Math.PI / 2, 0)),
            },
        ];
    }, []);

    useEffect(() => {
        updateAllCameras(selectedCuboidRef.current);
    }, [size]);

    const updateCamera = useCallback((camera, mesh, scaleOrder, getOrientation) => {
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

        camera.zoom = INITIAL_ZOOM / aspect;

        camera.updateProjectionMatrix();
        camera.updateMatrixWorld(true);
    }, []);

    const updateAllCameras = useCallback(
        (mesh) => {
            viewsRef.current.forEach(({ camera, scaleOrder, getOrientation }) => {
                updateCamera(camera, mesh, scaleOrder, getOrientation);
            });
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

    useFrame(() => {
        if (!rendererRef.current || !canvasRef.current) return;

        const width = canvasRef.current.clientWidth;
        const height = size.height;

        rendererRef.current.setSize(width, height);
        rendererRef.current.setScissorTest(true);

        const viewCount = viewsRef.current.length;
        const viewHeight = (height - GAP * (viewCount - 1)) / viewCount;

        aspectRef.current = width / viewHeight;

        viewsRef.current.forEach((view, idx) => {
            const y = (viewCount - 1 - idx) * (viewHeight + GAP);
            rendererRef.current.setViewport(0, y, width, viewHeight);
            rendererRef.current.setScissor(0, y, width, viewHeight);
            rendererRef.current.render(scene, view.camera);
        });
    });

    return {
        updateAllCameras,
        addView: (name, scaleOrder, getOrientation) => {
            const camera = setupCamera();
            viewsRef.current.push({ name, camera, scaleOrder, getOrientation });
        },
        removeView: (name) => {
            viewsRef.current = viewsRef.current.filter((view) => view.name !== name);
        },
    };
};
