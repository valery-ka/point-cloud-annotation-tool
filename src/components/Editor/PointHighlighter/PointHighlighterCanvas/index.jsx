import React, { memo, useMemo, useCallback, useRef, useEffect } from "react";

import { Canvas } from "@react-three/fiber";
import { Image } from "@react-three/drei";

import { useCalibrations, useSettings } from "contexts";
import { useImagePointHighlighter, useSubscribeFunction } from "hooks";

import { ImageCameraControls } from "components/Editor/CameraImages/ImageCameraControls";
import { HighlightedPointGeometryUpdater } from "../HighlightedPointGeometryUpdater";

import { PointHighlighterShader } from "shaders";

export const PointHighlighterCanvas = memo(({ image, positions }) => {
    const { settings } = useSettings();
    const { projectedPointsRef } = useCalibrations();

    const prevGeometryRef = useRef();
    const prevTextureRef = useRef();

    const texture = useMemo(() => {
        if (!image) return null;
        return image?.texture;
    }, [image]);

    const geometry = useMemo(() => {
        if (!image) return null;
        return projectedPointsRef.current[image.src]?.geometry;
    }, [image]);

    useEffect(() => {
        const prevGeometry = prevGeometryRef.current;
        if (prevGeometry && prevGeometry !== geometry) {
            prevGeometry.dispose();
        }
        prevGeometryRef.current = geometry;
    }, [geometry]);

    useEffect(() => {
        const prevTexture = prevTextureRef.current;
        if (prevTexture && prevTexture !== texture) {
            prevTexture.dispose();
        }
        prevTextureRef.current = texture;
    }, [texture]);

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

    return (
        <Canvas orthographic className="chessboard">
            {texture && (
                <>
                    <HighlightedPointGeometryUpdater image={image} />
                    <ImageCameraControls
                        image={image}
                        enabled={true}
                        normXY={normXY}
                        fixedZoomLevel={settings.editorSettings.highlighter.highlighterZoom}
                    />
                    <Image texture={texture} scale={[image.width, image.height, 1]} />
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
