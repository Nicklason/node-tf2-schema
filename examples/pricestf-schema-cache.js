const Schema = require('tf2-schema');
const request = require('@nicklason/request-retry');
const io = require('socket.io-client');

// Disable the schema updater
const schemaManager = new Schema({ updateTime: -1 });

// Creates socket client
const socket = io('https://api.prices.tf', {
    forceNew: true
});

socket.on('connect', function () {
    socket.emit('authentication');
});

socket.on('disconnect', function (reason) {
    if (reason === 'io server disconnect') {
        socket.connect();
    }
});

// this event is emitted when the schema has been updated
socket.on('schema', function () {
    // fetch the schema
    fetchSchema(function (err, schema) {
        if (!err) {
            // no error, set the schema
            schemaManager.setSchema(schema);
        }
    });
});

// fetch the schema
fetchSchema(function (err, schema) {
    if (err) {
        throw err;
    }

    // set the schema
    schemaManager.setSchema(schema);

    // initialize tf2-schema
    schemaManager.init(function () {
        // init function won't return an error because it won't fetch the schema
    });
});

schemaManager.on('ready', function () {
    console.log('tf2-schema is ready!');
});

// function that fetches the schema from the pricestf api
function fetchSchema (callback) {
    request({
        method: 'GET',
        url: 'https://api.prices.tf/schema',
        qs: {
            appid: 440
        },
        json: true,
        gzip: true
    }, function (err, response, body) {
        if (err) {
            return callback(err);
        }

        delete body.success;
        return callback(null, body);
    });
}
