const Pusher = require("pusher");
const { exec } = require('child_process');
const { ENVIRONMENTS } = require("../constants/constants");
const { getMessage, resetLoggerInstance } = require('./errorHandlers');
const { ANONYMOUS_USER } = require('../constants/constants');
const fs = require('fs');
const path = require("path");
const moment = require('moment');

const errorTrace = 'utils >';

let pusher = null; 


/**
 * Returns and instance of Pusher object. This is use to send push notifications to the frontend
 * 
 * @return {Pusher}
 */
exports.getPusher = () => {
  if (pusher) {
    return pusher;
  }

  pusher = new Pusher({
    appId: `${process.env.PUSHER_APP_ID}`,
    key: `${process.env.PUSHER_KEY}`,
    secret: `${process.env.PUSHER_SECRET}`,
    cluster: `${process.env.PUSHER_CLUSTER}`
  });

  return pusher;
}; 

/**
 * Remove duplicates in an array of mongo db objectIds
 * 
 * @param {array<ObjectId>} objectIDs. The array to filter
 * 
 * @return {array<ObjectId>}
 */
exports.removeDuplicatesFromObjectIdArray = (objectIDs) => {
  const ids = {}
  objectIDs.forEach(_id => (ids[_id.toString()] = _id))
  return Object.values(ids)
};

/**
 * Delay method, to wait some amount of miliseconds before execute something
 * This promise returned from the function is to use it with async/await to run it sync
 * async () => { await delay(1000); return do_something(); }
 * @param {*} ms 
 * 
 * @return {Promise}
 */
exports.delay = (ms) => new Promise(res => setTimeout(res, ms));

/**
 * environment methods
 * 
 * @return {boolean} 
 */
exports.isProduction = () => getEnvironment() === ENVIRONMENTS.PRODUCTION;
exports.isDevelopment = () => getEnvironment() === ENVIRONMENTS.DEVELOPMENT;
exports.isTesting = () => getEnvironment() === ENVIRONMENTS.TESTING;

/**
 * get the current environment from NODE_ENV env variable
 * 
 * @returns {string}
 */
const getEnvironment = () => process.env.NODE_ENV;
exports.getEnvironment = getEnvironment;

/**
 * Run a command in the machine running this nodejs server. If return a promite 
 * This promise returned from the function is to use it with async/await to run it sync
 * @param {string} command . The command to run  
 * 
 * @return {Promise}
 */
const runCommand = (username, command, addToLogger = true) => new Promise((resolve, reject) => {
  exec(command, (error, stdout, stderr) => {
    
    const methodTrace = `${errorTrace} runCommand() >`;
    
    if (error) {
      console.log(`${methodTrace} ${getMessage('error', 433, username, true, addToLogger, command, error)}`)
      reject(error);
      return;
    }
    
    if (stderr) {
      console.log(`${methodTrace} ${getMessage('error', 432, username, true, addToLogger, command, stderr)}`)
      reject(stderr);
      return;
    }

    console.log(`${methodTrace} ${getMessage('message', 1065, username, true, addToLogger, command, stdout)}`);
    resolve(true);
  })
});
exports.runCommand = runCommand;

// Does a manual log rotation of the app logs
exports.rotateLogs = async(username, file) => {
  const methodTrace = `${errorTrace} rotateLogs(${file}) >`;

  try {
    const statsObj = fs.statSync(file);
    
    if (statsObj.size == 0) {
      // file is empty. Not adding to logger this line to avoid creating the next log rotation because of this thing. 
      console.log(`${methodTrace} ${getMessage('message', 1066, username, true, false, file)}`);
      return false;
    }
  
    // rotate the file
    let newDate = moment(Date.now()).format('YYYY-MM-DD_HH-mm-ss-SSS');
    let oldFilenameArr = file.split('/')[1].split('.');
    let oldFileNameUnique = `${oldFilenameArr[0]}-${newDate}.${oldFilenameArr[1]}`;
    console.log(`${methodTrace} ${getMessage('message', 1067, username, true, true, file, `logs-old/${oldFileNameUnique}`)}`);
    // move oldFilename to a mounted dir to be able to be send to S3 by a cronjob
    let result = await runCommand(username, `mv ${file} logs-old/${oldFileNameUnique}`, false);
    // reset the logger to start again and create a new log file
    if (result === true) {
      resetLoggerInstance();
    }

    return true;
  } catch (err) {
    console.log(`${methodTrace} ${getMessage('error', 434, username, true, true, file, err)}`);
    return false;
  }
};

// retrieves the last file modified in the provided directory
const getMostRecentFile = (dir) => {
  const files = orderReccentFiles(dir);
  return files.length ? files[0] : undefined;
};
exports.getMostRecentFile = getMostRecentFile;

const orderReccentFiles = (dir) => {
  return fs.readdirSync(dir)
    .filter((file) => fs.lstatSync(path.join(dir, file)).isFile())
    .map((file) => ({ file, mtime: fs.lstatSync(path.join(dir, file)).mtime }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
};

/**
 * 
 * @param {string} methodName Checks if a method is configured to not add to logger via env var NOT_LOGGING_METHOD 
 * @returns {boolean} True to add to the logger, false to not.
 */
exports.addToLogger = (methodName) => {
  const methodTrace = `${errorTrace} addToLogger() >`;

  if (!methodName) {
    return true;
  }

  const notLoggingMethods = process.env.NOT_LOGGING_METHODS.split(',');

  if (notLoggingMethods.includes(methodName)) {
    console.log(`${methodTrace} ${getMessage('message', 1070, ANONYMOUS_USER, true, false, methodName)}`);
    return false;
  }

  console.log(`${methodTrace} ${getMessage('message', 1069, ANONYMOUS_USER, true, true, methodName)}`);
  return true;
};