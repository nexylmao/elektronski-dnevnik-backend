const router = require('express').Router();
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fetch = require('fetch');

const PATH = process.env.MONGODBPATH;
const PORT = process.env.PORT;
const User = require('../authentication/userModel');

const apipath = 'http://localhost:' + PORT + '/api/authentication';

router.use(bodyparser.json());
router.use(bodyparser.urlencoded({extended: false}));

router.get('/', (req, res, next) => {
    fetch.fetchUrl(apipath + '/me', {
        headers : {
            'x-access-token' : req.headers['x-access-token'] || ""
        }
    } , (err, meta, body) => {
        if (err) {
            console.log(err.message);
            return res.status(500).send('Internal server error while identifying you!');
        }
        body = JSON.parse(body);
        if(body.accountType)
        {
            let projection = {email:0, password:0, _id:0, createdAt:0, updatedAt:0};
            let query = {accountType : {$ne : "Administrator"}};
            if(body.accountType === "Administrator") {
                projection = {password:0};
                query = {};
            }
            if(body.accountType === "Moderator") {
                projection = {password:0, _id:0, createdAt:0, updatedAt:0};
                query = {};
            }
            if(body.accountType === "Profesor") {
                projection = {password:0, _id:0, createdAt:0, updatedAt:0};
                query = {};
            }
            mongoose.connect(PATH, {dbName:'security'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('Something went wrong while connecting to the database!');
                }
                User.find(query,projection, (err, docs) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send('Internal server error while searching for users!');
                    }
                    if (!docs) {
                        return res.status(404).send('No users found!');
                    }
                    return res.status(200).send(docs);
                });
            });
        }
        else {
            return res.status(404).send('You don\'t have permission for that!');
        }
    });
});

router.get('/:idenfitication', (req, res, next) => {
    fetch.fetchUrl(apipath + '/me', {
        headers : {
            'x-access-token' : req.headers['x-access-token'] || ""
        }
    } , (err, meta, body) => {
        if (err) {
            console.log(err.message);
            return res.status(500).send('Internal server error while identifying you!');
        }
        body = JSON.parse(body);
        if(body.accountType)
        {
            let projection = {email:0, password:0, _id:0, createdAt:0, updatedAt:0};
            let query = {$or : [{username:req.params.identification},{email:req.params.identification}],accountType : {$ne : "Administrator"}};
            if(body.accountType === "Administrator") {
                projection = {password:0};
                query = {$or : [{username:req.params.identification},{email:req.params.identification}]};
            }
            if(body.accountType === "Moderator") {
                projection = {password:0, _id:0, createdAt:0, updatedAt:0};
                query = {$or : [{username:req.params.identification},{email:req.params.identification}]};
            }
            if(body.accountType === "Profesor") {
                projection = {password:0, _id:0, createdAt:0, updatedAt:0};
                query = {$or : [{username:req.params.identification},{email:req.params.identification}]};
            }
            mongoose.connect(PATH, {dbName:'security'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('Something went wrong while connecting to the database!');
                }
                User.find(query,projection, (err, docs) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send('Internal server error while searching for users!');
                    }
                    if (!docs) {
                        return res.status(404).send('No users found!');
                    }
                    return res.status(200).send(docs);
                });
            });
        }
        else {
            return res.status(404).send('You don\'t have permission for that!');
        }
    });
});

router.get('/type/:type', (req, res, next) => {
    fetch.fetchUrl(apipath + '/me', {
        headers : {
            'x-access-token' : req.headers['x-access-token'] || ""
        }
    } , (err, meta, body) => {
        if (err) {
            console.log(err.message);
            return res.status(500).send('Internal server error while identifying you!');
        }
        body = JSON.parse(body);
        if(body.accountType)
        {
            let projection = {email:0, password:0, _id:0, createdAt:0, updatedAt:0};
            let query = {accountType : req.params.type};
            if(req.params.type === "Administrator" || req.params.type === "Moderator") {
                query = {_id:0};
            }
            if(body.accountType === "Administrator") {
                projection = {password:0};
                query = {accountType: req.params.type};
            }
            if(body.accountType === "Moderator") {
                projection = {password:0, _id:0, createdAt:0, updatedAt:0};
                query = {accountType: req.params.type};
            }
            if(body.accountType === "Profesor") {
                projection = {password:0, _id:0, createdAt:0, updatedAt:0};
                query = {accountType: req.params.type};
            }
            mongoose.connect(PATH, {dbName:'security'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('Something went wrong while connecting to the database!');
                }
                User.find(query,projection, (err, docs) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send('Internal server error while searching for users!');
                    }
                    if (!docs) {
                        return res.status(404).send('No users found!');
                    }
                    return res.status(200).send(docs);
                });
            });
        }
        else {
            return res.status(404).send('You don\'t have permission for that!');
        }
    });
});

router.put('/:identification', (req, res, next) => {
    fetch.fetchUrl(apipath + '/me', {
        headers : {
            'x-access-token' : req.headers['x-access-token'] || ""
        }
    } , (err, meta, body) => {
        if (err) {
            console.log(err.message);
            return res.status(500).send('Internal server error while identifying you!');
        }
        body = JSON.parse(body);
        if(body.accountType === "Administrator" || body.accountType === "Moderator")
        {
            mongoose.connect(PATH, {dbName:'security'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('Something went wrong while connecting to the database!');
                }
                User.findOneAndUpdate({$or : [{username:req.params.identification},{email:req.params.identification}]},req.body, {new:true}, (err, docs) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send('Internal server error while searching for users!');
                    }
                    if (!docs) {
                        return res.status(404).send('Nothing was found!');
                    }
                    res.status(200).send(docs);
                });
            });
        }
        else {
            return res.status(404).send('You don\'t have permission for that!');
        }
    });
});

module.exports = router;