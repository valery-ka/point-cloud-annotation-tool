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
        [+1, +1],
        [+1, -1],
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

    const edges = [
        corners[0].clone().add(corners[1]).multiplyScalar(0.5),
        corners[1].clone().add(corners[2]).multiplyScalar(0.5),
        corners[2].clone().add(corners[3]).multiplyScalar(0.5),
        corners[3].clone().add(corners[0]).multiplyScalar(0.5),
    ];

    return {
        corners,
        edges,
    };
};

export const projectToScreen = (vector3, camera, svgWidth, svgHeight) => {
    const pos = vector3.clone().project(camera);
    return {
        x: ((pos.x + 1) / 2) * svgWidth,
        y: ((1 - pos.y) / 2) * svgHeight,
    };
};

export const getCornerCursor = (index, projectedCorners) => {
    const prevIndex = (index + 3) % 4;
    const nextIndex = (index + 1) % 4;

    const current = projectedCorners[index];
    const prev = projectedCorners[prevIndex];
    const next = projectedCorners[nextIndex];

    const vecPrev = { x: prev.x - current.x, y: prev.y - current.y };
    const vecNext = { x: next.x - current.x, y: next.y - current.y };

    const avgVec = { x: (vecPrev.x + vecNext.x) / 2, y: (vecPrev.y + vecNext.y) / 2 };

    if (Math.abs(avgVec.x) > Math.abs(avgVec.y)) {
        return avgVec.x * avgVec.y > 0 ? "nwse-resize" : "nesw-resize";
    } else {
        return avgVec.x * avgVec.y > 0 ? "nwse-resize" : "nesw-resize";
    }
};

export const getEdgeStyles = (isVertical, pos2d, width, height, pickerWidth) => ({
    picker: isVertical
        ? { x: pos2d.x - pickerWidth / 2, y: 0, width: pickerWidth, height, cursor: "ew-resize" }
        : { x: 0, y: pos2d.y - pickerWidth / 2, width, height: pickerWidth, cursor: "ns-resize" },
    line: isVertical
        ? { x1: pos2d.x, y1: 0, x2: pos2d.x, y2: height }
        : { x1: 0, y1: pos2d.y, x2: width, y2: pos2d.y },
});

export const isHovered = (hoveredHandler, type, index = null) =>
    hoveredHandler?.type === type && hoveredHandler?.index === index;
