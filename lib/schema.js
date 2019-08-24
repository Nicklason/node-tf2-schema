const request = require('@nicklason/request-retry');
const vdf = require('vdf');

const webAPI = require('./webapi.js');

const language = 'English';

class Schema {
    constructor (data) {
        this.raw = data.raw || null;
        this.time = data.time || new Date().getTime();
    }

    static getOverview (apiKey, callback) {
        webAPI('GET', 'GetSchemaOverview', 'v0001', {
            key: apiKey,
            language: language
        }, function (err, result) {
            if (err) {
                return callback(err);
            }

            return callback(null, result);
        });
    }

    static getItems (apiKey, callback) {
        getAllSchemaItems(apiKey, callback);
    }

    static getPaintKits (callback) {
        request({
            method: 'GET',
            url: 'https://raw.githubusercontent.com/SteamDatabase/GameTracking-TF2/master/tf/resource/tf_proto_obj_defs_english.txt',
            gzip: true
        }, function (err, response, body) {
            if (err) {
                return callback(err);
            }

            const parsed = vdf.parse(body);

            const protodefs = parsed['lang'].Tokens;

            const skins = [];

            for (const protodef in protodefs) {
                if (!Object.prototype.hasOwnProperty.call(protodefs, protodef)) {
                    continue;
                }

                const parts = protodef.slice(0, protodef.indexOf(' ')).split('_');
                if (parts.length !== 3) {
                    continue;
                }

                const type = parts[0];
                if (type !== '9') {
                    continue;
                }

                const def = parts[1];
                const name = protodefs[protodef];

                if (name.startsWith(def + ':')) {
                    continue;
                }

                skins.push({
                    id: def,
                    name: name
                });
            }

            return callback(null, skins);
        });
    }

    toJSON () {
        return {
            time: this.time,
            raw: this.raw
        };
    }
}

function getAllSchemaItems (apiKey, next, items, callback) {
    if (callback === undefined) {
        callback = next;
        next = 0;
    }

    const input = {
        language: language,
        key: apiKey,
        start: next
    };

    webAPI('GET', 'GetSchemaItems', 'v0001', input, function (err, result) {
        if (err) {
            return callback(err);
        }

        items = (items || []).concat(result.items);

        if (result.next !== undefined) {
            getAllSchemaItems(apiKey, result.next, items, callback);
        } else {
            callback(null, items);
        }
    });
}

module.exports = Schema;
