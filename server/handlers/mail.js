const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice'); //inline css for email clients
const htmlToText = require('html-to-text'); //convert html to text format
const sgMail = require('@sendgrid/mail'); //to send emails using SendGrid
const { getMessage } = require('./errorHandlers');
const { ANONYMOUS_USER } = require('../constants/constants');
const fs = require('fs');
const utils = require('./utils');

// encodes an image in a base64 encoded string
const base64ImageEncoder = (fileName) => {
  var bitmap = fs.readFileSync(fileName);
  return new Buffer(bitmap).toString("base64");
}
const base64LogoStr = base64ImageEncoder(__dirname +'/images/coconut.png');

const errorTrace = 'handlers/mail >';

//mailtrap io
const transportMailTrap = nodemailer.createTransport({
  host : process.env.MAIL_TRAP_HOST,
  port : process.env.MAIL_TRAP_PORT,
  auth : {
    user : process.env.MAIL_TRAP_USER,
    pass : process.env.MAIL_TRAP_PASS
  }
});

const generateHTML = (filename, options = {}) => {
  const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options); //we donot know where renderfile is executed, propably inside node_modules that's is why we use __dirname = current directory this file is running
  const inlined = juice(html); //inline the html
  return inlined;
};

//sends emails with nodemailer+mailtrap (or gmail if we change the transport used)
const sendMtMail = async (options) => {
  const html = generateHTML(options.filename, options);
  const text = htmlToText.fromString(html); 
  const mailOptions = {
    from: options.fromEmail ? options.fromEmail : 'support@atomiCoconut.com',
    to : options.toEmail,
    subject : options.subject,
    html,
    text,
    attachments: [{
      filename: 'coconut.png',
      path: __dirname +'/images/coconut.png',
      cid: 'logo'
    }]
  }

  return transportMailTrap.sendMail(mailOptions);
};

//Sends emails using SendGrid platform
const sendSgMail = async (options) => {
  const html = generateHTML(options.filename, options);
  const text = htmlToText.fromString(html); 
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const mailOptions = {
    to: options.toEmail,
    from: options.fromEmail ? options.fromEmail : 'support@atomiCoconut.com',
    subject: options.subject,
    text,
    html,
    attachments: [{
      filename: "coconut.png",
      type : "image/png",
      content: base64LogoStr,
      content_id: "logo",
      disposition : "inline"
    }]
  };
  
  return sgMail.send(mailOptions);
};

exports.send = async(options) => {
  const methodTrace = `${errorTrace} send() >`;

  const fromEmail = options.fromEmail ? options.fromEmail : ANONYMOUS_USER;

  if (utils.isProduction()) {
    console.log(`${methodTrace} ${getMessage('message', 1041, fromEmail, true, true, 'SendGrid')}`);
    return sendSgMail(options);
  } else {
    console.log(`${methodTrace} ${getMessage('message', 1041, fromEmail, true, true, 'Mailtrap')}`);
    return sendMtMail(options);
  }
}