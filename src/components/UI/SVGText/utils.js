export const getPosition = () => {
    switch (position) {
        case "top-right":
            return {
                x: parentWidth - planeWidth - x,
                y: y,
            };
        case "bottom-left":
            return {
                x: x,
                y: parentHeight - planeHeight - y,
            };
        case "bottom-right":
            return {
                x: parentWidth - planeWidth - x,
                y: parentHeight - planeHeight - y,
            };
        case "center":
            return {
                x: (parentWidth - planeWidth) / 2,
                y: (parentHeight - planeHeight) / 2,
            };
        default:
            return { x: x, y: y };
    }
};
