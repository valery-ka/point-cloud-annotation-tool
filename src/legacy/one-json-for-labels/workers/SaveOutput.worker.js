onmessage = function (e) {
    const { labelsData } = e.data;

    const shouldSave = true;

    if (!shouldSave) {
        postMessage({ shouldSave: false });
        return;
    }

    // при необходимости перед отправкой можно сжимать данные (бинарные)
    // тогда в saveOutput content-type будет application/octet-stream
    const formattedLabels = labelsData.map(({ fileName, labels }) => ({
        fileName,
        labels: Array.from(labels),
    }));

    const payload = JSON.stringify(formattedLabels);

    postMessage({ shouldSave: true, payload });
};
