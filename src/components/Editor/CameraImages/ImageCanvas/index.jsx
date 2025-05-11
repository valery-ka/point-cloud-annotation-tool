import React, { memo, useMemo, useCallback, useRef, useEffect } from "react";

import { Canvas } from "@react-three/fiber";
import { Image } from "@react-three/drei";

import { useCalibrations, useSettings } from "contexts";
import { useImageCanvasMouseEvents, useImagePointHighlighter, useSubscribeFunction } from "hooks";

import { ImagePointShader } from "shaders";

import { ImageCameraControls } from "../ImageCameraControls";
import { ImageGeometryUpdater } from "../ImageGeometryUpdater";
import { ImageScene } from "../ImageScene";

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

    const texture = useMemo(() => {
        if (!image) return null;
        return image?.texture;
    }, [image]);

    const geometry = useMemo(() => {
        if (!image) return null;
        return projectedPointsRef.current[image.src]?.geometry;
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

    useEffect(() => {
        return () => {
            shaderMaterial.dispose();
        };
    }, [shaderMaterial]);

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
            {texture && (
                <>
                    <ImageGeometryUpdater image={image} />
                    <ImageCameraControls image={image} size={size} />
                    <Image
                        texture={texture}
                        scale={[image.width * scale, image.height * scale, 1]}
                    />
                    <ImageScene
                        image={image}
                        geometry={geometry}
                        material={shaderMaterial}
                        visible={arePointsVisible}
                        scale={scale}
                    />
                </>
            )}
        </Canvas>
    );
});
