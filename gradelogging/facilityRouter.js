const router = require('express').Router();
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fetch = require('fetch');

const Facility = require('./facilityModel');

const PATH = process.env.MONGODBPATH;
const PORT = process.env.PORT;

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
        if(body.accountType){
            mongoose.connect(PATH, {dbName: 'meta'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('Internal server error while connecting to the database!');
                }
                Facility.find({}, (err, docs) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send('Internal server error while searching for all the facilities!');
                    }
                    return res.status(200).send(docs);
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
        if(body.accountType){
            mongoose.connect(PATH, {dbName: 'meta'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('Internal server error while connecting to the database!');
                }
                var query = {$or : [{name:req.params.identification},{principal:req.params.identification},{location:req.params.identification}]};
                Facility.find(query, (err, docs) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send('Internal server error while searching for all the facilities!');
                    }
                    return res.status(200).send(docs);
                });
            });
        }
        else
        {
            return res.status(401).send('You dont have the permission to do this!');
        }
    });
});

router.get('/:identification/moderators', (req, res, next) => {
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
        if(body.accountType){
            mongoose.connect(PATH, {dbName: 'meta'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('Internal server error while connecting to the database!');
                }
                var query = {$or : [{name:req.params.identification},{principal:req.params.identification},{location:req.params.identification}]};
                Facility.find(query, {_id:0, moderators:1}, (err, docs) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send('Internal server error while searching for all the facilities!');
                    }
                    return res.status(200).send(docs);
                });
            });
        }
        else
        {
            return res.status(401).send('You dont have the permission to do this!');
        }
    });
});

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
            mongoose.connect(PATH, {dbName: 'meta'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('Internal server error while connecting to the database!');
                }
                var newfac = {
                    name: req.body.name,
                    principal: req.body.principal,
                    location: (req.body.location || "")
                }
                if (body.accountType === "Moderator"){
                    newfac.moderators = [body.username];
                }
                Facility.create(newfac, (err, docs) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send('Internal server error while creating the facility!');
                    }
                    res.status(200).send(docs);
                });
            });
        }
        else
        {
            return res.status(401).send('You dont have the permission to do this!');
        }
    });
});

router.post('/:identification/moderators', (req, res, next) => {
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
            mongoose.connect(PATH, {dbName: 'meta'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('Internal server error while connecting to the database!');
                }
                var query = {$or : [{name:req.params.identification},{principal:req.params.identification},{location:req.params.identification}]};
                Facility.findOne(query, (err, doc) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send('Internal server error!');
                    }
                    if (body.accountType === "Administrator" || (body.accountType === "Moderator" && doc.moderators.includes(body.username)))
                    {
                        Facility.findOneAndUpdate(query, {$push : {moderators: req.body.moderatorName}}, {new: true}, (err, docs) => {
                            if (err) {
                                console.log(err.message);
                                return res.status(500).send("There was a problem updating the user.");
                            }
                            res.status(200).send(docs);
                        });
                    }
                    else {
                        return res.status(403).send('You dont have the permission to do that! You\'re not on the list of moderators!');
                    }
                });
            });
        }
        else
        {
            return res.status(401).send('You dont have the permission to do this!');
        }
    });
});

router.delete('/:identification/moderators', (req, res, next) => {
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
            mongoose.connect(PATH, {dbName: 'meta'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('Internal server error while connecting to the database!');
                }
                var query = {$or : [{name:req.params.identification},{principal:req.params.identification},{location:req.params.identification}]};
                Facility.findOne(query, (err, doc) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send('Internal server error!');
                    }
                    if (body.accountType === "Administrator" || (body.accountType === "Moderator" && doc.moderators.includes(body.username)))
                    {
                        Facility.findOneAndUpdate(query, {$pull : {moderators: req.body.moderatorName}}, {new: true}, (err, docs) => {
                            if (err) {
                                console.log(err.message);
                                return res.status(500).send("There was a problem updating the user.");
                            }
                            res.status(200).send(docs);
                        });
                    }
                    else {
                        return res.status(403).send('You dont have the permission to do that! You\'re not on the list of moderators!');
                    }
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
        if(body.accountType === "Administrator" || body.accountType === "Moderator"){
            mongoose.connect(PATH, {dbName: 'meta'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('Internal server error while connecting to the database!');
                }
                var query = {$or : [{name:req.params.identification},{principal:req.params.identification},{location:req.params.identification}]};
                Facility.findOne(query, (err, doc) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send('Internal server error!');
                    }
                    if (body.accountType === "Administrator" || (body.accountType === "Moderator" && doc.moderators.includes(body.username)))
                    {
                        Facility.findOneAndUpdate(query, req.body, {new: true}, (err, docs) => {
                            if (err) {
                                console.log(err.message);
                                return res.status(500).send("There was a problem updating the user.");
                            }
                            res.status(200).send(docs);
                        });
                    }
                    else {
                        return res.status(403).send('You dont have the permission to do that! You\'re not on the list of moderators!');
                    }
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