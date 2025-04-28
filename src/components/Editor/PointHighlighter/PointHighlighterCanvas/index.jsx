import React, { memo, useMemo, useCallback } from "react";

import { Canvas } from "@react-three/fiber";
import { Image } from "@react-three/drei";

import { useCalibrations, useSettings } from "contexts";
import { useImagePointHighlighter, useSubscribeFunction } from "hooks";

import { ImageCameraControls } from "components/Editor/CameraImages/ImageCameraControls";
import { HighlightedPointGeometryUpdater } from "../HighlightedPointGeometryUpdater";

import { PointHighlighterShader } from "shaders";

export const PointHighlighterCanvas = memo(({ image, positions }) => {
    const { settings } = useSettings();

    const theme = useMemo(() => {
        return settings.general.theme;
    }, [settings.general.theme]);

    const highlightedPointScale = useMemo(() => {
        return settings.editorSettings.highlighter.highlightedPointSize;
    }, [settings.editorSettings.highlighter.highlightedPointSize]);

    const highlighterZoom = useMemo(() => {
        return settings.editorSettings.highlighter.highlighterZoom;
    }, [settings.editorSettings.highlighter.highlighterZoom]);

    const imageWidth = useMemo(() => image?.width, [image]);
    const imageHeight = useMemo(() => image?.height, [image]);

    const { projectedPointsRef } = useCalibrations();

    const geometry = useMemo(() => {
        if (!image) return;
        return projectedPointsRef.current[image.src].geometry;
    }, [image]);

    const shaderMaterial = useMemo(
        () =>
            PointHighlighterShader({
                sizeMultiplier: 0.3,
                useAlpha: true,
                highlightScale: highlightedPointScale,
                theme: theme,
            }),
        [highlightedPointScale, theme],
    );

    const updateHighlightedPointSize = useCallback((data) => {
        if (data && shaderMaterial?.uniforms?.uHighlightScale) {
            shaderMaterial.uniforms.uHighlightScale.value = data.value;
        }
    }, []);

    useSubscribeFunction("highlightedPointSizeHighlighter", updateHighlightedPointSize, []);

    const normXY = useImagePointHighlighter({
        size: { width: imageWidth, height: imageHeight },
        shaderMaterial,
        positions,
    });

    return (
        <Canvas orthographic className="chessboard">
            {image?.texture && (
                <>
                    <HighlightedPointGeometryUpdater image={image} />
                    <ImageCameraControls
                        image={image}
                        enabled={true}
                        normXY={normXY}
                        fixedZoomLevel={highlighterZoom}
                    />
                    <Image texture={image.texture} scale={[imageWidth, imageHeight, 1]} />
                </>
            )}
            {geometry && (
                <group scale={[1, 1, 1]}>
                    <points geometry={geometry} material={shaderMaterial} />
                </group>
            )}
        </Canvas>
    );
});
