const async = require('async');

const Schema = require('./lib/schema.js');

class TF2 {
    constructor (options) {
        this.apiKey = options.apiKey;
        this.updateTime = options.updateTime || 24 * 60 * 60 * 1000;

        this.schema = null;
    }

    setSchema (raw) {
        const schema = this.schema || new Schema();
        schema.raw = raw;

        this.schema = schema;

        this._startUpdater();
    }

    getSchema (callback) {
        async.parallel({
            overview: (callback) => {
                Schema.getOverview(this.apiKey, callback);
            },
            items: (callback) => {
                Schema.getItems(this.apiKey, callback);
            },
            paintkits: function (callback) {
                Schema.getPaintKits(callback);
            }
        }, (err, result) => {
            if (err) {
                return callback(err);
            }

            const raw = Object.assign(result.overview, { items: result.items, paintkits: result.paintkits });

            this.setSchema(raw);

            callback(null, this.schema);
        });
    }

    _startUpdater () {
        // TODO: Start by setting a timeout so that the schema updates when it is updateTime old, then after that set an interval

        clearInterval(this._updateInterval);
        this._updateInterval = setInterval(TF2.prototype.getSchema.bind(this), this.updateTime);
    }
}

module.exports = TF2;

module.exports.Schema = Schema;
