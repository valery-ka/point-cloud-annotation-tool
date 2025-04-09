import { PCDLoader } from "three/examples/jsm/loaders/PCDLoader";

onmessage = function (event) {
    const { filePath } = event.data;
    const loader = new PCDLoader();

    loader.load(filePath, (points) => {
        const { geometry } = points;

        postMessage(
            {
                filePath,
                geometryWorker: geometry,
            },
            []
        );
    });
};
