import React, { memo, useMemo, useState, useCallback, useEffect } from "react";

import { Canvas } from "@react-three/fiber";
import { Image } from "@react-three/drei";

import { useCalibrations, useImages } from "contexts";

import { PointShader, DistortedPointShader } from "shaders";

import { ImageCameraControls } from "../ImageCameraControls";
import { getCalibrationByUrl } from "utils/calibrations";

const Z_INDEX = 5;

export const ImageCanvas = memo(({ image, size }) => {
    const scale = useMemo(() => size?.height / image?.height, [size]);
    const imageWidth = useMemo(() => image?.width, [image]);
    const imageHeight = useMemo(() => image?.height, [image]);

    const { imagesByCamera } = useImages();
    const { calibrations, projectedPointsRef } = useCalibrations();

    const geometry = useMemo(() => {
        if (!image) return;
        return projectedPointsRef.current[image.src];
    }, [image]);

    const distortion = useMemo(() => {
        if (!image) return;
        return getCalibrationByUrl(image.src, imagesByCamera, calibrations)?.distortion ?? [];
    }, [image]);

    // const shaderMaterial = useMemo(
    //     () =>
    //         DistortedPointShader({
    //             distortion: distortion,
    //             imageWidth: imageWidth,
    //             imageHeight: imageHeight,
    //         }),
    //     [distortion],
    // );

    const shaderMaterial = useMemo(() => PointShader({ useAlpha: true }), []);

    if (!image?.texture) return null;

    return (
        <Canvas orthographic className="chessboard">
            <ImageCameraControls image={image} size={size} />
            <Image texture={image.texture} scale={[imageWidth * scale, imageHeight * scale, 1]} />
            {geometry && (
                <group scale={[scale, scale, Z_INDEX]}>
                    <points geometry={geometry} material={shaderMaterial} />
                </group>
            )}
        </Canvas>
    );
});
