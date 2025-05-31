import { WebGLRenderer } from "three";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";

export const useBatchEditorRenderer = () => {
    const { size } = useThree();

    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const rendererRef = useRef(null);

    useEffect(() => {
        const canvas = document.getElementById("batch-view-canvas");
        const container = document.getElementById("batch-view-canvas-container");

        if (!canvas || !container) return;

        canvasRef.current = canvas;
        containerRef.current = container;

        const renderer = new WebGLRenderer({
            canvas,
            alpha: true,
            width: container.clientWidth,
            height: size.height,
        });

        renderer.setPixelRatio(window.devicePixelRatio);
        rendererRef.current = renderer;

        return () => renderer.dispose();
    }, []);

    return { canvasRef, containerRef, rendererRef };
};
