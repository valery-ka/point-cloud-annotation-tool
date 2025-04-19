import React, { memo, useMemo } from "react";

import { Canvas } from "@react-three/fiber";
import { Image } from "@react-three/drei";

import { useCalibrations, useImages } from "contexts";

import { DistortedPointShader } from "shaders";
import { getCalibrationByUrl } from "utils/calibrations";

import { ImageCameraControls } from "../ImageCameraControls";

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

    const shaderMaterial = useMemo(
        () =>
            DistortedPointShader({
                imageWidth: imageWidth * 2,
                imageHeight: imageHeight * 2,
                distortion: distortion,
            }),
        [distortion],
    );

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
