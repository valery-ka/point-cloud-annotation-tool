import { convertFloatToUint } from "./cloud";

export const invalidateImagePointsSize = ({
    geometry,
    labels,
    selectedClass,
    defaultSize,
    selectedClassIncrement,
}) => {
    if (!geometry || !labels) return;

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
