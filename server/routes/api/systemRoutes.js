const express = require('express');
const router = express.Router();
const { catchErrors } = require('../../handlers/errorHandlers');
const systemController = require('../../controllers/systemController');
const authController = require('../../controllers/authController');
const authHandler = require('../../handlers/authHandler');

//*************************************************************************** */
//****************************** SYSTEM API ********************************* */
//*************************************************************************** */

router.route('/getClientApiKeys').get(
  // it is not required to be logged in to access this route
  systemController.getClientApiKeys
);

router.route('/triggerLogRotation').get(
  authController.isLogggedIn, 
  authHandler.jwtCheck,
  authHandler.checkDecodedJwtMatchUser,
  systemController.triggerLogRotation
);

module.exports = router;