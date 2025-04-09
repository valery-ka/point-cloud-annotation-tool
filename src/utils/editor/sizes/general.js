const convertFloatToUint = (value) => value * 10;

export const invalidateSize = (geometry) => {
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
    pointLabel,
    sizeMap,
    generalPointSize,
    selectedClassPointSize,
    selectedClassIndex
) => {
    const labelSize = sizeMap.get(pointLabel) ?? 0;
    const baseSize =
        pointLabel === 0
            ? convertFloatToUint(generalPointSize)
            : convertFloatToUint(generalPointSize + labelSize);

    return pointLabel === selectedClassIndex
        ? baseSize + convertFloatToUint(selectedClassPointSize)
        : baseSize;
};

const updateSizeArray = (
    sizeArray,
    pointLabels,
    sizeMap,
    generalPointSize,
    selectedClassPointSize,
    selectedClassIndex
) => {
    for (let i = 0; i < sizeArray.length; i++) {
        sizeArray[i] = calculatePointSize(
            pointLabels[i],
            sizeMap,
            generalPointSize,
            selectedClassPointSize,
            selectedClassIndex
        );
    }
};

export const updatePointsSize = (
    pointCloud,
    pointLabels,
    sizeSettings,
    selectedClassIndex
) => {
    const geometry = pointCloud.geometry;
    const sizeAttribute = geometry.attributes.size;
    if (!sizeAttribute) return;

    const generalPointSize = sizeSettings.generalPointSize.value;
    const selectedClassPointSize = sizeSettings.selectedClassSize.value;
    const sizeMap = createSizeMap(sizeSettings);
    const sizeArray = sizeAttribute.array;

    updateSizeArray(
        sizeArray,
        pointLabels,
        sizeMap,
        generalPointSize,
        selectedClassPointSize,
        selectedClassIndex
    );

    invalidateSize(geometry);
};

export const updateSelectedPointsSize = (
    pointCloud,
    pointLabels,
    sizeSettings,
    selectedClassIndex,
    selectedPointIndices
) => {
    const geometry = pointCloud.geometry;
    const sizeAttribute = geometry.attributes.size;
    if (!sizeAttribute) return;

    const generalPointSize = sizeSettings.generalPointSize.value;
    const selectedClassPointSize = sizeSettings.selectedClassSize.value;
    const sizeMap = createSizeMap(sizeSettings);
    const sizeArray = sizeAttribute.array;

    for (let i = 0; i < selectedPointIndices.length; i++) {
        const index = selectedPointIndices[i];
        const pointLabel = pointLabels[index];
        sizeArray[index] = calculatePointSize(
            pointLabel,
            sizeMap,
            generalPointSize,
            selectedClassPointSize,
            selectedClassIndex
        );
    }

    invalidateSize(geometry);
};

export const updateHighlightedPointSize = (
    pointCloud,
    pointLabels,
    sizeSettings,
    highlightedIndex,
    previousIndex,
    selectedClassIndex
) => {
    const geometry = pointCloud.geometry;
    const sizeAttribute = geometry.attributes.size;
    if (!sizeAttribute) return;

    const generalPointSize = sizeSettings.generalPointSize.value;
    const highlightedPointIncrement = sizeSettings.highlightedPointSize.value;
    const selectedClassPointSize = sizeSettings.selectedClassSize.value;

    const sizeMap = createSizeMap(sizeSettings);
    const sizeArray = sizeAttribute.array;

    sizeArray[previousIndex] = calculatePointSize(
        pointLabels[previousIndex],
        sizeMap,
        generalPointSize,
        selectedClassPointSize,
        selectedClassIndex
    );

    if (highlightedIndex !== undefined) {
        sizeArray[highlightedIndex] += convertFloatToUint(
            highlightedPointIncrement
        );
    }

    invalidateSize(geometry);
};
