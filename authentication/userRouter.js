const router = require('express').Router();
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const fetch = require('fetch');

const PATH = process.env.MONGODBPATH;
const PORT = process.env.PORT;

const User = require('./userModel');

const apipath = 'http://localhost:' + PORT + '/api/authentication';

router.use(bodyparser.json());
router.use(bodyparser.urlencoded({extended: false}));

router.all('*', (req, res, next) => {
    fetch.fetchUrl(apipath + '/me', { headers : { 'x-access-token' : req.headers['x-access-token'] || "" }} ,
        (err, meta, body) => {
        if (err) {
            console.log(err.message);
            return res.status(500).send('Internal server error while identifying you!');
        }
        req.user = JSON.parse(body);
        next();
    });
});

router.get('/', (req, res, next) => {
    if(req.user.accountType)
    {
        let projection = {email:0, password:0, _id:0, createdAt:0, updatedAt:0};
        let query = {accountType : {$ne : "Administrator"}};
        if(req.user.accountType === "Administrator") {
            projection = {password:0};
            query = {};
        }
        if(req.user.accountType === "Moderator") {
            projection = {password:0, _id:0, createdAt:0, updatedAt:0};
            query = {};
        }
        if(req.user.accountType === "Profesor") {
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
        return res.status(403).send('You don\'t have permission for that!');
    }
});

router.get('/:identification', (req, res, next) => {
    if(req.user.accountType)
    {
        let projection = {email:0, password:0, _id:0, createdAt:0, updatedAt:0};
        let query = {accountType : {$ne : "Administrator"}};
        if(req.user.accountType === "Administrator") {
            projection = {password:0};
            query = {};
        }
        if(req.user.accountType === "Moderator") {
            projection = {password:0, _id:0, createdAt:0, updatedAt:0};
            query = {};
        }
        if(req.user.accountType === "Profesor") {
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
        return res.status(403).send('You don\'t have permission for that!');
    }
});

router.get('/byType/:type', (req, res, next) => {
    if(req.user.accountType)
    {
        let projection = {email:0, password:0, _id:0, createdAt:0, updatedAt:0};
        let query = {accountType : {$and : [req.params.type,{$ne: "Moderator"},{$ne : "Administrator"}]}};
        if(req.user.accountType === "Administrator") {
            projection = {password:0};
            query = {accountType: req.params.type};
        }
        if(req.user.accountType === "Moderator") {
            projection = {password:0, _id:0, createdAt:0, updatedAt:0};
            query = {accountType: req.params.type};
        }
        if(req.user.accountType === "Profesor") {
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
        return res.status(403).send('You don\'t have permission for that!');
    }
});

router.post('/', (req, res, next) => {
    if(req.user.accountType === "Administrator" || req.user.accountType === "Moderator"){
        mongoose.connect(PATH, {dbName:'security'}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send('Something went wrong while connecting to the database!');
            }
            if (req.user.accountType === "Moderator" && (req.body.accountType === "Moderator" || req.body.accountType === "Administrator"))
            {
                return res.status(403).send('You can\'t create a moderator or administrator!');
            }
            User.create({
                email : req.body.email,
                username : req.body.username,
                password : req.body.password,
                accountType : (req.body.accountType || "Student"),
                fullname : req.body.fullname
            },
            (err, user) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('There was a problem while adding the data to the database!');
                }
                return res.status(201).send('Successfully created account!');
            });
        });
    }
    else
    {
        return res.status(401).send('You dont have the permission to do this!');
    }
});

router.put('/:identification', (req, res, next) => {
    if(req.user.accountType === "Administrator" || req.user === "Moderator"){
        mongoose.connect(PATH, {dbName:'security'}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send('Something went wrong while connecting to the database!');
            }
            var query = {$or : [{username:req.params.identification},{email:req.params.identification}]};
            User.findOneAndUpdate(query, req.body, {new: true}, (err, user) => {
                if ((user.accountType === "Administrator" || user.accountType === "Moderator") && req.user.accountType === "Moderator") {
                    return res.status(403).send('You can\'t change an administrator or moderator!');
                }
                if (err) {
                    console.log(err.message);
                    return res.status(500).send("There was a problem updating the user.");
                }
                res.status(200).send(user);
            });
        });
    }
    else
    {
        return res.status(401).send('You dont have the permission to do this!');
    }
});

router.delete('/:identification', (req, res, next) => {
    if(req.user.accountType === "Administrator" || req.user.accountType === "Moderator"){
        mongoose.connect(PATH, {dbName:'security'}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send('Something went wrong while connecting to the database!');
            }
            var query = {$or : [{username:req.params.identification},{email:req.params.identification}]};
            User.findOneAndRemove(query, (err, user) => {
                if ((user.accountType === "Administrator" || user.accountType === "Moderator") && req.user.accountType === "Moderator") {
                    return res.status(403).send('You can\'t delete an administrator or moderator!');
                }
                if (err) {
                    console.log(err.message);
                    return res.status(500).send("There was a problem deleting the user!");
                }
                res.status(200).send("User "+ user.name +" was deleted. :c");
            });
        });
    }
    else
    {
        return res.status(401).send('You dont have the permission to do this!');
    }
});

module.exports = router;