export const parseExtrinsic = (extrinsicArray) => {
    if (extrinsicArray.length !== 16) {
        console.warn("Incorrect extrinsic format, expected 16 length array.");
        return { rotation: [], translation: [] };
    }

    const rotation = [
        extrinsicArray[0],
        extrinsicArray[1],
        extrinsicArray[2],
        extrinsicArray[4],
        extrinsicArray[5],
        extrinsicArray[6],
        extrinsicArray[8],
        extrinsicArray[9],
        extrinsicArray[10],
    ];

    const translation = [extrinsicArray[3], extrinsicArray[7], extrinsicArray[11]];

    return { rotation, translation };
};

export const getCalibrationByUrl = (url, cameras, calibrations) => {
    const matchedCamera = cameras.find((camera) => url.includes(camera));

    if (matchedCamera && calibrations[matchedCamera]) {
        return calibrations[matchedCamera];
    }
};

export const getMatchingKeyForTimestamp = (imageUrl, pointCloud) => {
    const match = imageUrl.match(/\/([^\/]+)\.jpg$/);
    if (!match) return null;

    const timestamp = match[1];
    return Object.keys(pointCloud).find((pcdUrl) => pcdUrl.includes(`${timestamp}.pcd`));
};

export const get3DPointsForImage = (imageUrl, pointCloud) => {
    const matchingKey = getMatchingKeyForTimestamp(imageUrl, pointCloud);

    if (matchingKey) {
        return pointCloud[matchingKey].geometry.attributes.position.array;
    }

    return null;
};
