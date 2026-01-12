const importLogController = require('./importLogController');
const jobController = require('./jobController');

module.exports = {
    ...importLogController,
    ...jobController,
};
