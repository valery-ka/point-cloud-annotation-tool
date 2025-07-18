import {
    BoxGeometry,
    MeshBasicMaterial,
    Color,
    EdgesGeometry,
    LineBasicMaterial,
    Vector3,
    BufferGeometry,
    Line,
    DoubleSide,
    Mesh,
    LineSegments,
    Euler,
    Matrix4,
    Quaternion,
} from "three";

import { LAYERS } from "constants";

export const createCubeGeometry = (color, position, scale, rotation) => {
    const geometry = new BoxGeometry();
    const material = new MeshBasicMaterial({
        color: new Color(color),
        transparent: true,
        opacity: 0.025,
        side: DoubleSide,
    });

    const cube = new Mesh(geometry, material);
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
    const edgesGeometry = new EdgesGeometry(cubeGeometry);
    const edgesMaterial = new LineBasicMaterial({
        color: new Color(color),
        linewidth: 2,
    });

    const edges = new LineSegments(edgesGeometry, edgesMaterial);

    return {
        mesh: edges,
        cleanup: () => {
            edgesGeometry.dispose();
            edgesMaterial.dispose();
        },
    };
};

export const createArrowGeometry = (color) => {
    const ARROW_SIZE = 0.85;
    const Z_OFFSET = -0.5;

    const rawPoints = [
        [-0.5, 0],
        [-1, 1],
        [1, 0],
        [-1, -1],
        [-0.5, 0],
    ];

    const arrowPoints = rawPoints.map(([x, y]) => {
        const normalizedX = (x / 2) * ARROW_SIZE;
        const normalizedY = (y / 2) * ARROW_SIZE;
        return new Vector3(normalizedX, normalizedY, Z_OFFSET);
    });

    const arrowGeometry = new BufferGeometry().setFromPoints(arrowPoints);
    const arrowMaterial = new LineBasicMaterial({
        color: color,
    });

    const arrow = new Line(arrowGeometry, arrowMaterial);

    return {
        mesh: arrow,
        cleanup: () => {
            arrowGeometry.dispose();
            arrowMaterial.dispose();
        },
    };
};

export const extractPsrFromObject = (object3D) => {
    return {
        position: [object3D.position.x, object3D.position.y, object3D.position.z],
        scale: [object3D.scale.x, object3D.scale.y, object3D.scale.z],
        rotation: new Euler().setFromQuaternion(object3D.quaternion).toArray(),
    };
};

export const getProjectedCuboidGeometry = (mesh) => {
    const { width, height, depth } = mesh.geometry.parameters;

    // Точки кубоида
    const cuboidLocalPoints = [
        // Нижняя грань
        new Vector3(-0.5, -0.5, -0.5),
        new Vector3(-0.5, -0.5, 0.5),
        new Vector3(-0.5, 0.5, 0.5),
        new Vector3(-0.5, 0.5, -0.5),
        // Верхняя грань
        new Vector3(0.5, -0.5, -0.5),
        new Vector3(0.5, -0.5, 0.5),
        new Vector3(0.5, 0.5, 0.5),
        new Vector3(0.5, 0.5, -0.5),
    ].map((corner) => {
        return new Vector3(corner.x * width, corner.y * height, corner.z * depth);
    });

    // Точки стрелки
    const ARROW_SIZE = 0.85;
    const Z_OFFSET = -0.5;
    const arrowLocalPoints = [
        [-0.5, 0],
        [-1, 1],
        [1, 0],
        [-1, -1],
        [-0.5, 0],
    ].map(([x, y]) => {
        return new Vector3((x / 2) * ARROW_SIZE, (y / 2) * ARROW_SIZE, Z_OFFSET);
    });

    const allWorldPoints = [...cuboidLocalPoints, ...arrowLocalPoints].map((point) =>
        point.applyMatrix4(mesh.matrixWorld),
    );

    const result = new Float32Array(allWorldPoints.length * 3);
    allWorldPoints.forEach((point, i) => {
        result[i * 3] = point.x;
        result[i * 3 + 1] = point.y;
        result[i * 3 + 2] = point.z;
    });

    return {
        points: result,
        cuboidPointCount: cuboidLocalPoints.length,
        arrowPointCount: arrowLocalPoints.length,
    };
};

export const addCuboid = (scene, cuboid) => {
    const { label, type, color, position, scale, rotation } = cuboid;

    const cube = createCubeGeometry(color, position, scale, rotation);
    const edges = createEdgesGeometry(cube.mesh.geometry, color);
    const arrow = createArrowGeometry(color);

    cube.mesh.layers.set(LAYERS.SECONDARY);
    // edges.mesh.layers.set(LAYERS.SECONDARY);
    arrow.mesh.layers.set(LAYERS.SECONDARY);

    cube.mesh.add(edges.mesh);
    cube.mesh.add(arrow.mesh);

    cube.mesh.name = cuboid.id;
    cube.mesh.userData.color = color;
    cube.mesh.userData.label = label;
    cube.mesh.userData.type = type;

    scene.add(cube.mesh);

    return { cube, edges, arrow };
};

export const updateCuboid = ({ cuboid, refs }) => {
    const { id, type, label, color, attributes } = cuboid;
    const { geometries, solution } = refs;

    for (const geometry of Object.values(geometries.current)) {
        if (geometry?.cube?.mesh?.name === id) {
            geometries.current[id].cube.mesh.material.color = new Color(color);
            geometries.current[id].edges.mesh.material.color = new Color(color);
            geometries.current[id].arrow.mesh.material.color = new Color(color);
            geometries.current[id].cube.mesh.userData.type = type;
            geometries.current[id].cube.mesh.userData.label = label;
            geometries.current[id].cube.mesh.userData.color = color;
        }
    }
    for (const solutionFrame of Object.values(solution.current)) {
        for (const cuboid of Object.values(solutionFrame)) {
            if (cuboid.id === id) {
                cuboid.type = type;
                cuboid.label = label;
                cuboid.attributes = cuboid.attributes.filter((attr) => attributes.includes(attr));
            }
        }
    }
};

export const removeCuboid = (scene, cuboid) => {
    const { cube, edges, arrow } = cuboid;

    scene.remove(cube.mesh);
    cube.cleanup();
    edges.cleanup();
    arrow.cleanup();
};

export const getPointsInsideCuboid = (positions, position, quaternionObj, scale) => {
    const quaternion = new Quaternion(
        quaternionObj.x,
        quaternionObj.y,
        quaternionObj.z,
        quaternionObj.w,
    );

    const matrix = new Matrix4().compose(position, quaternion, scale);
    const inverse = new Matrix4().copy(matrix).invert();
    const e = inverse.elements;

    const result = [];
    const hx = 0.5,
        hy = 0.5,
        hz = 0.5;

    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i],
            y = positions[i + 1],
            z = positions[i + 2];

        const lx = e[0] * x + e[4] * y + e[8] * z + e[12];
        const ly = e[1] * x + e[5] * y + e[9] * z + e[13];
        const lz = e[2] * x + e[6] * y + e[10] * z + e[14];

        if (Math.abs(lx) <= hx && Math.abs(ly) <= hy && Math.abs(lz) <= hz) {
            result.push(i / 3);
        }
    }

    return result;
};

export const getCuboidMeshPositionById = (cuboidsGeometriesRef, id) => {
    for (const geometry of Object.values(cuboidsGeometriesRef.current)) {
        if (geometry?.cube?.mesh?.name === id.toString()) {
            const position = geometry.cube.mesh.position;
            const scale = geometry.cube.mesh.scale;
            return [position.x, position.y, position.z - scale.z / 2];
        }
    }
};
