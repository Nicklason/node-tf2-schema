const async = require('async');

const Schema = require('./lib/schema.js');

class TF2 {
    constructor (options) {
        this.apiKey = options.apiKey;
        this.updateTime = options.updateTime || 24 * 60 * 60 * 1000;

        this.schema = null;
    }

    setSchema (raw, time) {
        if (this.schema !== null) {
            this.schema.raw = raw;
            this.schema.time = time || new Date().getTime();
        } else {
            this.schema = new Schema(raw, time);
        }

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
        if (this.updateTime === -1) {
            return;
        }

        clearTimeout(this._updateTimeout);
        clearInterval(this._updateInterval);

        let wait = this.schema.time - new Date().getTime() + this.updateTime;
        if (wait < 0) {
            wait = 0;
        }

        this._updateTimeout = setTimeout(() => {
            // Update the schema
            this.getSchema(function () {});

            // Set update interval
            this._updateInterval = setInterval(TF2.prototype.getSchema.bind(this), this.updateTime);
        }, wait);
    }
}

module.exports = TF2;

module.exports.Schema = Schema;
