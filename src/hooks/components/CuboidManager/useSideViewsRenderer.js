import { useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { WebGLRenderer } from "three";

import { useCuboids } from "contexts";

import { SIDE_VIEWS_GAP } from "constants";

export const useSideViewsRenderer = (config) => {
    const { size, scene } = useThree();
    const { selectedCuboid, selectedCuboidGeometryRef, batchMode } = useCuboids();

    const { canvasRef, containerRef, rendererRef } = config.refs;

    useEffect(() => {
        const canvas = document.getElementById(config.canvasId);
        const container = document.getElementById(config.containerId);

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

    useFrame(() => {
        if (!rendererRef.current || !canvasRef.current || batchMode !== config.isBatchMode) {
            canvasRef.current.style.display = "none";
            containerRef.current.style.display = "none";
            return;
        }

        const visible = selectedCuboid && selectedCuboidGeometryRef.current;
        canvasRef.current.style.display = visible ? "block" : "none";
        containerRef.current.style.display = visible ? "" : "none";

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        if (width !== rendererRef.current.width || height !== rendererRef.current.height) {
            rendererRef.current.setSize(width, height);
        }

        rendererRef.current.setScissorTest(true);

        const views = config.getViews();
        const isMultiFrame = Array.isArray(views[0]);

        const renderMultiFrame = () => {
            const numFrames = views.length;
            const viewsPerFrame = views[0].length;
            const frameWidth = (width - SIDE_VIEWS_GAP * (numFrames - 1)) / numFrames;
            const viewHeight = (height - SIDE_VIEWS_GAP * (viewsPerFrame - 1)) / viewsPerFrame;

            if (frameWidth <= 0 || viewHeight <= 0) return;
            config.aspectRef.current = frameWidth / viewHeight;

            views.forEach((frameViews, frameIdx) => {
                const x = frameIdx * (frameWidth + SIDE_VIEWS_GAP);
                frameViews.forEach((view, viewIdx) => {
                    const y =
                        height - (viewIdx + 1) * (viewHeight + SIDE_VIEWS_GAP) + SIDE_VIEWS_GAP;
                    rendererRef.current.setViewport(x, y, frameWidth, viewHeight);
                    rendererRef.current.setScissor(x, y, frameWidth, viewHeight);
                    rendererRef.current.render(scene, view.camera);
                });
            });
        };

        const renderSingleFrame = () => {
            const viewCount = views.length;
            const viewHeight = (height - SIDE_VIEWS_GAP * (viewCount - 1)) / viewCount;
            if (viewHeight <= 0) return;
            config.aspectRef.current = width / viewHeight;

            views.forEach((view, idx) => {
                const y = (viewCount - 1 - idx) * (viewHeight + SIDE_VIEWS_GAP);
                rendererRef.current.setViewport(0, y, width, viewHeight);
                rendererRef.current.setScissor(0, y, width, viewHeight);
                rendererRef.current.render(scene, view.camera);
            });
        };

        isMultiFrame ? renderMultiFrame() : renderSingleFrame();
    });
};
