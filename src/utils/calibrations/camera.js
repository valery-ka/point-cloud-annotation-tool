export const switchViewToPoint = (camera, normX, normY, imageBounds) => {
    // Просто устанавливаем позицию камеры без проверки границ
    camera.position.x = normX * (imageBounds.width / 2);
    camera.position.y = normY * (imageBounds.height / 2);
    camera.updateProjectionMatrix();
};

const calculateCameraBounds = (camera, imageBounds) => {
    const halfViewWidth = (camera.right - camera.left) / 2;
    const halfViewHeight = (camera.top - camera.bottom) / 2;

    return {
        minX: -imageBounds.width / 2 + halfViewWidth,
        maxX: imageBounds.width / 2 - halfViewWidth,
        minY: -imageBounds.height / 2 + halfViewHeight,
        maxY: imageBounds.height / 2 - halfViewHeight,
    };
};
