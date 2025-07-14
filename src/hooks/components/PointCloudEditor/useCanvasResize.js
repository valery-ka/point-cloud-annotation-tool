import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";

export const useCanvasResize = (requestPixelProjectionsUpdate) => {
    const { gl } = useThree();

    const [glSize, setGlSize] = useState({
        width: gl.domElement.width,
        height: gl.domElement.height,
    });

    useEffect(() => {
        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            setGlSize({ width, height });
            requestPixelProjectionsUpdate?.();
        });

        observer.observe(gl.domElement);
        return () => observer.disconnect();
    }, [gl]);

    return { glSize };
};
