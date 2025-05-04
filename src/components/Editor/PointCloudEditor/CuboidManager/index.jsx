import { memo, useState } from "react";
import { Cuboid } from "./Cuboid";

export const CuboidManager = memo(() => {
    const [cuboids, setCuboids] = useState([
        {
            id: "1",
            position: [0, 0, 0],
            scale: [4.5, 2, 1.7],
            rotation: [0, 0, 0],
            color: "red",
        },
        // {
        //     id: "2",
        //     position: [1, 1, 1],
        //     scale: [1, 1, 2],
        //     rotation: [0, 0, 0],
        //     color: "blue",
        // },
    ]);

    return (
        <>
            {cuboids.map((cuboid) => (
                <Cuboid
                    key={cuboid.id}
                    id={cuboid.id}
                    position={cuboid.position}
                    scale={cuboid.scale}
                    rotation={cuboid.rotation}
                    color={cuboid.color}
                />
            ))}
        </>
    );
});
