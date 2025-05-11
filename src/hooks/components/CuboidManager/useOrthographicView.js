import { useEffect, useRef, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrthographicCamera, WebGLRenderer } from "three";

export const useOrthographicView = () => {
    const { scene } = useThree();

    const canvasRef = useRef(null);
    const rendererRef = useRef(null);

    const viewsRef = useRef([]);

    const setupCamera = () => {
        const aspect = 1;
        const camera = new OrthographicCamera(-3 * aspect, 3 * aspect, 3, -3, -3, 3);
        camera.zoom = 0.75;
        return camera;
    };

    useEffect(() => {
        viewsRef.current = [
            {
                name: "top",
                camera: setupCamera(),
                scaleOrder: ["x", "y", "z"],
                computeOrientation: (cam) => {
                    cam.up.set(0, 1, 0);
                    cam.rotation.set(0, 0, 0);
                    cam.rotateZ(-Math.PI / 2);
                },
            },
            {
                name: "left",
                camera: setupCamera(),
                scaleOrder: ["z", "x", "y"],
                computeOrientation: (cam) => {
                    cam.up.set(0, 0, 1);
                    cam.rotation.set(0, 0, 0);
                    cam.rotateX(Math.PI / 2);
                },
            },
            {
                name: "front",
                camera: setupCamera(),
                scaleOrder: ["y", "z", "x"],
                computeOrientation: (cam) => {
                    cam.up.set(0, 1, 0);
                    cam.rotation.set(0, 0, 0);
                    cam.rotateX(Math.PI / 2);
                    cam.rotateY(-Math.PI / 2);
                },
            },
        ];
    }, []);

    const updateCamera = useCallback((camera, mesh, scaleOrder, computeOrientation) => {
        if (!camera || !mesh) return;

        const aspect = 1;
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
        computeOrientation(camera);

        camera.updateProjectionMatrix();
        camera.updateMatrixWorld(true);
    }, []);

    const updateAllCameras = useCallback(
        (mesh) => {
            viewsRef.current.forEach(({ camera, scaleOrder, computeOrientation }) => {
                updateCamera(camera, mesh, scaleOrder, computeOrientation);
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
        const height = canvasRef.current.clientHeight;
        rendererRef.current.setSize(width, height);
        rendererRef.current.setScissorTest(true);

        const GAP = 5;
        const viewCount = viewsRef.current.length;
        const viewHeight = (height - GAP * (viewCount - 1)) / viewCount;

        viewsRef.current.forEach((view, idx) => {
            const y = (viewCount - 1 - idx) * (viewHeight + GAP);
            rendererRef.current.setViewport(0, y, width, viewHeight);
            rendererRef.current.setScissor(0, y, width, viewHeight);
            rendererRef.current.render(scene, view.camera);
        });
    });

    return {
        updateAllCameras,
        addView: (name, scaleOrder, computeOrientation) => {
            const camera = setupCamera();
            viewsRef.current.push({ name, camera, scaleOrder, computeOrientation });
        },
        removeView: (name) => {
            viewsRef.current = viewsRef.current.filter((view) => view.name !== name);
        },
    };
};
