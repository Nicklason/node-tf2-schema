const request = require('@nicklason/request-retry');
const vdf = require('vdf');

const webAPI = require('./webapi.js');

const language = 'English';

class Schema {
    constructor (data) {
        this.raw = data.raw || null;
        this.time = data.time || new Date().getTime();
    }

    getItemByDefindex (defindex) {
        for (let i = 0; i < this.raw.items.length; i++) {
            const item = this.raw.items[i];
            if (item.defindex === defindex) {
                return item;
            }
        }

        return null;
    }

    getQualityById (id) {
        for (const type in this.raw.qualities) {
            if (!Object.prototype.hasOwnProperty.call(this.raw.qualities, type)) {
                continue;
            }

            if (this.raw.qualities[type] === id) {
                return this.raw.qualityNames[type];
            }
        }

        return null;
    }

    getQualityIdByName (name) {
        for (const type in this.raw.qualityNames) {
            if (!Object.prototype.hasOwnProperty.call(this.raw.qualityNames, name)) {
                continue;
            }

            if (this.raw.qualityNames[type] === name) {
                return this.raw.qualities[name];
            }
        }

        return null;
    }

    getEffectById (id) {
        for (let i = 0; i < this.raw.attribute_controlled_attached_particles.length; i++) {
            const effect = this.raw.attribute_controlled_attached_particles[i];

            if (effect.id === id) {
                return effect.name;
            }
        }

        return null;
    }

    getEffectIdByName (name) {
        for (let i = 0; i < this.raw.attribute_controlled_attached_particles.length; i++) {
            const effect = this.raw.attribute_controlled_attached_particles[i];

            if (effect.name === name) {
                return effect.id;
            }
        }

        return null;
    }

    getSkinById (id) {
        for (const name in this.raw.paintkits) {
            if (!Object.prototype.hasOwnProperty.call(this.raw.paintkits, name)) {
                continue;
            }

            if (this.raw.paintkits[name] === id) {
                return name;
            }
        }

        return null;
    }

    getSkinIdByName (name) {
        if (!Object.prototype.hasOwnProperty.call(this.raw.paintkits, name)) {
            return null;
        }

        return this.raw.paintkits[name];
    }

    getName (item, proper = true) {
        const schemaItem = this.getItemByDefindex(item.defindex);
        if (schemaItem === null) {
            return null;
        }

        let name = '';

        if (item.tradable === false) {
            name = 'Non-Tradable ';
        }

        if (item.craftable === false) {
            name += 'Non-Craftable ';
        }

        if (item.quality2) {
            // Elevated quality
            name += this.getQualityById(item.quality2) + ' ';
        }

        if ((item.quality !== 6 && item.quality !== 15 && item.quality !== 5) || (item.quality === 5 && item.effect === null) || schemaItem.item_quality == 5) {
            // If the quality is not Unique, Decorated, or Unusual, or if the quality is Unusual but it does not have an effect, or if the item can only be unusual, then add the quality
            name += this.getQualityById(item.quality) + ' ';
        }

        if (item.festive === true) {
            name += 'Festivized ';
        }

        if (item.effect) {
            name += this.getEffectById(item.effect) + ' ';
        }

        if (item.killstreak && item.killstreak > 0) {
            name += ['Killstreak', 'Specialized Killstreak', 'Professional Killstreak'][item.killstreak - 1] + ' ';
        }

        if (item.target) {
            name += this.getItemByDefindex(item.target).item_name + ' ';
        }

        if (item.outputQuality && item.outputQuality !== 6) {
            name = this.getQualityById(item.outputQuality) + ' ' + name;
        }

        if (item.output) {
            name += this.getItemByDefindex(item.output).item_name + ' ';
        }

        if (item.australium === true) {
            name += 'Australium ';
        }

        if (item.paintkit) {
            name += this.getSkinById(item.paintkit) + ' ';
        } else if (schemaItem.item_quality == 15 && Object.prototype.hasOwnProperty.call(schemaItem, 'item_slot') && ['primary', 'secondary', 'melee'].indexOf(schemaItem.item_slot) !== -1) {
            const search = schemaItem.name.split('_')[2];

            for (let i = 0; i < this.raw.paintkits.length; i++) {
                const skin = this.raw.paintkits[i];
                if (skin.name.replace(/ /g, '').toLowerCase() === search) {
                    name += skin.name + ' ';
                    break;
                }
            }
        }

        if (proper === true && name === '' && schemaItem.proper_name == true) {
            name = 'The ';
        }

        name += schemaItem.item_name;

        if (item.wear) {
            name += ' (' + ['Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle Scarred'][item.wear - 1] + ')';
        }

        if (item.crateseries) {
            name += ' #' + item.crateseries;
        }

        return name;
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

            const paintkits = [];

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

                paintkits.push({
                    id: def,
                    name: name
                });
            }

            paintkits.sort(function (a, b) {
                return a.id - b.id;
            });

            const paintkitObj = {};

            for (let i = 0; i < paintkits.length; i++) {
                const paintkit = paintkits[i];
                paintkitObj[paintkit.name] = parseInt(paintkit.id);
            }

            return callback(null, paintkitObj);
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
