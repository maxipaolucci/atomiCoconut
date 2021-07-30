const passport = require('passport'); //it is a library to login people in the app
const crypto = require('crypto'); //get crytographic strings
const mongoose = require('mongoose');
const User = mongoose.model('User');
const mail = require('../handlers/mail');
const userController = require('./userController');
const { getMessage } = require('../handlers/errorHandlers');
const { ANONYMOUS_USER } = require('../constants/constants');
const authHandler = require('../handlers/authHandler');


const errorTrace = 'authController >';

const getUserObject = async (email, fieldsToPopulate = {}, addToLogger = true) => {
    const methodTrace = `${errorTrace} getUserObject() >`;
    
    console.log(`${methodTrace} ${getMessage('message', 1006, email, true, addToLogger, email)}`);
    let user = null;
    if (Object.keys(fieldsToPopulate).length) {
        user = await User.findOneAndPopulate({ email }, fieldsToPopulate);
    } else {
        user = await User.findOne({ email });
    }

    if (!user) {
        console.log(`${methodTrace} ${getMessage('error', 455, email, true, addToLogger, email)}`);
        return null;
    }

    
    let result = {
        name : user.name, 
        email : user.email, 
        avatar : user.gravatar, 
        currency : user.currency
    };
    
    for (let key of Object.keys(fieldsToPopulate)) {
        if (fieldsToPopulate[key] === 'true') {
            result[key] = user[key] || null;
        }
    }
    
    return result;
};
exports.getUserObject = getUserObject;

exports.login = (req, res, next) => {
    const methodTrace = `${errorTrace} login() > `;

    console.log(`${methodTrace}${getMessage('message', 1001, null, true, true)}`);
    passport.authenticate('local', function(err, user, info) {
        if (err) {
            console.log(`${methodTrace}${getMessage('error', 450, user && user.email ? user.email : null, true, true)}`);
            res.status(401).json({ 
                status : "error", 
                codeno : 450,
                msg : errors.map(err => err.msg),
                data : info
            });
            return; //stop from running 
        }
        if (!user) {
            console.log(`${methodTrace}${getMessage('error', 451, null, true, true)}`);
            res.status(401).json({ 
                status : "error", 
                codeno : 451,
                msg : getMessage('error', 451, null, false, false),
                data : null
            });
            return; //stop from running 
        }

        console.log(`${methodTrace}${getMessage('message', 1002, user.email, true, true)}`);
        req.login(user, async function(err) {
            if (err) {
                console.log(`${methodTrace}${getMessage('error', 452, user.email, true, true)}`);
                res.status(401).json({ 
                    status : "error", 
                    codeno : 452,
                    msg : getMessage('error', 452, null, false, false),
                    data : null
                });
                return; //stop from running 
            }

            if (!user.active) {
                console.log(`${methodTrace}${getMessage('error', 479, user.email, true, true, user.email)}`);
                res.status(401).json({ 
                    status : "error", 
                    codeno : 479,
                    msg : getMessage('error', 479, null, false, false, user.email),
                    data : null
                });
                return; //stop from running 
            }

            //save user token
            const token = authHandler.createToken(user);
            user = await getUserObject(user.email);
            user.token = token;
            
            console.log(`${methodTrace}${getMessage('message', 1000, user.email, true, true)}`);
            res.json({
                status : 'success', 
                codeno : 200,
                msg : getMessage('message', 1000, null, false, false),
                data : user
            });
        });
    })(req, res, next);
}; //authenticate is a middleware on passport. local means we are using our local authentication with email and password. 
    //But we can put ther 'facebook' to use facebook. Check documentation. 
    //This uses the passport handler in handlers folder

exports.logout = async (req, res) => {
    const methodTrace = `${errorTrace} logout() >`;
    
    const user = req.user;
    const userEmail = user ? user.email : ANONYMOUS_USER;
    console.log(`${methodTrace} ${getMessage('message', 1005, userEmail, true, true, userEmail)}`);
    
    req.logout(); //this was added in passport

    res.json({
        status : 'success', 
        codeno : 200,
        msg : getMessage('message', 1005, null, false, false, userEmail),
        data : null
    });
};

exports.isLogggedIn = (req, res, next) => {
    const methodTrace = `${errorTrace} isLogggedIn() >`;
    
    const userEmail = req.user ? req.user.email : ANONYMOUS_USER;
    
    console.log(`${methodTrace}${getMessage('message', 1003, userEmail, true, true)}`);
    if (!req.isAuthenticated()) { //check in passport for authentication
        console.log(`${methodTrace} ${getMessage('error', 453, userEmail, true, true)}`);
        res.status(401).json({ 
            status : "error", 
            codeno : 453,
            msg : getMessage('error', 453, null, false, false),
            data : null
        });
        
        return;
    }

    console.log(`${methodTrace} ${getMessage('message', 1004, userEmail, true, true)}`);
    next();
};

