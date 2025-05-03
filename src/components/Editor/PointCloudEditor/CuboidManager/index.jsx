import { memo, useMemo } from "react";
import { Cuboid } from "./Cuboid";

export const CuboidManager = memo(() => {
    const id = useMemo(() => {
        return Date.now().toString();
    }, []);

    return (
        <>
            <Cuboid
                id={id}
                position={[-1, -1, 0.5]}
                scale={[4.5, 2, 1.7]}
                rotation={[0, 0, 0]}
                color={"red"}
            />
        </>
    );
});
