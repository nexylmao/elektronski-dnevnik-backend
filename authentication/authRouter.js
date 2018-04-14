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
        return res.status(403).send('Registrations are not allowed at this time!');
    }
    mongoose.connect(PATH, {dbName:'security'}, err => {
        if (err) {
            console.log(err.message);
            return res.status(500).send('Something went wrong while connecting to the database!');
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
                return res.status(500).send('There was a problem while registering the user!');
            }
            jwt.sign({id: user.toJSON()._id}, config.secret, (err, token) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('There was a problem while registering the user!');
                }
                res.status(200).send({auth: true, token});
            });
        });
    });
});

router.get('/me', (req, res, next) => {
    var token = req.headers['x-access-token'];
    if (!token) {
        return res.status(401).send({auth: false, message: 'No token provided!'});
    }
    jwt.verify(token, config.secret, (err, decoded) => {
        if (err) {
            console.log(err.message);
            return res.status(500).send({auth: false, message: 'Failed to authenticate token!'});
        }
        mongoose.connect(PATH, {dbName:'security'}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send('Something went wrong while connecting to the database!');
            }
            User.findById(decoded.id, {password: 0}, (err, user) => {
            if (err) {
                console.log(err.message);
                return res.status(500).send("There was a problem finding the user.");
            }
            if (!user) {
                return res.status(404).send("No user found.");
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
            return res.status(500).send('Something went wrong while connecting to the database!');
        }
        User.findOne(query, (err, user) => {
            if (err) {
                console.log(err.message);
                return res.status(500).send('Error on the server!');
            }
            if (!user) {
                return res.status(404).send('No user found!');
            }
            if (user.validPassword(req.body.password)) {
                var token = jwt.sign({id: user.toJSON()._id}, config.secret, {
                    expiresIn: 86400
                }, (err, token) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send('Something went wrong while logging in the user!');
                    }
                    res.status(200).send({auth: true, token});
                });
            }
            else {
                res.status(401).send({auth: false, token});
            }
        });
    });
});

router.get('/logout', (req, res) => {
    res.status(200).send({auth: false, token: null});
});

module.exports = router;