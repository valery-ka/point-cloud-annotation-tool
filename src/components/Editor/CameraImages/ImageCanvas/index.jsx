import React, { memo, useMemo } from "react";
import { Canvas } from "@react-three/fiber";

import { ImageCameraControls } from "../ImageCameraControls";

export const ImageCanvas = memo(({ image, size }) => {
    const scale = useMemo(() => {
        return size?.height / image?.height;
    }, [size]);

    if (!image) return null;

    return (
        <Canvas orthographic className="chessboard">
            <ImageCameraControls image={image} size={size} />
            <mesh scale={[scale, scale, 1]}>
                <planeGeometry args={[image.width, image.height]} />
                <meshBasicMaterial map={image.texture} toneMapped={false} />
            </mesh>
        </Canvas>
    );
});
