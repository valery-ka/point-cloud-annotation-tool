import React, { memo, useMemo, useState, useCallback, useEffect } from "react";

import { Canvas } from "@react-three/fiber";
import { Image } from "@react-three/drei";

import { useCalibrations } from "contexts";

import { PointShader } from "shaders";

import { ImageCameraControls } from "../ImageCameraControls";

const Z_INDEX = 5;

export const ImageCanvas = memo(({ image, size }) => {
    const [arePointsVisible, setArePointsVisible] = useState(true);

    const scale = useMemo(() => size?.height / image?.height, [size]);
    const imageWidth = useMemo(() => image?.width, [image]);
    const imageHeight = useMemo(() => image?.height, [image]);

    const { projectedPointsRef } = useCalibrations();

    const geometry = useMemo(() => {
        if (!image) return;
        return projectedPointsRef.current[image.src];
    }, [image]);

    useEffect(() => {
        console.log(geometry);
    }, [geometry]);

    const shaderMaterial = useMemo(() => PointShader(), []);

    const handlePointerOver = useCallback(() => {
        setArePointsVisible(false);
    }, []);

    const handlePointerOut = useCallback(() => {
        setArePointsVisible(true);
    }, []);

    if (!image?.texture) return null;

    return (
        <Canvas
            orthographic
            className="chessboard"
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
        >
            <ImageCameraControls image={image} size={size} />
            <Image texture={image.texture} scale={[imageWidth * scale, imageHeight * scale, 1]} />
            {geometry && arePointsVisible && (
                <group scale={[scale, scale, Z_INDEX]}>
                    <points geometry={geometry} material={shaderMaterial} />
                </group>
            )}
        </Canvas>
    );
});
