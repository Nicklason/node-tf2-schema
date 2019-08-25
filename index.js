const async = require('async');

const inherits = require('util').inherits;
const EventEmitter = require('events').EventEmitter;

const Schema = require('./lib/schema.js');

class TF2 {
    /**
     * @param {Object} options
     * @param {String} options.apiKey Steam API key
     * @param {Number} options.updateTime
     */
    constructor (options) {
        EventEmitter.call(this);

        this.apiKey = options.apiKey;
        this.updateTime = options.updateTime || 24 * 60 * 60 * 1000;

        this.ready = false;
        this.schema = null;
    }

    /**
     * Initializes the class
     * @param {Function} callback
     */
    init (callback) {
        if (this.ready) {
            callback(null);
            return;
        }

        if (this.schema !== null) {
            this.ready = true;
            this.emit('ready');
            return;
        }

        this.getSchema((err) => {
            if (err) {
                return callback(err);
            }

            this.ready = true;
            this.emit('ready');
            return callback(null);
        });
    }

    /**
     * Sets the schema using known data
     * @param {Object} data Schema data
     * @param {Boolean} fromUpdate If the schema is new or not
     */
    setSchema (data, fromUpdate) {
        if (this.schema !== null) {
            this.schema.raw = data.raw;
            this.schema.time = data.time || new Date().getTime();
        } else {
            this.schema = new Schema(data);
        }

        if (fromUpdate) {
            this.emit('schema', this.schema);
        }

        this._startUpdater();
    }

    /**
     * Gets the schema from the TF2 API
     * @param {Function} callback
     */
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

            this.setSchema({ raw: raw }, true);

            callback(null, this.schema);
        });
    }

    /**
     * Starts schema updater
     */
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
            this.getSchema((err) => {
                this.emit('failed', err);
            });

            // Set update interval
            this._updateInterval = setInterval(TF2.prototype.getSchema.bind(this), this.updateTime);
        }, wait);
    }
}

inherits(TF2, EventEmitter);

module.exports = TF2;

module.exports.Schema = Schema;
