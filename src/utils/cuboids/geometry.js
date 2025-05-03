import * as THREE from "three";

export const createCubeGeometry = (color, position, scale, rotation) => {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.025,
        side: THREE.DoubleSide,
    });

    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(...position);
    cube.scale.set(...scale);
    cube.rotation.set(...rotation);

    return {
        mesh: cube,
        cleanup: () => {
            geometry.dispose();
            material.dispose();
        },
    };
};

export const createEdgesGeometry = (cubeGeometry, color) => {
    const edgesGeometry = new THREE.EdgesGeometry(cubeGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        linewidth: 2,
    });

    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);

    return {
        mesh: edges,
        cleanup: () => {
            edgesGeometry.dispose();
            edgesMaterial.dispose();
        },
    };
};

export const createArrowGeometry = (color, scale, rotation, zOffset) => {
    const arrowSize = Math.min(...scale) * 0.5;

    const rawPoints = [
        [-0.5, 0],
        [-1, 1],
        [1, 0],
        [-1, -1],
        [-0.5, 0],
    ];

    const arrowPoints = rawPoints.map(([x, y]) => {
        const normalizedX = (x / 2) * arrowSize;
        const normalizedY = (y / 2) * arrowSize;
        return new THREE.Vector3(normalizedX, normalizedY, zOffset);
    });

    const arrowGeometry = new THREE.BufferGeometry().setFromPoints(arrowPoints);
    const arrowMaterial = new THREE.LineBasicMaterial({
        color: color,
    });

    const arrow = new THREE.Line(arrowGeometry, arrowMaterial);
    arrow.rotation.set(...rotation);

    return {
        mesh: arrow,
        cleanup: () => {
            arrowGeometry.dispose();
            arrowMaterial.dispose();
        },
    };
};
