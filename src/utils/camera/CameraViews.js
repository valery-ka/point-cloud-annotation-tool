import { Vector3 } from "three";
import { cameraTween, sphericalToCartesian, toSpherical, normalizeTheta } from "./CameraTween";
import * as APP_CONSTANTS from "@constants";

const { DISTANCE_TO_CENTER } = APP_CONSTANTS;

export const getPointPosition = (point, position) => {
    if (position) return position;

    if (!point) return null;

    const { x, y, z } = point;
    return [x, y, z];
};

export const getTargetPosition = (camera, point, position) => {
    if (position) {
        const direction = new Vector3()
            .subVectors(new Vector3(...point), new Vector3(0, 0, DISTANCE_TO_CENTER))
            .normalize();
        return {
            x: point[0] - direction.x * DISTANCE_TO_CENTER,
            y: point[1] - direction.y * DISTANCE_TO_CENTER,
            z: point[2] - direction.z * DISTANCE_TO_CENTER,
        };
    }

    return {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
    };
};

export const switchView = (
    targetPos,
    targetTarget,
    camera,
    controls,
    tweenGroup,
    requestPixelProjectionsUpdate,
) => {
    if (!controls.enabledKeys) return;

    const currentPos = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
    };
    const currentTarget = {
        x: controls.target.x,
        y: controls.target.y,
        z: controls.target.z,
    };

    const currentSpherical = toSpherical(currentPos, currentTarget);
    const targetSpherical = toSpherical(targetPos, targetTarget);

    targetSpherical.theta = normalizeTheta(currentSpherical.theta, targetSpherical.theta);

    cameraTween(
        {
            ...currentSpherical,
            tx: currentTarget.x,
            ty: currentTarget.y,
            tz: currentTarget.z,
        },
        {
            ...targetSpherical,
            tx: targetTarget.x,
            ty: targetTarget.y,
            tz: targetTarget.z,
        },
        ({ tx, ty, tz, radius, theta, phi }) => {
            const cartesian = sphericalToCartesian({ radius, theta, phi }, { x: tx, y: ty, z: tz });
            camera.position.set(cartesian.x, cartesian.y, cartesian.z);
            controls.target.set(tx, ty, tz);
            controls.update();
        },
        tweenGroup,
        () => {
            controls.target.set(targetTarget.x, targetTarget.y, targetTarget.z);
            controls.update();
            requestPixelProjectionsUpdate();
        },
    );
};

export const createCameraViews = (camera, controls, tweenGroup, requestPixelProjectionsUpdate) => {
    return {
        switchToOriginView: () =>
            switchView(
                { x: -DISTANCE_TO_CENTER, y: 0, z: DISTANCE_TO_CENTER },
                { x: 0, y: 0, z: 0 },
                camera,
                controls,
                tweenGroup,
                requestPixelProjectionsUpdate,
            ),
        switchToTopView: () =>
            switchView(
                {
                    x: controls.target.x - 0.01,
                    y: controls.target.y,
                    z: controls.target.z + DISTANCE_TO_CENTER,
                },
                controls.target,
                camera,
                controls,
                tweenGroup,
                requestPixelProjectionsUpdate,
            ),
        switchToLeftView: () =>
            switchView(
                {
                    x: controls.target.x,
                    y: controls.target.y + DISTANCE_TO_CENTER,
                    z: controls.target.z,
                },
                controls.target,
                camera,
                controls,
                tweenGroup,
                requestPixelProjectionsUpdate,
            ),
        switchToRightView: () =>
            switchView(
                {
                    x: controls.target.x,
                    y: controls.target.y - DISTANCE_TO_CENTER,
                    z: controls.target.z,
                },
                controls.target,
                camera,
                controls,
                tweenGroup,
                requestPixelProjectionsUpdate,
            ),
        switchToFrontView: () =>
            switchView(
                {
                    x: controls.target.x + DISTANCE_TO_CENTER,
                    y: controls.target.y,
                    z: controls.target.z,
                },
                controls.target,
                camera,
                controls,
                tweenGroup,
                requestPixelProjectionsUpdate,
            ),
        switchToBackView: () =>
            switchView(
                {
                    x: controls.target.x - DISTANCE_TO_CENTER,
                    y: controls.target.y,
                    z: controls.target.z,
                },
                controls.target,
                camera,
                controls,
                tweenGroup,
                requestPixelProjectionsUpdate,
            ),
    };
};
