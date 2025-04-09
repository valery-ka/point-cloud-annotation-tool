export const LempelZivWelch = {
    compress: function (uncompressed) {
        "use strict";
        var i,
            dictionary = {},
            c,
            wc,
            w = "",
            result = [],
            dictSize = 256;
        for (i = 0; i < 256; i += 1) {
            dictionary[String.fromCharCode(i)] = i;
        }

        for (i = 0; i < uncompressed.length; i += 1) {
            c = uncompressed.charAt(i);
            wc = w + c;
            if (dictionary.hasOwnProperty(wc)) {
                w = wc;
            } else {
                result.push(dictionary[w]);
                dictionary[wc] = dictSize++;
                w = String(c);
            }
        }

        if (w !== "") {
            result.push(dictionary[w]);
        }
        return result;
    },

    decompress: function (compressed) {
        "use strict";
        var i,
            dictionary = [],
            w,
            result,
            k,
            entry = "",
            dictSize = 256;
        for (i = 0; i < 256; i += 1) {
            dictionary[i] = String.fromCharCode(i);
        }

        w = String.fromCharCode(compressed[0]);
        result = w;
        for (i = 1; i < compressed.length; i += 1) {
            k = compressed[i];
            if (dictionary[k]) {
                entry = dictionary[k];
            } else {
                if (k === dictSize) {
                    entry = w + w.charAt(0);
                } else {
                    return null;
                }
            }

            result += entry;

            dictionary[dictSize++] = w + entry.charAt(0);

            w = entry;
        }
        return result;
    },
};

export function arraysAreEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
}