import { getIntrinsicParameters, brownConradyDistortion } from "./projections";

export const calculateUndistortedBounds = ({
    imageWidth,
    imageHeight,
    distortion,
    intrinsic,
    distortionThreshold,
    edgePoints = 5,
}) => {
    const { fx, cx, fy, cy } = getIntrinsicParameters(intrinsic);

    const mask = [];

    let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

    const generateEdgePoints = (startX, startY, endX, endY, count) => {
        const points = [];
        for (let i = 1; i < count; i++) {
            const t = i / count;
            points.push([startX + t * (endX - startX), startY + t * (endY - startY)]);
        }
        return points;
    };

    const processPoint = (x, y) => {
        const x_norm = (x - cx) / fx;
        const y_norm = (y - cy) / fy;

        const { x_dist, y_dist } = brownConradyDistortion(x_norm, y_norm, distortion, "remove");

        const xUndistorted = x_dist * fx + cx;
        const yUndistorted = y_dist * fy + cy;

        mask.push([xUndistorted, yUndistorted]);

        minX = Math.min(minX, xUndistorted);
        minY = Math.min(minY, yUndistorted);
        maxX = Math.max(maxX, xUndistorted);
        maxY = Math.max(maxY, yUndistorted);
    };

    const corners = [
        [-distortionThreshold, -distortionThreshold],
        [imageWidth + distortionThreshold, -distortionThreshold],
        [imageWidth + distortionThreshold, imageHeight + distortionThreshold],
        [-distortionThreshold, imageHeight + distortionThreshold],
    ];

    for (let i = 0; i < 4; i++) {
        const start = corners[i];
        const end = corners[(i + 1) % 4];

        processPoint(start[0], start[1]);

        const edgePts = generateEdgePoints(start[0], start[1], end[0], end[1], edgePoints + 1);
        edgePts.forEach(([x, y]) => processPoint(x, y));
    }

    return {
        polygon: mask,
        bounds: { minX, minY, maxX, maxY },
    };
};
