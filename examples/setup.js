const Schema = require('tf2-schema');

// Create new instance of tf2-schema
const schema = new Schema({ apiKey: 'your steam api key' });

// Initialize tf2-schema
schema.init(function (err) {
    if (err) {
        // Error occurred fetching the schema
        throw err;
    }

    // tf2-schema is now ready to be used
});

schema.on('ready', function () {
    // this event is emitted when the init function has been called and finished without errors
});
