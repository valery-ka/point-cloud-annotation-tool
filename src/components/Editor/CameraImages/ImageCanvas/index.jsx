import React, { memo, useMemo } from "react";

import { BufferAttribute, BufferGeometry } from "three";
import { Canvas } from "@react-three/fiber";
import { Image } from "@react-three/drei";

import { PointShader } from "shaders";
import { ImageCameraControls } from "../ImageCameraControls";

const POINT_COUNT = 100000;

export const ImageCanvas = memo(({ image, size }) => {
    const scale = useMemo(() => size?.height / image?.height, [size]);
    const imageWidth = image?.width;
    const imageHeight = image?.height;

    const geometry = useMemo(() => {
        const positions = [];
        const colors = [];
        const sizes = [];

        for (let i = 0; i < POINT_COUNT; i++) {
            const x = Math.random() * imageWidth - imageWidth / 2;
            const y = Math.random() * imageHeight - imageHeight / 2;
            const z = 0.1;
            positions.push(x, y, z);

            colors.push(0.5, 0, 0);
            sizes.push(5);
        }

        const geo = new BufferGeometry();
        geo.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
        geo.setAttribute("color", new BufferAttribute(new Float32Array(colors), 3));
        geo.setAttribute("size", new BufferAttribute(new Float32Array(sizes), 1));
        return geo;
    }, [imageWidth, imageHeight]);

    const shaderMaterial = useMemo(() => PointShader(1, "light"), []);

    if (!image?.texture) return null;

    return (
        <Canvas orthographic className="chessboard">
            <ImageCameraControls image={image} size={size} />
            <Image
                texture={image.texture}
                scale={[imageWidth * scale, imageHeight * scale, 1]}
                position={[0, 0, 0]}
                toneMapped={false}
            />
            <group scale={[scale, scale, 1]}>
                <points geometry={geometry} material={shaderMaterial} />
            </group>
        </Canvas>
    );
});
