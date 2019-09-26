const Schema = require('tf2-schema');

const schemaManager = new Schema({ apiKey: 'your steam api key' });

schemaManager.init(function (err) {
    if (err) {
        throw err;
    }
});

schemaManager.on('ready', function () {
    // item object to get the name off, only the defindex and quality is required
    const item = {
        defindex: 5021,
        quality: 6
    };

    // get the name of the item
    const name = schemaManager.schema.getName(item);

    console.log(name); // -> Mann Co. Supply Crate Key
});
