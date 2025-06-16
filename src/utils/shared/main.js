export const getChildTypes = (objects) => {
    const childTypes = new Set();
    if (!objects) return childTypes;

    for (const obj of objects) {
        for (const [type, data] of Object.entries(obj)) {
            if (data.parent) {
                childTypes.add(type);
            }
        }
    }
    return childTypes;
};

export const formatObjectData = (type, data, objects) => {
    let children = null;

    if (data.abstract) {
        const childrenList = [];
        for (const obj of objects) {
            for (const [childType, childData] of Object.entries(obj)) {
                if (childData.parent === type) {
                    childrenList.push(childType);
                }
            }
        }
        children = childrenList.join(", ");
    }

    return {
        type,
        title: data.title,
        description: data.description,
        dimensions: data.dimensions || null,
        color: data.color || null,
        children,
    };
};

export const getChildObjects = (parentType, objects) => {
    const children = [];

    for (const obj of objects) {
        for (const [type, data] of Object.entries(obj)) {
            if (data.parent === parentType) {
                children.push(formatObjectData(type, data, objects));
            }
        }
    }

    return children;
};

export const getNextId = (...arrays) => {
    const maxId = arrays.reduce((max, array) => {
        const currentMax = array.reduce((arrMax, obj) => {
            const idNum = parseInt(obj.id, 10);
            return isNaN(idNum) ? arrMax : Math.max(arrMax, idNum);
        }, max);
        return Math.max(max, currentMax);
    }, -1);

    return maxId + 1;
};

export const getSVGPosition = (
    x,
    y,
    position,
    parentWidth,
    parentHeight,
    planeWidth,
    planeHeight,
) => {
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
