import { arraysAreEqual } from "@utils/editor";

onmessage = function (e) {
    const { newLabels, prevLabels } = e.data;

    const shouldSave = !arraysAreEqual(newLabels, prevLabels);

    if (!shouldSave) {
        postMessage({ shouldSave: false });
        return;
    }

    const payload = JSON.stringify(Array.from(newLabels));

    postMessage({ shouldSave: true, payload });
};
