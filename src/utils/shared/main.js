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

export const getNextId = (cuboids) => {
    const maxId = cuboids.reduce((max, obj) => {
        const idNum = parseInt(obj.id, 10);
        return isNaN(idNum) ? max : Math.max(max, idNum);
    }, -1);
    return maxId + 1;
};
