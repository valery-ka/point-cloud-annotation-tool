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

// Тестовые варианты, могут пригодиться

// import { Image } from "@react-three/drei";
// export const ImageCanvas = ({ image, size }) => {
//     if (!image) return null;

//     const scale = useMemo(() => {
//         return size?.height / image?.height;
//     }, [size]);

//     return (
//         <Canvas orthographic className="chessboard">
//             <ImageCameraControls image={image} size={size} />
//             <Image
//                 texture={image.texture}
//                 scale={[image.width * scale, image.height * scale, 1]}
//                 toneMapped={false}
//             />
//         </Canvas>
//     );
// };

// export const ImageCanvas = memo(({ image, size }) => {
//     const scale = useMemo(() => {
//         return size?.height / image?.height;
//     }, [size]);

//     if (!image) return null;

//     return (
//         <Canvas orthographic className="chessboard">
//             <ImageCameraControls image={image} size={size} />
//             <sprite scale={[image.width * scale, image.height * scale, 1]}>
//                 <spriteMaterial map={image.texture} />
//             </sprite>
//         </Canvas>
//     );
// });
