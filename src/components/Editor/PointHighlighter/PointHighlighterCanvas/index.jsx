import React, { memo, useMemo } from "react";

import { Canvas } from "@react-three/fiber";
import { Image } from "@react-three/drei";

import { useCalibrations } from "contexts";
import { useImagePointHighlighter } from "hooks";

import { ImageCameraControls } from "components/Editor/CameraImages/ImageCameraControls";
import { HighlightedPointGeometryUpdater } from "../HighlightedPointGeometryUpdater";

import { PointHighlighterShader } from "shaders";

export const PointHighlighterCanvas = memo(({ image, positions, point }) => {
    const { projectedPointsRef } = useCalibrations();

    const imageWidth = useMemo(() => image?.width, [image]);
    const imageHeight = useMemo(() => image?.height, [image]);

    const geometry = useMemo(() => {
        if (!image) return;
        return projectedPointsRef.current[image.src].geometry;
    }, [image]);

    const shaderMaterial = useMemo(
        () =>
            PointHighlighterShader({
                sizeMultiplier: 0.3,
                useAlpha: true,
            }),
        [],
    );

    const normXY = useImagePointHighlighter({
        size: { width: imageWidth, height: imageHeight },
        shaderMaterial,
        positions,
    });

    return (
        <Canvas orthographic className="chessboard">
            {image?.texture && (
                <>
                    <HighlightedPointGeometryUpdater image={image} point={point} />
                    <ImageCameraControls image={image} enabled={true} normXY={normXY} />
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
