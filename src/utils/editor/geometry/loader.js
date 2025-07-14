import { BufferAttribute, Points } from "three";

export const handleIntensityAttribute = (geometry) => {
    if (geometry?.attributes?.intensity) {
        const [minColor, maxColor] = [50, 255];
        const intensityArray = geometry.attributes.intensity.array;

        const intensityToColor = intensityArray.map((intensity) => {
            return Math.round(minColor + (maxColor - minColor) * (intensity / 255));
        });

        const intensityToColorArray = new Uint8Array(intensityToColor);
        geometry.setAttribute("intensity", new BufferAttribute(intensityToColorArray, 1));
    }
};

export const handleLabelAttribute = (geometry, filePath, pointLabelsRef) => {
    if (geometry?.attributes?.label) {
        const labels = geometry.attributes.label.array;
        pointLabelsRef.current[filePath] = new Uint8Array(labels);
        geometry.deleteAttribute("label");
    }
};

export const loadLabelsForFolder = async (folderName, labelsCache, loadLabels) => {
    try {
        const labels = await loadLabels(folderName);
        labelsCache[folderName] = labels;
    } catch (error) {
        console.error(`Error loading labels for ${folderName}`, error);
    }
};

export const getLabelsForFile = async ({
    filePath,
    numPoints,
    folderName,
    labelsCache,
    pointLabelsRef,
    prevLabelsRef,
    availableLabels,
    loadLabels,
    isSemanticSegmentationTask,
}) => {
    const path = filePath.split("/");
    const fileName = path.pop();

    if (!labelsCache[folderName]) {
        await loadLabelsForFolder(folderName, labelsCache, loadLabels);
    }

    const labels = labelsCache[folderName];
    const fileData = Array.isArray(labels)
        ? labels.find((entry) => entry.fileName === fileName)
        : null;

    if (fileData) {
        pointLabelsRef.current[filePath] = new Uint8Array(fileData.labels);
    } else if (!pointLabelsRef.current[filePath]) {
        pointLabelsRef.current[filePath] = new Uint8Array(numPoints).fill(0);
    }

    const updatedLabels = pointLabelsRef.current[filePath].map((label) =>
        availableLabels.has(label) ? label : 0,
    );

    pointLabelsRef.current[filePath] = isSemanticSegmentationTask
        ? new Uint8Array(updatedLabels)
        : new Uint8Array(numPoints).fill(0);

    prevLabelsRef.current[filePath] = isSemanticSegmentationTask
        ? new Uint8Array(updatedLabels)
        : new Uint8Array(numPoints).fill(0);
};

export const setupPointCloudGeometry = (geometry) => {
    const positionArray = geometry.attributes.position.array;
    const numPoints = positionArray.length / 3;

    const colorArray = new Uint8Array(numPoints * 3);
    const sizeArray = new Uint8Array(numPoints);

    geometry.setAttribute("color", new BufferAttribute(colorArray, 3, true));
    geometry.setAttribute("size", new BufferAttribute(sizeArray, 1));

    return numPoints;
};

export const createPointCloud = (geometry, material) => {
    return new Points(geometry, material);
};
