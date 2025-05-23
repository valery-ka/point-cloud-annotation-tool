import { Vector3 } from "three";

const POSITION_STEP = 0.05;
const SCALE_STEP = 0.05;
const ROTATION_STEP = 1;

const ACTION_MAP = {
    0: "x",
    1: "y",
    2: "z",
};

const applyLocalOffset = (cuboid, offset) => {
    const direction = new Vector3(offset.x, offset.y, offset.z);
    direction.applyQuaternion(cuboid.quaternion);
    return direction;
};

export const RESET_HANDLERS = {
    position: (cuboid, index) => {
        cuboid.position[ACTION_MAP[index]] = index === 2 ? cuboid.scale.z / 2 : 0;
    },
    rotation: (cuboid, index) => {
        cuboid.rotation[ACTION_MAP[index]] = 0;
    },
    scale: (cuboid, index, unit) => {
        if (index === 2) {
            const oldHeight = cuboid.scale.z;
            const newHeight = unit.dimensions.height;
            cuboid.position.z += (newHeight - oldHeight) / 2;
            cuboid.scale.z = newHeight;
        } else {
            const dimension = index === 0 ? "length" : "width";
            cuboid.scale[ACTION_MAP[index]] = unit.dimensions[dimension];
        }
    },
};

export const POSITION_HANDLERS = {
    plus: (cuboid, index) => {
        const offset = { x: 0, y: 0, z: 0 };
        offset[ACTION_MAP[index]] = POSITION_STEP;
        const globalOffset = applyLocalOffset(cuboid, offset);
        cuboid.position.add(globalOffset);
    },
    minus: (cuboid, index) => {
        const offset = { x: 0, y: 0, z: 0 };
        offset[ACTION_MAP[index]] = -POSITION_STEP;
        const globalOffset = applyLocalOffset(cuboid, offset);
        cuboid.position.add(globalOffset);
    },
};

export const SCALE_HANDLERS = {
    plus: (cuboid, index) => {
        const axis = ACTION_MAP[index];
        if (index === 2) {
            cuboid.scale.z += SCALE_STEP;
            cuboid.position.z += SCALE_STEP / 2;
        } else {
            cuboid.scale[axis] += SCALE_STEP;
        }
    },
    minus: (cuboid, index) => {
        const axis = ACTION_MAP[index];
        if (index === 2) {
            const oldHeight = cuboid.scale.z;
            const newHeight = Math.max(SCALE_STEP, oldHeight - SCALE_STEP);
            cuboid.position.z -= (oldHeight - newHeight) / 2;
            cuboid.scale.z = newHeight;
        } else {
            cuboid.scale[axis] = Math.max(SCALE_STEP, cuboid.scale[axis] - SCALE_STEP);
        }
    },
};

export const ROTATION_HANDLERS = {
    plus: (cuboid, index) => {
        cuboid.rotation[ACTION_MAP[index]] += ROTATION_STEP * (Math.PI / 180);
    },
    minus: (cuboid, index) => {
        cuboid.rotation[ACTION_MAP[index]] -= ROTATION_STEP * (Math.PI / 180);
    },
};
