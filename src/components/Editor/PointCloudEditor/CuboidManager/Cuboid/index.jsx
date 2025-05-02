import { Box, Edges, TransformControls } from "@react-three/drei";
import { useState } from "react";

export const Cuboid = ({
    position = [0, 0, 0],
    scale = [1, 1, 1],
    rotation = [0, 0, 0],
    color = "red",
    enableTransformControls = true,
}) => {
    const [mode, setMode] = useState("scale");

    return (
        <TransformControls
            mode={mode}
            onMouseDown={() => console.log("Transform started")}
            onMouseUp={() => console.log("Transform ended")}
        >
            <group>
                <Box>
                    <meshBasicMaterial color={color} transparent opacity={0.1} />
                    <Edges color={color}>
                        <lineBasicMaterial />
                    </Edges>
                </Box>
            </group>
        </TransformControls>
    );
};
