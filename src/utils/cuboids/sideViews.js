import { Vector3, OrthographicCamera, Quaternion, Euler } from "three";

const TRANSLATE_STEP = 0.01;
const ROTATE_STEP = 1;

export const setupCamera = (name) => {
    const camera = new OrthographicCamera();
    camera.name = name;
    camera.zoom = 0.8;
    return camera;
};

export const getOrientationQuaternion = (euler) => {
    const orientation = new Quaternion();
    orientation.setFromEuler(euler);
    return orientation;
};

export const updateCamera = (camera, mesh, scaleOrder, getOrientation, aspect) => {
    if (!camera || !mesh) return;

    const cameraDepth = 0;
    const scale = mesh.scale;
    const [w, h, d] = scaleOrder.map((axis) => scale[axis] + cameraDepth);

    let camWidth = w;
    let camHeight = h;

    if (camWidth / camHeight > aspect) {
        camHeight = camWidth / aspect;
    } else {
        camWidth = camHeight * aspect;
    }

    camera.left = -camWidth / 2;
    camera.right = camWidth / 2;
    camera.top = camHeight / 2;
    camera.bottom = -camHeight / 2;
    camera.near = -d / 2;
    camera.far = d / 2;

    camera.position.copy(mesh.position);
    camera.quaternion.copy(mesh.quaternion).multiply(getOrientation());

    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
};

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

export const getEdgeDirection = (pos2d, isVertical, corners2d) => {
    const center = corners2d.reduce(
        (acc, p) => {
            acc.x += p.x;
            acc.y += p.y;
            return acc;
        },
        { x: 0, y: 0 },
    );
    center.x /= corners2d.length;
    center.y /= corners2d.length;

    if (isVertical) {
        return pos2d.x > center.x ? "right" : "left";
    } else {
        return pos2d.y > center.y ? "bottom" : "top";
    }
};

export function getCornerDirection(index, corners, project) {
    const projectedCorners = corners.map(project);
    const pos2d = projectedCorners[index];

    const center = projectedCorners.reduce(
        (acc, p) => {
            acc.x += p.x;
            acc.y += p.y;
            return acc;
        },
        { x: 0, y: 0 },
    );
    center.x /= projectedCorners.length;
    center.y /= projectedCorners.length;

    const horizontal = pos2d.x < center.x ? "left" : "right";
    const vertical = pos2d.y < center.y ? "top" : "bottom";

    return `${vertical}-${horizontal}`;
}

export const translateConfigs = {
    top: (dx, dy) => new Vector3(-dy, -dx, 0),
    left: (dx, dy) => new Vector3(dx, 0, -dy),
    front: (dx, dy) => new Vector3(0, -dx, -dy),
};

export const rotateConfigs = {
    top: { axis: new Vector3(0, 0, 1), direction: -1 },
    left: { axis: new Vector3(0, 1, 0), direction: 1 },
    front: { axis: new Vector3(1, 0, 0), direction: 1 },
};

