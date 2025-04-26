import { Sphere, Vector2, Vector3, Matrix4, BufferGeometry, BufferAttribute } from "three";

import { getCalibrationByUrl, get3DPointsForImage } from "utils/calibrations";
import { getMatchingKeyForTimestamp } from "./general";
import { getRGBFromMatchedColorArray } from "utils/editor";

const project3DPointsTo2D = (positionArray, calibration, imageWidth, imageHeight) => {
    const { extrinsic, intrinsic, distortion } = calibration;
    if (!intrinsic || !extrinsic) return {};

    const MAX_DISTORTION_RADIUS = 3.0;

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

        const r = Math.sqrt(x_norm * x_norm + y_norm * y_norm);
        if (r > MAX_DISTORTION_RADIUS) continue;

        const { x_dist, y_dist } = applyBrownConradyDistortion(x_norm, y_norm, distortion);

        const u = Math.round(fx * x_dist + cx);
        const v = imageHeight - Math.round(fy * y_dist + cy);

        if (isPointInBounds({ u, v, imageWidth, imageHeight, marginFactor: 0 })) {
            points2D.push(u, v, index);
        }
    }

    return new Int32Array(points2D);
};

const getIntrinsicParameters = ([fx, , cx, , fy, cy]) => {
    return { fx, cx, fy, cy };
};

const applyBrownConradyDistortion = (x_norm, y_norm, distortion, applyDistortion = true) => {
    if (!applyDistortion || !distortion) {
        return { x_dist: x_norm, y_dist: y_norm };
    }

    const [k1 = 0, k2 = 0, p1 = 0, p2 = 0, k3 = 0, k4 = 0, k5 = 0, k6 = 0] = distortion;

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

const applyKannalaBrandtDistortion = (x_norm, y_norm, distortion, applyDistortion = true) => {
    if (!applyDistortion || !distortion || distortion.length === 0) {
        return { x_dist: x_norm, y_dist: y_norm };
    }

    const [k1 = 0, k2 = 0, k3 = 0, k4 = 0] = distortion;

    const point = new Vector2(x_norm, y_norm);

    const r = point.length();

    let scale = 1.0;

    if (r > 1e-8) {
        const theta = Math.atan(r);

        const theta2 = theta * theta;
        const theta4 = theta2 * theta2;
        const theta6 = theta4 * theta2;
        const theta8 = theta4 * theta4;

        const theta_d = theta * (1 + k1 * theta2 + k2 * theta4 + k3 * theta6 + k4 * theta8);

        scale = theta_d / r;
    }

    const x_dist = x_norm * scale;
    const y_dist = y_norm * scale;

    return { x_dist, y_dist };
};

const isPointInBounds = ({ u, v, imageWidth, imageHeight, marginFactor }) => {
    const margin = Math.max(imageWidth, imageHeight) * marginFactor;
    return u >= -margin && u < imageWidth + margin && v >= -margin && v < imageHeight + margin;
};

export const chooseBestCamera = (activeFrameImagesPath, projectedPoints, highlightedPoint) => {
    let maxResolutionImage = null;
    let maxResolution = 0;

    for (const { image } of activeFrameImagesPath) {
        const projected = projectedPoints?.[image.src];
        if (projected) {
            const position = projected.indexToPositionMap.get(highlightedPoint.index);
            if (position) {
                const resolution = image.width * image.height;

                if (resolution > maxResolution) {
                    maxResolution = resolution;
                    maxResolutionImage = image;
                }
            }
        }
    }

    return maxResolutionImage;
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

        let maxIndex = 0;
        for (let i = 0; i < points.length; i += 3) {
            maxIndex = Math.max(maxIndex, points[i + 2]);
        }

        const xCoords = new Int16Array(maxIndex + 1);
        const yCoords = new Int16Array(maxIndex + 1);

        for (let i = 0; i < points.length; i += 3) {
            const pointIndex = points[i + 2];

            const x = points[i] - img.width / 2;
            const y = points[i + 1] - img.height / 2;

            xCoords[pointIndex] = Math.round(x);
            yCoords[pointIndex] = Math.round(y);

            const { r, g, b } = getRGBFromMatchedColorArray(pointIndex, matchedColorArray);

            indices.push(pointIndex);
            positions.push(x, y);
            colors.push(r, g, b);
            sizes.push(size);
            alphas.push(alpha);
        }

        const geometry = new BufferGeometry();

        geometry.setAttribute("position", new BufferAttribute(new Int16Array(positions), 2));
        geometry.setAttribute("indices", new BufferAttribute(new Float32Array(indices), 1));
        geometry.setAttribute("color", new BufferAttribute(new Uint8Array(colors), 3, true));

        geometry.setAttribute("size_image", new BufferAttribute(new Uint8Array(sizes), 1));
        geometry.setAttribute("size_highlighter", new BufferAttribute(new Uint8Array(sizes), 1));
        geometry.setAttribute("alpha_image", new BufferAttribute(new Uint8Array(alphas), 1));
        geometry.setAttribute("alpha_highlighter", new BufferAttribute(new Uint8Array(alphas), 1));

        const radius = Math.max(img.width, img.height);
        geometry.boundingSphere = new Sphere(new Vector3(0, 0, 0), radius);

        projectedPointsRef.current[url] = {
            geometry,
            indexToPositionMap: {
                xCoords,
                yCoords,
                get: (index) => {
                    const x = xCoords[index];
                    const y = yCoords[index];
                    if (x === undefined || y === undefined || (x === 0 && y === 0)) {
                        return null;
                    }
                    return [x, y];
                },
            },
        };
    }
};
