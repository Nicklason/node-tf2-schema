const async = require('async');

const Schema = require('./lib/schema.js');

class TF2 {
    constructor (options) {
        this.apiKey = options.apiKey;
        this.schema = null;
    }

    getSchema (callback) {
        async.parallel({
            overview: (callback) => {
                Schema.getOverview(this.apiKey, callback);
            },
            items: (callback) => {
                Schema.getItems(this.apiKey, callback);
            }
        }, (err, result) => {
            if (err) {
                return callback(err);
            }

            const raw = Object.assign(result.overview, { items: result.items });
            const schema = new Schema(raw);

            this.schema = schema;

            callback(null, schema);
        });
    }
}

module.exports = TF2;
