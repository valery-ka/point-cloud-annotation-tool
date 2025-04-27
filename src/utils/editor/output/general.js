export const formatPointLabels = (folderName, pointLabels) => {
    return Object.entries(pointLabels).map(([filePath, labels]) => {
        const pathParts = filePath.split("/");
        const fileName = pathParts.pop();
        return { folderName: folderName, fileName: fileName, labels };
    });
};
