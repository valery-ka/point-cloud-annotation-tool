import React, { memo, useMemo, useEffect } from "react";

import { Canvas } from "@react-three/fiber";
import { Image } from "@react-three/drei";

import { useCalibrations } from "contexts";
import { useImagePointHighlighter } from "hooks";

import { ImageCameraControls } from "components/Editor/CameraImages/ImageCameraControls";

import { ImagePointShader } from "shaders";

const Z_INDEX = 1;

export const PointHighlighterCanvas = memo(({ image }) => {
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
            }),
        [],
    );

    const normXY = useImagePointHighlighter({
        size: { width: imageWidth, height: imageHeight },
        shaderMaterial,
        indexToPosition,
    });

    if (!image?.texture) return null;

    return (
        <Canvas orthographic className="chessboard">
            <ImageCameraControls image={image} enabled={true} normXY={normXY} />
            <Image texture={image.texture} scale={[imageWidth, imageHeight, 1]} />
            {geometry && (
                <group scale={[1, 1, Z_INDEX]}>
                    <points geometry={geometry} material={shaderMaterial} />
                </group>
            )}
        </Canvas>
    );
});
