const { getMessage } = require('../handlers/errorHandlers');
const { ANONYMOUS_USER, PUSHER_CHANNEL } = require('../constants/constants');
const utils = require('../handlers/utils');

const errorTrace = 'systemController >';


/**
 * Get many api keys for the client app. 
 */
exports.getClientApiKeys = (req, res) => {
    const methodTrace = `${errorTrace} getClientApiKeys() >`;

    const userEmail = req.user ? req.user.email : ANONYMOUS_USER; //it is not required to be logged in to access this controller
    let keys = {
        mapsApiKey: process.env.MAPS_API_KEY,
        pusher: {
            key: process.env.PUSHER_KEY,
            cluster: process.env.PUSHER_CLUSTER,
            channel: PUSHER_CHANNEL
        }
    };

    console.log(`${methodTrace} ${getMessage('message', 1062, userEmail, true, true)}`);
    res.json({
        status : 'success', 
        codeno : 200,
        msg : getMessage('message', 1062, null, false),
        data : keys
    });
};

// triggers a log rotation
exports.triggerLogRotation = async(req, res) => {
    const methodTrace = `${errorTrace} triggerLogRotation() >`;

    const lastLogFile = utils.getMostRecentFile('logs/');
    
    if (!lastLogFile || !lastLogFile.file) {
        return res.status(400).json({ 
            status : "error", 
            codeno : 435,
            msg : getMessage('error', 435, null, false, false, 'logs/'),
            data: null
        }); 
    }

    let result = await utils.rotateLogs(req.user.email, `logs/${lastLogFile.file}`);
    if (!result) {
        return res.status(400).json({ 
            status : "error", 
            codeno : 436,
            msg : getMessage('error', 436, null, false, false),
            data: null
        }); 
    }

    res.json({
        status : 'success', 
        codeno : 200,
        msg : getMessage('message', 1068, null, false, false),
        data : null
    });
};