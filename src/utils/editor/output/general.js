export const formatPointLabels = (folderName, pointLabels) => {
    return Object.entries(pointLabels).map(([filePath, labels]) => {
        const pathParts = filePath.split("/");
        const fileName = pathParts.pop();
        return { folderName: folderName, fileName: fileName, labels };
    });
};

export const formatObjects = (folderName, objects, files) => {
    return Object.entries(objects).map(([filePath, cuboids], frame) => {
        const pathParts = files[frame].split("/");
        const fileName = pathParts.pop();
        return { folderName: folderName, fileName: fileName, cuboids };
    });
};
