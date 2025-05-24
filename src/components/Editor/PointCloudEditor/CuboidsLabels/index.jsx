import { useCallback } from "react";

import { useEvent, useCuboids } from "contexts";

import { SceneButton } from "../SceneButton";

export const CuboidsLabels = () => {
    const { publish } = useEvent();

    const { cuboids } = useCuboids();

    const getPosition = useCallback((cuboid) => {
        const position = cuboid.position;
        const scale = cuboid.scale;

        return [position[0], position[1], position[2] + scale[2] / 2];
    }, []);

    const openContextMenu = useCallback(
        (event, cuboid) => {
            publish("editCuboidLabel", { event: event, cuboid: cuboid });
        },
        [publish],
    );

    return (
        <>
            {cuboids.map((cuboid, index) => (
                <SceneButton
                    key={cuboid.id || index}
                    index={index}
                    text={cuboid.type}
                    position={getPosition(cuboid)}
                    onClick={(e) => openContextMenu(e, cuboid)}
                />
            ))}
        </>
    );
};
