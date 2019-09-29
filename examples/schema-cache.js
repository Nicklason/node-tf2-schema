const Schema = require('tf2-schema');
const fs = require('fs');

const SCHEMA_PATH = './path-to-schema-file.json';

const schemaManager = new Schema({ apiKey: 'your steam api key' });

if (fs.existsSync(SCHEMA_PATH)) {
    // a cached schema exists

    // read and parse the cached schema
    const cachedData = JSON.parse(fs.readFileSync(SCHEMA_PATH));

    // set the schema data
    schemaManager.setSchema(cachedData);
}

// initialize tf2-schema like normally
schemaManager.init(function (err) {
    if (err) {
        throw err;
    }
});

// this event is emitted when the schema has been fetched
schemaManager.on('schema', function (schema) {
    // writes the schema data to disk
    fs.writeFileSync(SCHEMA_PATH, JSON.stringify(schemaManager.toJSON()));
});
