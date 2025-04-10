import { Tween, Easing } from "@tweenjs/tween.js";
import * as APP_CONSTANTS from "constants";

const { TWEEN_DURATION } = APP_CONSTANTS;

export const cameraTween = (
    current,
    target,
    onUpdate,
    tweenGroup,
    requestPixelProjectionsUpdate,
) => {
    new Tween(current)
        .to(target, TWEEN_DURATION)
        .easing(Easing.Quadratic.Out)
        .onUpdate(onUpdate)
        .onComplete(requestPixelProjectionsUpdate)
        .start(Date.now())
        .group(tweenGroup);
};

export const sphericalToCartesian = (spherical, center) => ({
    x: center.x + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta),
    y: center.y + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta),
    z: center.z + spherical.radius * Math.cos(spherical.phi),
});

export const toSpherical = (position, center) => {
    const dx = position.x - center.x,
        dy = position.y - center.y,
        dz = position.z - center.z;
    const radius = Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
    return {
        radius,
        theta: normalizeAngle(Math.atan2(dy, dx)),
        phi: Math.acos(dz / radius),
    };
};

export const normalizeTheta = (currentTheta, targetTheta) => {
    let delta = targetTheta - currentTheta;
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    return currentTheta + delta;
};

export const normalizeAngle = (angle) =>
    angle < 0 ? angle + 2 * Math.PI : angle >= 2 * Math.PI ? angle - 2 * Math.PI : angle;
