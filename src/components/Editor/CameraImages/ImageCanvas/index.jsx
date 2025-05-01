import React, { memo, useMemo, useCallback } from "react";

import { Canvas } from "@react-three/fiber";
import { Image } from "@react-three/drei";

import { useCalibrations, useSettings } from "contexts";
import { useImageCanvasMouseEvents, useImagePointHighlighter, useSubscribeFunction } from "hooks";

import { ImagePointShader } from "shaders";

import { ImageCameraControls } from "../ImageCameraControls";
import { ImageGeometryUpdater } from "../ImageGeometryUpdater";

export const ImageCanvas = memo(({ image, size }) => {
    const { settings } = useSettings();

    const theme = useMemo(() => {
        return settings.general.theme;
    }, [settings.general.theme]);

    const highlightedPointScale = useMemo(() => {
        return settings.editorSettings.images.highlightedPointSize;
    }, [settings.editorSettings.images.highlightedPointSize]);

    const scale = useMemo(() => size?.height / image?.height, [size]);
    const imageWidth = useMemo(() => image?.width, [image]);
    const imageHeight = useMemo(() => image?.height, [image]);

    const { projectedPointsRef } = useCalibrations();

    const geometry = useMemo(() => {
        if (!image) return;
        return projectedPointsRef.current[image.src].geometry;
    }, [image]);

    const indexToPosition = useMemo(() => {
        if (!image) return;
        return projectedPointsRef.current[image.src].indexToPositionMap;
    }, [image]);

    const shaderMaterial = useMemo(
        () =>
            ImagePointShader({
                sizeMultiplier: 0.3,
                useAlpha: true,
                highlightScale: highlightedPointScale,
                theme: theme,
            }),
        [highlightedPointScale, theme],
    );

    useImagePointHighlighter({
        size: { width: imageWidth, height: imageHeight },
        shaderMaterial,
        indexToPosition,
    });

    const updateHighlightedPointSize = useCallback((data) => {
        if (data && shaderMaterial?.uniforms?.uHighlightScale) {
            shaderMaterial.uniforms.uHighlightScale.value = data.value;
        }
    }, []);

    useSubscribeFunction("highlightedPointSizeImage", updateHighlightedPointSize, []);

    const { arePointsVisible } = useImageCanvasMouseEvents();

    return (
        <Canvas orthographic className="chessboard">
            {image?.texture && (
                <>
                    <ImageGeometryUpdater image={image} />
                    <ImageCameraControls image={image} size={size} />
                    <Image
                        texture={image.texture}
                        scale={[imageWidth * scale, imageHeight * scale, 1]}
                    />
                </>
            )}
            {geometry && (
                <group scale={[scale, scale, 1]}>
                    <points
                        geometry={geometry}
                        material={shaderMaterial}
                        visible={arePointsVisible}
                    />
                </group>
            )}
        </Canvas>
    );
});
