import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { WebGLRenderer } from "three";

import { useCuboids } from "contexts";

import { SIDE_VIEWS_GAP } from "constants";

export const useSideViewsRenderer = ({ aspectRef }) => {
    const { size, scene } = useThree();

    const { sideViews, selectedCuboid, selectedCuboidGeometryRef, batchMode } = useCuboids();

    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const rendererRef = useRef(null);

    useEffect(() => {
        const canvas = document.getElementById("side-views-canvas");
        const container = document.getElementById("side-views-canvas-container");

        if (!canvas || !scene || !container) return;

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
    }, [scene]);

    const updateVisibility = () => {
        if (!rendererRef.current || !canvasRef.current || batchMode) {
            canvasRef.current.style.display = "none";
            containerRef.current.style.display = "none";
            return false;
        }

        const visible = selectedCuboid && selectedCuboidGeometryRef.current;
        canvasRef.current.style.display = visible ? "block" : "none";
        containerRef.current.style.display = visible ? "" : "none";

        return visible;
    };

    const updateRendererSize = () => {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        if (width !== rendererRef.current.width || height !== rendererRef.current.height) {
            rendererRef.current.setSize(width, height);
        }

        return { width, height };
    };

    const calculateViewportDimensions = (height) => {
        const viewCount = sideViews.length;
        const viewHeight = (height - SIDE_VIEWS_GAP * (viewCount - 1)) / viewCount;

        if (viewHeight <= 0) return null;

        aspectRef.current = containerRef.current.clientWidth / viewHeight;
        return { viewHeight, viewCount };
    };

    const renderViews = (width, viewHeight, viewCount) => {
        sideViews.forEach((view, idx) => {
            const y = (viewCount - 1 - idx) * (viewHeight + SIDE_VIEWS_GAP);
            rendererRef.current.setViewport(0, y, width, viewHeight);
            rendererRef.current.setScissor(0, y, width, viewHeight);
            rendererRef.current.render(scene, view.camera);
        });
    };

    useFrame(() => {
        if (!updateVisibility()) return;

        const { width, height } = updateRendererSize();
        rendererRef.current.setScissorTest(true);

        const dimensions = calculateViewportDimensions(height);
        if (!dimensions) return;

        renderViews(width, dimensions.viewHeight, dimensions.viewCount);
    });
};
