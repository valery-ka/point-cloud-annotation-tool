const isDisposableObject = (obj) => {
    const isHelper = obj.isAxesHelper || obj.type === "AxesHelper";
    return (obj.isMesh || obj.isGroup || obj.isPoints || obj.isLineSegments) && !isHelper;
};

export const clearThreeScene = (scene) => {
    const objectsToRemove = [];

    const clearThreeGroup = (object) => {
        if (!object.isGroup) return;

        while (object.children.length > 0) {
            const groupChild = object.children[0];
            object.remove(groupChild);

            if (groupChild.isGroup) {
                clearThreeGroup(groupChild);
            } else if (groupChild.isMesh) {
                clearThreeMesh(groupChild);
            }
        }
    };

    const clearThreeMesh = (object) => {
        if (!object.isMesh && !object.isPoints && !object.isLineSegments) return;

        object.geometry?.dispose();
        if (Array.isArray(object.material)) {
            object.material.forEach((m) => m.dispose());
        } else {
            object.material?.dispose();
        }
    };

    for (const child of scene.children) {
        if (isDisposableObject(child)) {
            objectsToRemove.push(child);
        }
    }

    for (const object of objectsToRemove) {
        scene.remove(object);

        if (object.isGroup) {
            clearThreeGroup(object);
        } else {
            clearThreeMesh(object);
        }
    }
};
