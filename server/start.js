const mongoose = require('mongoose');
const utils = require('./handlers/utils');

// Make sure we are running node 7.6+
const [major, minor] = process.versions.node.split('.').map(parseFloat);
if (major < 7 || (major === 7 && minor <= 5)) {
  console.log('🛑 🌮 🐶 💪 💩\nHey You! \n\t ya you! \n\t\tBuster! \n\tYou\'re on an older version of node that doesn\'t support the latest and greatest things we are learning (Async + Await)! Please go to nodejs.org and download version 7.6 or greater. 👌\n ');
  process.exit();
}

// import environmental variables from our variables.env file
// require('dotenv').config({ path: 'variables.env' }); //not needed we are using enviroment vars from docker-compose

// Connect to our Database and handle an bad connections
mongoose.connect(process.env.DATABASE, { 
  useUnifiedTopology: true,
  useCreateIndex: true,
  useNewUrlParser: true,
  useFindAndModify: false 
});
mongoose.Promise = global.Promise; // Tell Mongoose to use ES6 promises
mongoose.connection.on('error', (err) => {
  console.error(`Mongodb → ${err.message}`);
});

// READY?! Let's go!
// import all of our models
require('./models/User');
require('./models/PersonalInfo');
require('./models/FinancialInfo');
require('./models/Team');
require('./models/Team_User');
require('./models/Investment');
require('./models/CurrencyInvestment');
require('./models/PropertyInvestment');
require('./models/Property');
require('./models/PropertyAdditionalInfo');
require('./models/House');
require('./models/CurrencyRate');
require('./models/Property_User');
require('./models/UserSetting');

// Start our app!
const app = require('./app');
const cron = require("node-cron");
const cryptoRatesController = require('./controllers/cryptoRatesController');
const userController = require('./controllers/userController');
const { CRYPTO_CURRENCIES, CRONJOB_USER } = require('./constants/constants');

// For cron job patterns look
// https://www.ostechnix.com/a-beginners-guide-to-cron-jobs/
// https://crontab.guru/every-day-8am

// cron job for xmr/btc ratio just in prod to avoid using mailtrap free data
if (utils.isProduction()) {
  // this job runs every hour at minute 1
  cron.schedule("1 * * * *", () => {
    cryptoRatesController.alertCryptoRatio(CRYPTO_CURRENCIES.MONERO, CRYPTO_CURRENCIES.BITCOIN);
  });
}

// this job runs every day at 8:00 am
cron.schedule("0 8 * * *", () => {
  userController.deleteExpiredInactiveAccounts();
});

// this job runs every 15 minutes
cron.schedule("*/15 * * * *", () => {
  const lastLogFile = utils.getMostRecentFile('logs/');
  
  if (lastLogFile && lastLogFile.file) {
    utils.rotateLogs(CRONJOB_USER, `logs/${lastLogFile.file}`);
  }
});

app.set('port', process.env.PORT);

const server = app.listen(app.get('port'), () => {
  console.log(`Express running → PORT ${server.address().port}`);
});
