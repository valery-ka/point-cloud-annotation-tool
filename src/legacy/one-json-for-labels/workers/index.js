export const PCDLoaderWorker = () => new Worker(new URL("./PCDLoader.worker.js", import.meta.url));
export const SaveOutputWorker = () =>
    new Worker(new URL("./SaveOutput.worker.js", import.meta.url));
export const LoadInputWorker = () => new Worker(new URL("./LoadInput.worker.js", import.meta.url));
