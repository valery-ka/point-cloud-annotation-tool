onmessage = function (e) {
    const { json } = e.data;

    if (json) {
        try {
            const payload = JSON.parse(json);
            postMessage(payload);
        } catch (error) {
            console.error("Error parsing JSON:", error);
            postMessage(null);
        }
    } else {
        postMessage(null);
    }
};