export const scalingConfigs = (dx, dy) => {
    const top = {
        top: { axis: new Vector3(-1, 0, 0), delta: -dy, scaleKey: "x", posAdd: false },
        right: { axis: new Vector3(0, 1, 0), delta: dx, scaleKey: "y", posAdd: false },
        bottom: { axis: new Vector3(-1, 0, 0), delta: dy, scaleKey: "x", posAdd: true },
        left: { axis: new Vector3(0, 1, 0), delta: -dx, scaleKey: "y", posAdd: true },

        "top-right": [
            { axis: new Vector3(-1, 0, 0), delta: -dy, scaleKey: "x", posAdd: false },
            { axis: new Vector3(0, 1, 0), delta: dx, scaleKey: "y", posAdd: false },
        ],
        "top-left": [
            { axis: new Vector3(-1, 0, 0), delta: -dy, scaleKey: "x", posAdd: false },
            { axis: new Vector3(0, 1, 0), delta: -dx, scaleKey: "y", posAdd: true },
        ],
        "bottom-right": [
            { axis: new Vector3(-1, 0, 0), delta: dy, scaleKey: "x", posAdd: true },
            { axis: new Vector3(0, 1, 0), delta: dx, scaleKey: "y", posAdd: false },
        ],
        "bottom-left": [
            { axis: new Vector3(-1, 0, 0), delta: dy, scaleKey: "x", posAdd: true },
            { axis: new Vector3(0, 1, 0), delta: -dx, scaleKey: "y", posAdd: true },
        ],
    };

    const left = {
        top: { axis: new Vector3(0, 0, -1), delta: -dy, scaleKey: "z", posAdd: false },
        bottom: { axis: new Vector3(0, 0, -1), delta: dy, scaleKey: "z", posAdd: true },
        right: { axis: new Vector3(-1, 0, 0), delta: dx, scaleKey: "x", posAdd: false },
        left: { axis: new Vector3(-1, 0, 0), delta: -dx, scaleKey: "x", posAdd: true },

        "top-right": [
            { axis: new Vector3(0, 0, -1), delta: -dy, scaleKey: "z", posAdd: false },
            { axis: new Vector3(-1, 0, 0), delta: dx, scaleKey: "x", posAdd: false },
        ],
        "top-left": [
            { axis: new Vector3(0, 0, -1), delta: -dy, scaleKey: "z", posAdd: false },
            { axis: new Vector3(-1, 0, 0), delta: -dx, scaleKey: "x", posAdd: true },
        ],
        "bottom-right": [
            { axis: new Vector3(0, 0, -1), delta: dy, scaleKey: "z", posAdd: true },
            { axis: new Vector3(-1, 0, 0), delta: dx, scaleKey: "x", posAdd: false },
        ],
        "bottom-left": [
            { axis: new Vector3(0, 0, -1), delta: dy, scaleKey: "z", posAdd: true },
            { axis: new Vector3(-1, 0, 0), delta: -dx, scaleKey: "x", posAdd: true },
        ],
    };

    const front = {
        top: { axis: new Vector3(0, 0, -1), delta: -dy, scaleKey: "z", posAdd: false },
        bottom: { axis: new Vector3(0, 0, -1), delta: dy, scaleKey: "z", posAdd: true },
        right: { axis: new Vector3(0, -1, 0), delta: dx, scaleKey: "y", posAdd: true },
        left: { axis: new Vector3(0, -1, 0), delta: -dx, scaleKey: "y", posAdd: false },

        "top-right": [
            { axis: new Vector3(0, 0, -1), delta: -dy, scaleKey: "z", posAdd: false },
            { axis: new Vector3(0, -1, 0), delta: dx, scaleKey: "y", posAdd: true },
        ],
        "top-left": [
            { axis: new Vector3(0, 0, -1), delta: -dy, scaleKey: "z", posAdd: false },
            { axis: new Vector3(0, -1, 0), delta: -dx, scaleKey: "y", posAdd: false },
        ],
        "bottom-right": [
            { axis: new Vector3(0, 0, -1), delta: dy, scaleKey: "z", posAdd: true },
            { axis: new Vector3(0, -1, 0), delta: dx, scaleKey: "y", posAdd: true },
        ],
        "bottom-left": [
            { axis: new Vector3(0, 0, -1), delta: dy, scaleKey: "z", posAdd: true },
            { axis: new Vector3(0, -1, 0), delta: -dx, scaleKey: "y", posAdd: false },
        ],
    };

    return { top, left, front };
};

export const applyKeyTransformToMesh = ({ code, mesh, configTranslate, configRotate }) => {
    if (!mesh || !configTranslate || !configRotate) return;

    switch (code) {
        case "KeyW": {
            const move = configTranslate(0, -TRANSLATE_STEP);
            const worldTarget = mesh.localToWorld(move.clone());
            const worldMove = worldTarget.sub(mesh.position);
            mesh.position.add(worldMove);
            return true;
        }
        case "KeyS": {
            const move = configTranslate(0, TRANSLATE_STEP);
            const worldTarget = mesh.localToWorld(move.clone());
            const worldMove = worldTarget.sub(mesh.position);
            mesh.position.add(worldMove);
            return true;
        }
        case "KeyA": {
            const move = configTranslate(-TRANSLATE_STEP, 0);
            const worldTarget = mesh.localToWorld(move.clone());
            const worldMove = worldTarget.sub(mesh.position);
            mesh.position.add(worldMove);
            return true;
        }
        case "KeyD": {
            const move = configTranslate(TRANSLATE_STEP, 0);
            const worldTarget = mesh.localToWorld(move.clone());
            const worldMove = worldTarget.sub(mesh.position);
            mesh.position.add(worldMove);
            return true;
        }
        case "KeyQ": {
            const { axis, direction } = configRotate;
            mesh.rotateOnAxis(axis, -ROTATE_STEP * direction * (Math.PI / 180));
            return true;
        }
        case "KeyE": {
            const { axis, direction } = configRotate;
            mesh.rotateOnAxis(axis, ROTATE_STEP * direction * (Math.PI / 180));
            return true;
        }
        default:
            return false;
    }
};
