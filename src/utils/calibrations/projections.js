import { Sphere, Vector2, Vector3, Matrix4, BufferGeometry, BufferAttribute } from "three";

import { getCalibrationByUrl, get3DPointsForImage } from "utils/calibrations";
import { getMatchingKeyForTimestamp } from "./general";
import { getRGBFromMatchedColorArray } from "utils/editor";
import { calculateUndistortedBounds } from "./heuristics";
import { pointInPolyRaycast } from "utils/tools";

const apply = "apply";
const remove = "remove";
const none = "none";

export const getIntrinsicParameters = ([fx, , cx, , fy, cy]) => {
    return { fx, cx, fy, cy };
};

const getDistorionParameters = (distortion = [], modelType = "brownConrady") => {
    if (modelType === "kannalaBrandt") {
        return {
            k1: distortion[0] || 0,
            k2: distortion[1] || 0,
            k3: distortion[2] || 0,
            k4: distortion[3] || 0,
        };
    }

    return {
        k1: distortion[0] || 0,
        k2: distortion[1] || 0,
        p1: distortion[2] || 0,
        p2: distortion[3] || 0,
        k3: distortion[4] || 0,
        k4: distortion[5] || 0,
        k5: distortion[6] || 0,
        k6: distortion[7] || 0,
    };
};

const getDistortionFunction = (distortion) => {
    const isDistortionAvailable = distortion && distortion.length > 0;

    const isBrownConradyDistortion = isDistortionAvailable && distortion.length === 8;
    const isKannalaBrandtDistortion = isDistortionAvailable && distortion.length === 4;

    if (isBrownConradyDistortion) {
        return brownConradyDistortion;
    } else if (isKannalaBrandtDistortion) {
        return kannalaBrandtDistortion;
    }
    return distortionNotAvailable;
};

const isPointInImageBounds = ({ u, v, imageWidth, imageHeight }) => {
    const padding = 0;
    return u >= -padding && u < imageWidth + padding && v >= -padding && v < imageHeight + padding;
};

export const project3DPointsTo2D = (
    positionArray,
    calibration,
    imageWidth,
    imageHeight,
    distortionThreshold,
) => {
    const { extrinsic, intrinsic, distortion } = calibration;
    if (!intrinsic || !extrinsic) return new Int32Array(0);

    const points2D = [];

    const extrinsic_matrix = new Matrix4().fromArray(extrinsic).transpose();
    const { fx, cx, fy, cy } = getIntrinsicParameters(intrinsic);

    const point_world = new Vector3();
    const point_camera = new Vector3();

    const distortionFunction = getDistortionFunction(distortion);

    const processBrownConradyPoint = (x_dist, y_dist, u, v, index) => {
        const dist_u = Math.round(fx * x_dist + cx);
        const dist_v = imageHeight - Math.round(fy * y_dist + cy);
        if (
            pointInPolyRaycast([u, v], polygon) &&
            isPointInImageBounds({ u: dist_u, v: dist_v, imageWidth, imageHeight })
        ) {
            points2D.push(dist_u, dist_v, index);
        }
    };

    const processKannalaBrandtPoint = (x_dist, y_dist, index) => {
        const u = Math.round(fx * x_dist + cx);
        const v = imageHeight - Math.round(fy * y_dist + cy);
        if (isPointInImageBounds({ u, v, imageWidth, imageHeight })) {
            points2D.push(u, v, index);
        }
    };

    const processUndistortedPoint = (u, v, index) => {
        if (isPointInImageBounds({ u, v, imageWidth, imageHeight })) {
            points2D.push(u, v, index);
        }
    };

    const { polygon } = calculateUndistortedBounds({
        imageWidth,
        imageHeight,
        intrinsic,
        distortion,
        distortionThreshold,
    });

    for (let i = 0; i < positionArray.length; i += 3) {
        const index = i / 3;

        point_world.fromArray(positionArray, i);
        point_camera.copy(point_world).applyMatrix4(extrinsic_matrix);

        const { x: x_cam, y: y_cam, z: z_cam } = point_camera;
        if (z_cam <= 0) continue;

        const x_norm = x_cam / z_cam;
        const y_norm = y_cam / z_cam;

        const { x_dist, y_dist } = distortionFunction(x_norm, y_norm, distortion);

        const u = Math.round(fx * x_norm + cx);
        const v = imageHeight - Math.round(fy * y_norm + cy);

        if (distortionFunction === brownConradyDistortion) {
            processBrownConradyPoint(x_dist, y_dist, u, v, index);
        } else if (distortionFunction === kannalaBrandtDistortion) {
            processKannalaBrandtPoint(x_dist, y_dist, index);
        } else if (distortionFunction === distortionNotAvailable) {
            processUndistortedPoint(u, v, index);
        }
    }

    return new Int32Array(points2D);
};

export const brownConradyDistortion = (x_norm, y_norm, distortion, action = apply) => {
    if (!distortion || distortion.length === 0 || action === none) {
        return { x_dist: x_norm, y_dist: y_norm };
    }

    const { k1, k2, p1, p2, k3, k4, k5, k6 } = getDistorionParameters(distortion, "brownConrady");

    const point = new Vector2(x_norm, y_norm);

    const r2 = point.lengthSq();
    const r4 = r2 * r2;
    const r6 = r4 * r2;

    const radial_dist_num = 1 + k1 * r2 + k2 * r4 + k3 * r6;
    const radial_dist_denom = 1 + k4 * r2 + k5 * r4 + k6 * r6;

    const apply_radial = radial_dist_denom !== 0 ? radial_dist_num / radial_dist_denom : 1;
    const remove_radial = radial_dist_num !== 0 ? radial_dist_denom / radial_dist_num : 1;

    const radial_dist = action === remove ? remove_radial : apply_radial;

    point.multiplyScalar(radial_dist);

    const { x, y } = point;

    const p1_effective = action === remove ? -p1 : p1;
    const p2_effective = action === remove ? -p2 : p2;

    const x_dist = x + 2 * p1_effective * x * y + p2_effective * (r2 + 2 * x * x);
    const y_dist = y + p1_effective * (r2 + 2 * y * y) + 2 * p2_effective * x * y;

    return { x_dist, y_dist };
};

const kannalaBrandtDistortion = (x_norm, y_norm, distortion, applyDistortion = true) => {
    if (!applyDistortion || !distortion || distortion.length === 0) {
        return { x_dist: x_norm, y_dist: y_norm };
    }

    const { k1, k2, k3, k4 } = getDistorionParameters(distortion, "kannalaBrandt");

    const point = new Vector2(x_norm, y_norm);

    const r = point.length();

    let scale = 1.0;

    const epsilon = 1e-10;
    if (r > epsilon) {
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

const distortionNotAvailable = (x_norm, y_norm) => {
    return { x_dist: x_norm, y_dist: y_norm };
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
    distortionThreshold,
) => {
    const { width, height } = img;

    const calibration = getCalibrationByUrl(url, imagesByCamera, calibrations) ?? {};
    const positionArray = get3DPointsForImage(url, pointCloudRefs.current) ?? [];
    const points = project3DPointsTo2D(
        positionArray,
        calibration,
        width,
        height,
        distortionThreshold,
    );

    const cloud = getMatchingKeyForTimestamp(url, pointCloudRefs.current);
    const matchedColorArray = pointCloudRefs.current[cloud]?.geometry.attributes.color.array;

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
