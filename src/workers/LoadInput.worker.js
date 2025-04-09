onmessage = function (e) {
    const { labels } = e.data;

    console.log(e)

    // если данные сжаты (бинарные), то тут сначала распаковываем
    if (labels) {
        postMessage(labels);
    } else {
        postMessage(null);
    }
};
