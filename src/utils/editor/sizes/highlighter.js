import { convertFloatToUint } from "./cloud";

export const invalidateHighlighterPointsSize = ({ geometry, size }) => {
    const sizeArray = geometry.attributes.size_highlighter.array;
    const newSize = convertFloatToUint(size);

    for (let i = 0; i < sizeArray.length; i++) {
        sizeArray[i] = newSize;
    }

    geometry.attributes.size_highlighter.needsUpdate = true;
};
