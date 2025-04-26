export const convertFloatToUint = (value) => value * 10;

export const invalidateCloudPointsSize = (geometry) => {
    geometry.attributes.size.needsUpdate = true;
};

export const getSizeArray = (pointCloudRefs, filePath) => {
    const pointCloud = pointCloudRefs.current[filePath];
    return pointCloud?.geometry?.attributes?.size?.array || null;
};

const createSizeMap = (sizeSettings) => {
    const sizeMap = new Map();
    for (const classKey in sizeSettings) {
        if (sizeSettings.hasOwnProperty(classKey)) {
            const classData = sizeSettings[classKey];
            sizeMap.set(classData.originalIndex, classData.value);
        }
    }
    return sizeMap;
};

const calculatePointSize = (
    label,
    sizeMap,
    generalPointSize,
    selectedClassPointSize,
    selectedClassIndex,
) => {
    const labelSize = sizeMap.get(label) ?? 0;
    const baseSize =
        label === 0
            ? convertFloatToUint(generalPointSize)
            : convertFloatToUint(generalPointSize + labelSize);

    return label === selectedClassIndex
        ? baseSize + convertFloatToUint(selectedClassPointSize)
        : baseSize;
};

const updateSizeArray = (
    sizeArray,
    labels,
    sizeMap,
    generalPointSize,
    selectedClassPointSize,
    selectedClassIndex,
) => {
    for (let i = 0; i < sizeArray.length; i++) {
        sizeArray[i] = calculatePointSize(
            labels[i],
            sizeMap,
            generalPointSize,
            selectedClassPointSize,
            selectedClassIndex,
        );
    }
};

export const updatePointsSize = ({ cloudData, sizesData }) => {
    const { cloud, labels } = cloudData;
    const { pointSizes, selectedClass } = sizesData;

    const geometry = cloud.geometry;
    const sizeAttribute = geometry.attributes.size;
    if (!sizeAttribute) return;

    const generalPointSize = pointSizes.generalPointSize.value;
    const selectedClassPointSize = pointSizes.selectedClassSize.value;
    const sizeMap = createSizeMap(pointSizes);
    const sizeArray = sizeAttribute.array;

    updateSizeArray(
        sizeArray,
        labels,
        sizeMap,
        generalPointSize,
        selectedClassPointSize,
        selectedClass,
    );

    invalidateCloudPointsSize(geometry);
};

export const updateSelectedPointsSize = ({ cloudData, sizesData, selectionData }) => {
    const { cloud, labels } = cloudData;
    const { pointSizes, selectedClass } = sizesData;
    const { selectedPoints } = selectionData;

    const geometry = cloud.geometry;
    const sizeAttribute = geometry.attributes.size;
    if (!sizeAttribute) return;

    const generalPointSize = pointSizes.generalPointSize.value;
    const selectedClassPointSize = pointSizes.selectedClassSize.value;
    const sizeMap = createSizeMap(pointSizes);
    const sizeArray = sizeAttribute.array;

    for (let i = 0; i < selectedPoints.length; i++) {
        const index = selectedPoints[i];
        const pointLabel = labels[index];
        sizeArray[index] = calculatePointSize(
            pointLabel,
            sizeMap,
            generalPointSize,
            selectedClassPointSize,
            selectedClass,
        );
    }

    invalidateCloudPointsSize(geometry);
};

export const updateHighlightedPointSize = ({ cloudData, highlightedPoint, sizesData }) => {
    const { cloud, labels } = cloudData;
    const { current, previous } = highlightedPoint;
    const { selectedClass, pointSizes } = sizesData;

    const geometry = cloud.geometry;
    const sizeAttribute = geometry.attributes.size;
    if (!sizeAttribute) return;

    const generalPointSize = pointSizes.generalPointSize?.value;
    const highlightedPointIncrement = pointSizes.highlightedPointSize?.value;
    const selectedClassPointSize = pointSizes.selectedClassSize?.value;

    const sizeMap = createSizeMap(pointSizes);
    const sizeArray = sizeAttribute.array;

    sizeArray[previous] = calculatePointSize(
        labels[previous],
        sizeMap,
        generalPointSize,
        selectedClassPointSize,
        selectedClass,
    );

    if (current !== undefined) {
        sizeArray[current] += convertFloatToUint(highlightedPointIncrement);
    }

    invalidateCloudPointsSize(geometry);
};
