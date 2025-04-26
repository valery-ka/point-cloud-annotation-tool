import { convertFloatToUint } from "./cloud";

export const invalidateImagePointsSize = ({ cloudData, imageData, sizeData }) => {
    const { labels } = cloudData;
    const { geometry } = imageData;
    if (!geometry || !labels) return;

    const { defaultSize, selectedClass, selectedClassIncrement } = sizeData;

    const indices = geometry.attributes.indices.array;
    const sizeArray = geometry.attributes.size_image.array;

    for (let i = 0; i < indices.length; i++) {
        const pointIndex = indices[i];
        const label = labels[pointIndex];

        sizeArray[i] = convertFloatToUint(defaultSize);
        if (label === selectedClass) {
            sizeArray[i] += convertFloatToUint(selectedClassIncrement);
        }
    }

    geometry.attributes.size_image.needsUpdate = true;
};
