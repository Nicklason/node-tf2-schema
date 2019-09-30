const async = require('async');
const semver = require('semver');

const inherits = require('util').inherits;
const EventEmitter = require('events').EventEmitter;

const version = require('./package.json').version;

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

        if (this.schema !== null && this._updateWait() !== 0) {
            this._startUpdater();

            this.ready = true;
            this.emit('ready');
            callback(null);
            return;
        }

        this.getSchema((err) => {
            if (err) {
                return callback(err);
            }

            this._startUpdater();

            this.ready = true;
            this.emit('ready');
            return callback(null);
        });
    }

    /**
     * Sets the schema using known data. If the schema data does not contain a version, or the version does not satify our version, then the schema will be ignored
     * @param {Object} data Schema data
     * @param {Boolean} fromUpdate If the schema is new or not
     */
    setSchema (data, fromUpdate) {
        // Ignore the schema if it does not contain a version, or if the schema has a higher version (minor or higher)
        if ((!data.version && !fromUpdate) || semver.major(data.version) !== semver.major(version) || semver.minor(data.version) !== semver.minor(version)) {
            return;
        }

        if (this.schema !== null) {
            this.schema.raw = data.raw;
            this.schema.time = data.time || new Date().getTime();
        } else {
            this.schema = new Schema(data);
        }

        if (fromUpdate) {
            this.emit('schema', this.schema);
        }
    }

    /**
     * Gets the schema from the TF2 API
     * @param {Function} callback
     */
    getSchema (callback) {
        if (this.apiKey === undefined) {
            throw new Error('Missing API key');
        }

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

            this.setSchema({ version: version, raw: raw }, true);

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

        this._updateTimeout = setTimeout(() => {
            // Update the schema
            this.getSchema((err) => {
                this.emit('failed', err);
            });

            // Set update interval
            this._updateInterval = setInterval(TF2.prototype.getSchema.bind(this, function () {}), this.updateTime);
        }, this._updateWait());
    }

    _updateWait () {
        if (this.updateTime === -1) {
            return -1;
        }

        let wait = this.schema.time - new Date().getTime() + this.updateTime;
        if (wait < 0) {
            wait = 0;
        }

        return wait;
    }
}

inherits(TF2, EventEmitter);

module.exports = TF2;

module.exports.Schema = Schema;
