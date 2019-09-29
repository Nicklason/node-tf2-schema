const Schema = require('tf2-schema');

// Create new instance of tf2-schema
const schemaManager = new Schema({ apiKey: 'your steam api key' });

// Initialize tf2-schema
schemaManager.init(function (err) {
    if (err) {
        // Error occurred fetching the schema
        throw err;
    }

    // tf2-schema is now ready to be used
});

// this event is emitted when the init function has been called and finished without errors
schemaManager.on('ready', function () {
    console.log('tf2-schema is ready!');
});
