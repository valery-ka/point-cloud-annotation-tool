import React, { memo, useMemo, useCallback } from "react";

import { Canvas } from "@react-three/fiber";
import { Image } from "@react-three/drei";

import { useCalibrations, useSettings } from "contexts";
import {
    useImagePointsSize,
    useImageCanvasMouseEvents,
    useImagePointHighlighter,
    useSubscribeFunction,
} from "hooks";

import { ImagePointShader } from "shaders";

import { ImageCameraControls } from "../ImageCameraControls";

const Z_INDEX = 5;

export const ImageCanvas = memo(({ image, size }) => {
    const { settings } = useSettings();

    const highlightScale = useMemo(() => {
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
                highlightScale: highlightScale,
            }),
        [],
    );

    const updateHighlightedPointSize = useCallback((data) => {
        if (data && shaderMaterial?.uniforms?.uHighlightScale) {
            shaderMaterial.uniforms.uHighlightScale.value = data.value;
        }
    }, []);

    useSubscribeFunction("highlightedPointSizeImage", updateHighlightedPointSize, []);

    useImagePointsSize(geometry);
    useImagePointHighlighter({
        size: { width: imageWidth, height: imageHeight },
        shaderMaterial,
        indexToPosition,
    });

    const { arePointsVisible } = useImageCanvasMouseEvents();

    return (
        <Canvas orthographic className="chessboard">
            {image?.texture && (
                <>
                    <ImageCameraControls image={image} size={size} />
                    <Image
                        texture={image.texture}
                        scale={[imageWidth * scale, imageHeight * scale, 1]}
                    />
                </>
            )}
            {geometry && arePointsVisible && (
                <group scale={[scale, scale, Z_INDEX]}>
                    <points geometry={geometry} material={shaderMaterial} />
                </group>
            )}
        </Canvas>
    );
});
