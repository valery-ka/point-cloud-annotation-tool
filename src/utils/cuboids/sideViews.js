import { Vector3 } from "three";

export const getCuboidHandlesPositions = (mesh, scaleOrder) => {
    if (!mesh) return [];

    const [axis1, axis2, depthAxis] = scaleOrder;

    const half = {
        x: mesh.scale.x / 2,
        y: mesh.scale.y / 2,
        z: mesh.scale.z / 2,
    };

    const signs = [
        [-1, -1],
        [-1, +1],
        [+1, -1],
        [+1, +1],
    ];

    const corners = [];

    for (let i = 0; i < 4; i++) {
        const sign1 = signs[i][0];
        const sign2 = signs[i][1];

        const point = new Vector3();
        point[axis1] = sign1 * half[axis1];
        point[axis2] = sign2 * half[axis2];
        point[depthAxis] = 0;

        point.applyQuaternion(mesh.quaternion);

        point.add(mesh.position);

        corners.push(point);
    }

    return corners;
};

export const projectToScreen = (vector3, camera, svgWidth, svgHeight) => {
    const pos = vector3.clone().project(camera);
    return {
        x: ((pos.x + 1) / 2) * svgWidth,
        y: ((1 - pos.y) / 2) * svgHeight,
    };
};
