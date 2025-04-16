import { getCalibrationByUrl, get3DPointsForImage } from "utils/calibrations";

export const project3DPointsTo2D = (positionArray, calibration, imageWidth, imageHeight) => {
    const { extrinsic, intrinsic, distortion } = calibration;

    if (!calibration.intrinsic || !calibration.extrinsic) return {};

    const points3D = new Float32Array(positionArray.length);
    for (let i = 0; i < positionArray.length; i++) {
        points3D[i] = positionArray[i];
    }

    const fx = intrinsic[0];
    const fy = intrinsic[4];
    const cx = intrinsic[2];
    const cy = intrinsic[5];

    const [k1, k2, p1, p2, k3, k4, k5, k6] = distortion;

    const extrinsicMatrix = [
        [extrinsic[0], extrinsic[1], extrinsic[2], extrinsic[3]],
        [extrinsic[4], extrinsic[5], extrinsic[6], extrinsic[7]],
        [extrinsic[8], extrinsic[9], extrinsic[10], extrinsic[11]],
        [extrinsic[12], extrinsic[13], extrinsic[14], extrinsic[15]],
    ];

    const points2D = [];

    for (let i = 0; i < points3D.length; i += 3) {
        const x = points3D[i];
        const y = points3D[i + 1];
        const z = points3D[i + 2];
        const index = i / 3;

        const x_cam =
            extrinsicMatrix[0][0] * x +
            extrinsicMatrix[0][1] * y +
            extrinsicMatrix[0][2] * z +
            extrinsicMatrix[0][3];
        const y_cam =
            extrinsicMatrix[1][0] * x +
            extrinsicMatrix[1][1] * y +
            extrinsicMatrix[1][2] * z +
            extrinsicMatrix[1][3];
        const z_cam =
            extrinsicMatrix[2][0] * x +
            extrinsicMatrix[2][1] * y +
            extrinsicMatrix[2][2] * z +
            extrinsicMatrix[2][3];

        if (z_cam <= 0) continue;

        const x_norm = x_cam / z_cam;
        const y_norm = y_cam / z_cam;

        const r2 = x_norm * x_norm + y_norm * y_norm;
        const r4 = r2 * r2;
        const r6 = r4 * r2;

        const radial_dist = (1 + k1 * r2 + k2 * r4 + k3 * r6) / (1 + k4 * r2 + k5 * r4 + k6 * r6);

        const x_dist =
            x_norm * radial_dist + 2 * p1 * x_norm * y_norm + p2 * (r2 + 2 * x_norm * x_norm);
        const y_dist =
            y_norm * radial_dist + p1 * (r2 + 2 * y_norm * y_norm) + 2 * p2 * x_norm * y_norm;

        const u = Math.round(fx * x_dist + cx);
        const v = Math.round(fy * y_dist + cy);

        if (u >= 0 && u < imageWidth && v >= 0 && v < imageHeight) {
            points2D.push(u, v, index);
        }
    }

    return new Uint32Array(points2D);
};

export const getProjectedPoints = (
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

    projectedPointsRef.current[url] = project3DPointsTo2D(
        positionArray,
        calibration,
        width,
        height,
    );
};
