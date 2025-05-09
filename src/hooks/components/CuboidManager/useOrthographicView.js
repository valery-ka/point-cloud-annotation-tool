import { CameraHelper, OrthographicCamera, WebGLRenderer } from "three";
import { useThree } from "@react-three/fiber";

import { useEffect, useRef, useCallback } from "react";

export const useOrthographicView = ({ viewId, scaleOrder, computeCameraOrientation }) => {
    const { scene } = useThree();
    const orthoCameraRef = useRef();
    // const cameraHelperRef = useRef();
    const rendererRef = useRef();

    useEffect(() => {
        const asp = 1;
        const camera = new OrthographicCamera(-3 * asp, 3 * asp, 3, -3, -3, 3);
        // const helper = new CameraHelper(camera);

        orthoCameraRef.current = camera;
        // cameraHelperRef.current = helper;

        // scene.add(helper);

        // return () => {
        //     scene.remove(helper);
        // };
    }, [scene]);

    const updateCamera = useCallback(
        (mesh) => {
            if (!mesh) return;

            const camera = orthoCameraRef.current;
            const aspect = 1;
            const cameraDepth = 1;

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
            camera.rotation.copy(mesh.rotation);

            computeCameraOrientation(camera);

            camera.updateProjectionMatrix();
            camera.updateMatrixWorld(true);
            // cameraHelperRef.current.update();
        },
        [computeCameraOrientation, scaleOrder],
    );

    useEffect(() => {
        const container = document.getElementById(viewId);
        if (!container || !scene || !orthoCameraRef.current) return;

        const canvas = document.createElement("canvas");
        canvas.id = `canvas-${viewId}`;
        container.appendChild(canvas);

        const renderer = new WebGLRenderer({ canvas, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        rendererRef.current = renderer;

        const animate = () => {
            renderer.render(scene, orthoCameraRef.current);
            requestAnimationFrame(animate);
        };

        animate();

        return () => {
            renderer.dispose();
            container.removeChild(canvas);
        };
    }, [scene, viewId]);

    return { updateCamera };
};
