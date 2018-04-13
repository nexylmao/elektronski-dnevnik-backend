const router = require('express').Router();
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const User = require('./userModel');
const fetch = require('fetch');

const PATH = process.env.MONGODBPATH;
const PORT = process.env.PORT;

const apipath = 'http://localhost:' + PORT + '/api/authentication';

router.use(bodyparser.json());
router.use(bodyparser.urlencoded({extended: false}));

router.post('/', (req, res, next) => {
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
        if(body.accountType === "Administrator" || body.accountType === "Moderator"){
            mongoose.connect(PATH, {dbName:'security'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('Something went wrong while connecting to the database!');
                }
                if (body.accountType === "Moderator" && (req.body.accountType === "Moderator" || req.body.accountType === "Administrator"))
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
                    res.status(201).send('Successfully created account!');
                });
            });
        }
        else
        {
            return res.status(401).send('You dont have the permission to do this!');
        }
    });
});

router.get('/:identification', (req, res, next) => {
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
        if(body.accountType === "Administrator" || body.accountType === "Moderator"){
            mongoose.connect(PATH, {dbName:'security'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('Something went wrong while connecting to the database!');
                }
                var query = {$or : [{username:req.params.identification},{email:req.params.identification}]};
                User.findOne(query, {password:0}, (err, user) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send('There was a problem with searching for the user!');
                    }
                    if (!user) {
                        return res.status(404).send('No user was found!');
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
});

router.delete('/:identification', (req, res, next) => {
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
        if(body.accountType === "Administrator" || body.accountType === "Moderator"){
            mongoose.connect(PATH, {dbName:'security'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('Something went wrong while connecting to the database!');
                }
                var query = {$or : [{username:req.params.identification},{email:req.params.identification}]};
                User.findOneAndRemove(query, (err, user) => {
                    if (user.accountType === "Administrator" || user.accountType === "Moderator" && body.accountType === "Moderator") {
                        return res.status(403).send('You can\'t delete an administrator or moderator!');
                    }
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send("There was a problem deleting the user!");
                    }
                    res.status(200).send("User: "+ user.name +" was deleted.");
                });
            });
        }
        else
        {
            return res.status(401).send('You dont have the permission to do this!');
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
        if(body.accountType === "Administrator"){
            mongoose.connect(PATH, {dbName:'security'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('Something went wrong while connecting to the database!');
                }
                var query = {$or : [{username:req.params.identification},{email:req.params.identification}]};
                User.findOneAndUpdate(query, req.body, {new: true}, (err, user) => {
                    if (user.accountType === "Administrator" || user.accountType === "Moderator" && body.accountType === "Moderator") {
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
});

module.exports = router;