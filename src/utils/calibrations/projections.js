import { Vector2, Vector3, Matrix4, BufferGeometry, BufferAttribute } from "three";

import { getCalibrationByUrl, get3DPointsForImage } from "utils/calibrations";
import { getMatchingKeyForTimestamp } from "./general";
import { getRGBFromMatchedColorArray } from "utils/editor";

export const project3DPointsTo2D = (positionArray, calibration, imageWidth, imageHeight) => {
    const { extrinsic, intrinsic, distortion } = calibration;
    if (!intrinsic || !extrinsic) return {};

    const points2D = [];
    const extrinsic_matrix = new Matrix4().fromArray(extrinsic).transpose();
    const { fx, cx, fy, cy } = getIntrinsicParameters(intrinsic);

    for (let i = 0; i < positionArray.length; i += 3) {
        const point_world = new Vector3(
            positionArray[i],
            positionArray[i + 1],
            positionArray[i + 2],
        );

        const index = i / 3;
        const point_camera = point_world.clone().applyMatrix4(extrinsic_matrix);

        const { x: x_cam, y: y_cam, z: z_cam } = point_camera;

        if (z_cam <= 0) continue;

        const x_norm = x_cam / z_cam;
        const y_norm = y_cam / z_cam;

        const { x_dist, y_dist } = applyFisheyeDistortion(x_norm, y_norm, distortion);

        const u = Math.round(fx * x_dist + cx);
        const v = imageHeight - Math.round(fy * y_dist + cy); // почему? three.js сказал потому

        if (isPointInBounds(u, v, imageWidth, imageHeight)) {
            points2D.push(u, v, index);
        }
    }

    return new Int32Array(points2D);
};

export const getIntrinsicParameters = ([fx, , cx, , fy, cy]) => {
    return { fx, cx, fy, cy };
};

export const applyFisheyeDistortion = (x_norm, y_norm, distortion, applyDistortion = true) => {
    if (!applyDistortion || !distortion) {
        return { x_dist: x_norm, y_dist: y_norm };
    }

    const [k1, k2, p1, p2, k3, k4, k5, k6] = distortion;

    const point = new Vector2(x_norm, y_norm);

    const r2 = point.lengthSq();
    const r4 = r2 * r2;
    const r6 = r4 * r2;

    const radial_dist_num = 1 + k1 * r2 + k2 * r4 + k3 * r6;
    const radial_dist_denom = 1 + k4 * r2 + k5 * r4 + k6 * r6;

    const radial_dist = radial_dist_denom !== 0 ? radial_dist_num / radial_dist_denom : 1;

    point.multiplyScalar(radial_dist);

    const { x, y } = point;

    const x_dist = x + 2 * p1 * x * y + p2 * (r2 + 2 * x * x);
    const y_dist = y + p1 * (r2 + 2 * y * y) + 2 * p2 * x * y;

    return { x_dist, y_dist };
};

const isPointInBounds = (u, v, imageWidth, imageHeight, marginFactor = 0) => {
    const margin = Math.max(imageWidth, imageHeight) * marginFactor;
    return u >= -margin && u < imageWidth + margin && v >= -margin && v < imageHeight + margin;
};

export const buildImageGeometry = (
    url,
    img,
    imagesByCamera,
    calibrations,
    pointCloudRefs,
    projectedPointsRef,
) => {
    const { width, height } = img;

    const calibration = getCalibrationByUrl(url, imagesByCamera, calibrations) ?? {};
    const positionArray = get3DPointsForImage(url, pointCloudRefs.current) ?? [];
    const points = project3DPointsTo2D(positionArray, calibration, width, height);

    const cloud = getMatchingKeyForTimestamp(url, pointCloudRefs.current);
    const matchedColorArray = pointCloudRefs.current[cloud].geometry.attributes.color.array;

    const alpha = 1.0;
    const size = 5;

    if (!projectedPointsRef.current[url]) {
        const indices = [];
        const positions = [];
        const colors = [];
        const sizes = [];
        const alphas = [];

        for (let i = 0; i < points.length; i += 3) {
            const pointIndex = points[i + 2];

            const x = points[i] - img.width / 2;
            const y = points[i + 1] - img.height / 2;
            const z = 0.1;

            const { r, g, b } = getRGBFromMatchedColorArray(pointIndex, matchedColorArray);

            indices.push(pointIndex);
            positions.push(x, y, z);
            colors.push(r, g, b);
            sizes.push(size);
            alphas.push(alpha);
        }

        const geometry = new BufferGeometry();

        geometry.setAttribute("indices", new BufferAttribute(new Uint32Array(indices), 1));
        geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
        geometry.setAttribute("color", new BufferAttribute(new Uint8Array(colors), 3, true));
        geometry.setAttribute("size", new BufferAttribute(new Uint8Array(sizes), 1));
        geometry.setAttribute("alpha", new BufferAttribute(new Float32Array(alphas), 1));

        projectedPointsRef.current[url] = geometry;
    }
};
