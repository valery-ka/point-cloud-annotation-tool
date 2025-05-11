import React, { memo, useMemo, useCallback, useRef, useEffect } from "react";

import { Canvas } from "@react-three/fiber";
import { Image } from "@react-three/drei";

import { useCalibrations, useSettings } from "contexts";
import { useImagePointHighlighter, useSubscribeFunction } from "hooks";

import { ImageCameraControls } from "components/Editor/CameraImages/ImageCameraControls";
import { HighlightedPointGeometryUpdater } from "../HighlightedPointGeometryUpdater";
import { ImageScene } from "../../CameraImages/ImageScene";

import { PointHighlighterShader } from "shaders";

export const PointHighlighterCanvas = memo(({ image, positions }) => {
    const { settings } = useSettings();
    const { projectedPointsRef } = useCalibrations();

    const scale = useMemo(() => [image?.width, image?.height, 1], [image?.width, image?.height]);

    const imageRef = useRef(null);
    const geometryRef = useRef(null);

    const shaderMaterial = useMemo(() => {
        return PointHighlighterShader({
            sizeMultiplier: 0.3,
            useAlpha: true,
            highlightScale: settings.editorSettings.highlighter.highlightedPointSize,
            theme: settings.general.theme,
        });
    }, [settings.editorSettings.highlighter.highlightedPointSize, settings.general.theme]);

    useEffect(() => {
        return () => {
            shaderMaterial.dispose();
        };
    }, [shaderMaterial]);

    const updateHighlightedPointSize = useCallback(
        (data) => {
            if (data && shaderMaterial?.uniforms?.uHighlightScale) {
                shaderMaterial.uniforms.uHighlightScale.value = data.value;
            }
        },
        [shaderMaterial],
    );

    useSubscribeFunction("highlightedPointSizeHighlighter", updateHighlightedPointSize, []);

    const normXY = useImagePointHighlighter({
        size: { width: image?.width, height: image?.height },
        shaderMaterial,
        positions,
    });

    useEffect(() => {
        if (!image) return;
        imageRef.current = image;
        geometryRef.current = projectedPointsRef.current[image.src]?.geometry;
    }, [image]);

    return (
        <Canvas orthographic className="chessboard">
            {imageRef.current?.texture && (
                <>
                    <HighlightedPointGeometryUpdater image={image} />
                    <ImageCameraControls
                        image={image}
                        enabled={true}
                        normXY={normXY}
                        fixedZoomLevel={settings.editorSettings.highlighter.highlighterZoom}
                    />
                    <Image texture={imageRef.current?.texture} scale={scale} />
                    <ImageScene
                        image={image}
                        geometry={geometryRef.current}
                        material={shaderMaterial}
                    />
                </>
            )}
        </Canvas>
    );
});
