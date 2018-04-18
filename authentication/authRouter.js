const router = require('express').Router();
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const User = require('./userModel');

const PATH = process.env.MONGODBPATH;

router.use(bodyparser.json());
router.use(bodyparser.urlencoded({extended: false}));

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/secret');

router.post('/register', (req, res, next) => {
    if(process.env.ALLOWREGISTER != 'ENABLED')
    {
        console.log('Someone tried to register!');
        return res.status(403).send({
            auth : false,
            message : 'Registrations are not allowed at this time!'
        });
    }
    mongoose.connect(PATH, {dbName:'security'}, err => {
        if (err) {
            console.log(err.message);
            return res.status(500).send({
                auth : false,
                message : 'Error while connecting to the database!',
                errMessage : err.message
            });
        }
        var foo = new User({
            username : req.body.username,
            email: req.body.email,
            password: req.body.password,
            accountType: (req.body.accountType || "Student"),
            fullname: req.body.fullname
        });
        User.create(foo, (err, user) => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    auth : false,
                    message : 'Error while inserting in the database!',
                    errMessage : err.message
                });
            }
            jwt.sign({id: user.toJSON()._id}, config.secret, (err, token) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        auth : false,
                        message : 'Error while authenticating the user!',
                        errMessage : err.message
                    });
                }
                res.status(200).send({auth: true, token});
            });
        });
    });
});

router.get('/me', (req, res, next) => {
    var token = req.headers['x-access-token'];
    if (!token) {
        return res.status(401).send({
            auth: false,
            message: 'No token provided!'
        });
    }
    jwt.verify(token, config.secret, (err, decoded) => {
        if (err) {
            console.log(err.message);
            return res.status(500).send({
                auth: false,
                message: 'Failed to authenticate token!'
            });
        }
        mongoose.connect(PATH, {dbName:'security'}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    auth : false,
                    message : 'Error while connecting to the database!',
                    errMessage : err.message
                });
            }
            User.findById(decoded.id, {password: 0}, (err, user) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        auth : false,
                        message : 'Error while querying the database!',
                        errMessage : err.message
                    });
                }
                if (!user) {
                    return res.status(404).send({
                        auth : false,
                        message : 'Query found no users!'
                    });
                }
                res.status(200).send(user);
            });
        });
    });
});

router.post('/login', (req, res, next) => {
    var query = {$or : [{username:req.body.identification},{email:req.body.identification}]};
    mongoose.connect(PATH,{dbName:'security'}, err => {
        if (err) {
            console.log(err.message);
            return res.status(500).send({
                auth : false,
                message : 'Error while connecting to the database!',
                errMessage : err.message
            });
        }
        User.findOne(query, (err, user) => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    auth : false,
                    message : 'Error while querying the database!',
                    errMessage : err.message
                });
            }
            if (!user) {
                return res.status(404).send({
                    auth : false,
                    message : 'Query found no users!'
                });
            }
            if (user.validPassword(req.body.password)) {
                var token = jwt.sign({id: user.toJSON()._id}, config.secret, {
                    expiresIn: 86400
                }, (err, token) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send({
                            auth : false,
                            message : 'Error while authenticating the user!',
                            errMessage : err.message
                        });
                    }
                    res.status(200).send({
                        auth: true,
                        token
                    });
                });
            }
            else {
                res.status(401).send({
                    auth: false,
                    message: 'The password you enter is not correct!'
                });
            }
        });
    });
});

router.get('/logout', (req, res) => {
    res.status(200).send({
        auth: true,
        token: null
    });
});

module.exports = router;