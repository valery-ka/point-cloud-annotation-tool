import { useCallback } from "react";

import { useEvent, useCuboids } from "contexts";

import { SceneButton } from "../SceneButton";

export const CuboidsLabels = () => {
    const { publish } = useEvent();
    const { cuboidsGeometriesRef, hoveredCuboid } = useCuboids();

    const getPosition = useCallback((mesh) => {
        const position = mesh.position;
        const scale = mesh.scale;
        return [position.x, position.y, position.z + scale.z / 2];
    }, []);

    const getLabel = useCallback((mesh) => {
        const label = mesh.userData.label;
        return label;
    }, []);

    const getIsHidden = useCallback(
        (mesh) => {
            return mesh.name === hoveredCuboid;
        },
        [hoveredCuboid],
    );

    const openContextMenu = useCallback(
        (event, mesh) => {
            publish("editCuboidLabel", {
                event: event,
                cuboid: {
                    id: mesh.name,
                    label: mesh.userData.label,
                },
            });
        },
        [publish],
    );

    return (
        <>
            {Object.values(cuboidsGeometriesRef.current).map((geometry, index) => {
                const mesh = geometry.cube.mesh;
                return (
                    <SceneButton
                        key={mesh.name || index}
                        index={index}
                        text={getLabel(mesh)}
                        position={getPosition(mesh)}
                        hidden={!getIsHidden(mesh)}
                        onClick={(e) => openContextMenu(e, mesh)}
                    />
                );
            })}
        </>
    );
};
