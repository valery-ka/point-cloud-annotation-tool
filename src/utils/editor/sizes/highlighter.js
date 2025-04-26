import { convertFloatToUint } from "./cloud";

export const invalidateHighlighterPointsSize = ({ imageData, sizeData }) => {
    const { geometry } = imageData;
    const { defaultSize } = sizeData;

    const sizeArray = geometry.attributes.size_highlighter.array;
    const newSize = convertFloatToUint(defaultSize);

    for (let i = 0; i < sizeArray.length; i++) {
        sizeArray[i] = newSize;
    }

    geometry.attributes.size_highlighter.needsUpdate = true;
};
