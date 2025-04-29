const fs = require("fs");

const FIELDS_TO_SAVE = ["x", "y", "z", "intensity"];

function parsePCDHeader(buffer) {
    const text = buffer.toString("utf-8", 0, 1000);
    const lines = text.split("\n");

    const header = [];
    for (const line of lines) {
        header.push(line);
        if (line.startsWith("DATA")) break;
    }

    const headerText = header.join("\n") + "\n";
    const offset = Buffer.byteLength(headerText, "utf-8");

    const meta = {};
    for (const line of header) {
        const [key, ...rest] = line.trim().split(/\s+/);
        meta[key] = rest;
    }

    return { header: headerText, offset, meta };
}

function reducePCDHeader(meta, header, pointCount) {
    const keepFields = FIELDS_TO_SAVE;
    const indices = meta.FIELDS.map((f, i) => (keepFields.includes(f) ? i : -1)).filter(
        (i) => i !== -1,
    );

    const newMeta = {
        FIELDS: [...keepFields, "label"],
        SIZE: indices.map((i) => meta.SIZE[i]).concat("4"),
        TYPE: indices.map((i) => meta.TYPE[i]).concat("U"),
        COUNT: indices.map((i) => meta.COUNT[i]).concat("1"),
        POINTS: [pointCount],
        WIDTH: [pointCount],
    };

    const newHeader = header
        .replace(/^FIELDS .*/m, `FIELDS ${newMeta.FIELDS.join(" ")}`)
        .replace(/^SIZE .*/m, `SIZE ${newMeta.SIZE.join(" ")}`)
        .replace(/^TYPE .*/m, `TYPE ${newMeta.TYPE.join(" ")}`)
        .replace(/^COUNT .*/m, `COUNT ${newMeta.COUNT.join(" ")}`)
        .replace(/^POINTS .*/m, `POINTS ${pointCount}`)
        .replace(/^WIDTH .*/m, `WIDTH ${pointCount}`)
        .replace(/^DATA .*/m, "DATA ascii");

    return { newHeader };
}

function extractAscii(buffer, offset, meta, labels) {
    const asciiText = buffer.toString("utf-8", offset);
    const rows = asciiText.trim().split("\n");
    const pointCount = Number(meta.POINTS[0]);
    const lines = [];

    for (let i = 0; i < pointCount; i++) {
        const row = rows[i].trim().split(/\s+/);
        const fieldMap = Object.fromEntries(meta.FIELDS.map((f, j) => [f, row[j]]));
        const values = FIELDS_TO_SAVE.map((f) => parseFloat(fieldMap[f]).toFixed(6));
        const label = labels[i] ?? 0;
        values.push(label);
        lines.push(values.join(" "));
    }

    return lines.join("\n") + "\n";
}

function extractBinary(buffer, offset, meta, labels) {
    const pointCount = Number(meta.POINTS[0]);
    const allSizes = meta.SIZE.map(Number);
    const allCounts = meta.COUNT.map(Number);
    const totalSize = allSizes.reduce((sum, size, i) => sum + size * allCounts[i], 0);

    let runningOffset = 0;
    const fieldOffsets = meta.FIELDS.map((field, i) => {
        const size = allSizes[i] * allCounts[i];
        const entry = { field, start: runningOffset, size };
        runningOffset += size;
        return entry;
    });

    const keepOffsets = fieldOffsets.filter((f) => FIELDS_TO_SAVE.includes(f.field));

    const lines = [];
    for (let i = 0; i < pointCount; i++) {
        const values = keepOffsets.map((f) => {
            const start = offset + i * totalSize + f.start;
            return buffer.readFloatLE(start).toFixed(6);
        });

        const label = labels[i] ?? 0;
        values.push(label);
        lines.push(values.join(" "));
    }

    return lines.join("\n") + "\n";
}

function extractBinaryCompressed(buffer, offset, meta, labels) {
    // сложна
    throw new Error(`binary_compressed unsupported atm`);
}

function extractFieldsAndAppendLabels(buffer, offset, meta, labels) {
    const dataFormat = meta.DATA[0];
    switch (dataFormat) {
        case "ascii":
            return extractAscii(buffer, offset, meta, labels);
        case "binary":
            return extractBinary(buffer, offset, meta, labels);
        case "binary_compressed":
            return extractBinaryCompressed(buffer, offset, meta, labels);
        default:
            throw new Error(`Unsupported PCD format: ${dataFormat}`);
    }
}

module.exports = {
    parsePCDHeader,
    reducePCDHeader,
    extractFieldsAndAppendLabels,
};