exports.getUser = async (req, res, next) => {
    const methodTrace = `${errorTrace} getUser() >`;

    const email = req.user.email;
    console.log(`${methodTrace} ${getMessage('message', 1004, email, true, true)}`);

    let user = await getUserObject(email, req.query);
    
    if (!user) {
        console.log(`${methodTrace} ${getMessage('error', 455, email, true, true, email)}`);
        res.status(401).json({ 
            status : "error", 
            codeno : 455,
            msg : getMessage('error', 455, null, false, false, email),
            data : null
        });
        return;
    }

    const token = authHandler.createToken(user);
    user.token = token;

    res.json({
        status : 'success',
        codeno : 200,
        msg : getMessage('message', 1004, null, false, false),
        data : user
    });
};

exports.forgot = async (req, res) => {
    const methodTrace = `${errorTrace} forgot() >`;

    const email = req.body.email;
    console.log(`${methodTrace} ${getMessage('message', 1006, ANONYMOUS_USER, true, true, email)}`);
    //1 see user with that email exists
    const user = await User.findOne({ email });
    if (!user) {
        console.log(`${methodTrace} ${getMessage('error', 455, ANONYMOUS_USER, true, true, email)}`);
        res.status(401).json({ 
            status : "error", 
            codeno : 455,
            msg : getMessage('error', 455, null, false, false, email),
            data : null
        });
        return;
    }
    
    //2 set reset tokens and expiry on their account
    console.log(`${methodTrace} ${getMessage('message', 1007, ANONYMOUS_USER, true, true, email)}`);
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000; //1 hour from now
    await user.save();
    //3 send them email with the token
    console.log(`${methodTrace} ${getMessage('message', 1008, ANONYMOUS_USER, true, true, email, 'reset password')}`);
    const resetURL = `${req.headers.origin}/users/account/reset/${user.resetPasswordToken}`;
    mail.send({
        toEmail : user.email,
        subject : 'AtomiCoconut - Password reset',
        resetURL,
        filename : 'password-reset' //this is going to be the mail template file
    });

    console.log(`${methodTrace} ${getMessage('message', 1009, email, true, true, 'password reset')}`);
    res.json({
        status : 'success', 
        codeno : 200,
        msg : getMessage('message', 1009, null, false, false, 'password reset'),
        data : { email : user.email, expires : '1 hour' }
    });
};

exports.confirmedPasswords = (req, res, next) => {
    const methodTrace = `${errorTrace} confirmedPasswords() >`;

    console.log(`${methodTrace} ${getMessage('message', 1052, null, true, true)}`);
    if (req.body.password !== req.body['password-confirm']) {
        console.log(`${methodTrace} ${getMessage('error', 456, null, true, true)}`);
        res.status(401).json({
            status : "error", 
            codeno : 456,
            msg : getMessage('error', 456, null, false, false),
            data : null
        });
        
        return;
    }

    console.log(`${methodTrace} ${getMessage('message', 1053, null, true, true)}`);
    next();
};

/**
 * Reset user password when follows the forgot proccess
 */
exports.reset = async (req, res) => {
    const methodTrace = `${errorTrace} reset() >`;
    
    const userEmail = req.user ? req.user.email : null;
    console.log(`${methodTrace} ${getMessage('message', 1011, userEmail, true, true, req.params.token)}`);
    let user = await User.findOne({
        $and : [
            { resetPasswordToken : req.params.token },
            { resetPasswordExpires : { $gt : Date.now() } }
        ]
    });

    if (!user) {
        console.log(`${methodTrace} ${getMessage('error', 457, userEmail, true, true)}`);
        res.status(401).json({
            status : "error", 
            codeno : 457,
            msg : getMessage('error', 457, null, false, false),
            data : null
        });

        return;
    }

    console.log(`${methodTrace} ${getMessage('message', 1012, user.email, true, true)}`);
    await user.setPassword(req.body.password);
    user.resetPasswordToken = undefined; //the way to remove fields from mongo is set to undefined
    user.resetPasswordExpires = undefined;
    const updatedUser = await user.save(); //here is when we save in the database the deleted values before 
    await req.login(updatedUser); //this comes from passport js
    
    if (!req.user) {
        console.log(`${methodTrace} ${getMessage('error', 452, user.email, true, true)}`);
        res.status(401).json({
            status : "error", 
            codeno : 452,
            msg : getMessage('error', 452, null, false, false),
            data : null
        });

        return;
    }

    //save user token
    user = req.user;
    const token = authHandler.createToken(user);
    user = await getUserObject(user.email);
    user.token = token;
    
    console.log(`${methodTrace} ${getMessage('message', 1013, user.email, true, true, user.email)}`);
    res.json({
        status : 'success', 
        codeno : 200,
        msg : getMessage('message', 1013, null, false, false),
        data : user
    });
};
