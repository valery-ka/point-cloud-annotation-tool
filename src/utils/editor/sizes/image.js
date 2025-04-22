import { convertFloatToUint } from "./cloud";

export const invalidateImagePointsSize = ({ geometry, size }) => {
    const sizeArray = geometry.attributes.size_image.array;
    const newSize = convertFloatToUint(size);

    for (let i = 0; i < sizeArray.length; i++) {
        sizeArray[i] = newSize;
    }

    geometry.attributes.size_image.needsUpdate = true;
};
