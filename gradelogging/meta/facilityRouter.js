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

router.all('*', (req, res, next) => {
    fetch.fetchUrl(apipath + '/me', {
        headers : {
            'x-access-token' : req.headers['x-access-token'] || ""
        }
    } , (err, meta, body) => {
        if (err) {
            console.log(err.message);
            return res.status(500).send({
                good = false,
                errMessage = err.message,
                message = 'Error while gathering the data on you!'
            });
        }
        req.user = JSON.parse(body);
        next();
    });
});

router.get('/', (req, res, next) => {
    if(req.user.accountType){
        mongoose.connect(PATH, {dbName: 'meta'}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good = false,
                    message = 'Error while connecting to the database!',
                    errMessage = err.message
                });
            }
            Facility.find({}, (err, docs) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good = false,
                        message = 'Error while querying the database!',
                        errMessage = err.message
                    });
                }
                res.status(200).send({
                    good = true,
                    data = docs
                });
            });
        });
    }
    else
    {
        return res.status(403).send({
            good = false,
            message = 'You don\'t have permission for this!'
        });
    }
});

router.get('/myFacility', (req, res, body) => {
    if(req.user.accountType) {
        if(req.user.accountType === "Moderator") {
            mongoose.connect(PATH, {dbName: 'meta'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good = false,
                        message = 'Error while connecting to the database!',
                        errMessage = err.message
                    });
                }
                Facility.findOne({moderators : {$in : [req.user.username]}},{_id:0,name:1}, (err, doc) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send({
                            good = false,
                            message = 'Error while querying the database!',
                            errMessage = err.message
                        });
                    }
                    if (!doc) {
                        console.log(req.user.username + ' doesn\' have a facility!');
                        return res.status(404).send({
                            good = false,
                            message = 'You don\'t have a facility :c (We sent a message to the team!)'
                        });
                    }
                    return res.status(200).send({
                        good = true,
                        data = doc
                    });
                });
            });
        }
        else {
            return res.status(404).send({
                good = false,
                message = 'You\'re not a moderator!'
            });
        }
    }
    else
    {
        return res.status(403).send({
            good = false,
            message = 'You don\'t have permission for this!'
        });
    }
});

router.get('/:identification', (req, res, next) => {
    if(req.user.accountType){
        mongoose.connect(PATH, {dbName: 'meta'}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good = false,
                    message = 'Error while connecting to the database!',
                    errMessage = err.message
                });
            }
            var query = {$or : [{name:req.params.identification},{principal:req.params.identification},{location:req.params.identification}]};
            Facility.find(query, (err, docs) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good = false,
                        message = 'Error while querying the database!',
                        errMessage = err.message
                    });
                }
                return res.status(200).send({
                    good = true,
                    data = doc
                });
            });
        });
    }
    else
    {
        return res.status(403).send({
            good = false,
            message = 'You don\'t have permission for this!'
        });
    }
});

router.get('/:identification/moderators', (req, res, next) => {
    if(req.user.accountType){
        mongoose.connect(PATH, {dbName: 'meta'}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good = false,
                    message = 'Error while connecting to the database!',
                    errMessage = err.message
                });
            }
            var query = {$or : [{name:req.params.identification},{principal:req.params.identification},{location:req.params.identification}]};
            Facility.find(query, {_id:0, moderators:1}, (err, docs) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good = false,
                        message = 'Error while querying the database!',
                        errMessage = err.message
                    });
                }
                return res.status(200).send({
                    good = true,
                    data = docs
                });
            });
        });
    }
    else
    {
        return res.status(403).send({
            good = false,
            message = 'You don\'t have permission for this!'
        });
    }
});

router.post('/', (req, res, next) => {
    if(req.user.accountType === "Administrator" || req.user.accountType === "Moderator"){
        mongoose.connect(PATH, {dbName: 'meta'}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good = false,
                    message = 'Error while connecting to the database!',
                    errMessage = err.message
                });
            }
            var newfac = {
                name: req.body.name,
                principal: req.body.principal,
                location: (req.body.location || "")
            }
            if (req.user.accountType === "Moderator"){
                newfac.moderators = [req.user.username];
            }
            Facility.create(newfac, (err, docs) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good = false,
                        message = 'Error while querying the database!',
                        errMessage = err.message
                    });
                }
                res.status(200).send({
                    good = true,
                    data = docs
                });
            });
        });
    }
    else
    {
        return res.status(403).send({
            good = false,
            message = 'You don\'t have permission for this!'
        });
    }
});

router.post('/:identification/moderators', (req, res, next) => {
    if(req.user.accountType === "Administrator" || req.user.accountType === "Moderator"){
        mongoose.connect(PATH, {dbName: 'meta'}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good = false,
                    message = 'Error while connecting to the database!',
                    errMessage = err.message
                });
            }
            var query = {$or : [{name:req.params.identification},{principal:req.params.identification},{location:req.params.identification}]};
            Facility.findOne(query, (err, doc) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good = false,
                        message = 'Error while querying the database!',
                        errMessage = err.message
                    });
                }
                if (req.user.accountType === "Administrator" || (req.user.accountType === "Moderator" && doc.moderators.includes(req.user.username)))
                {
                    Facility.findOneAndUpdate(query, {$push : {moderators: req.body.moderatorName}}, {new: true}, (err, docs) => {
                        if (err) {
                            console.log(err.message);
                            return res.status(500).send({
                                good = false,
                                message = 'Error while editing a document in the database!',
                                errMessage = err.message
                            });
                        }
                        res.status(200).send({
                            good = true,
                            data = docs
                        });
                    });
                }
                else {
                    return res.status(403).send({
                        good = false,
                        message = 'You don\'t have the permission to do that! You\'re not on the list of moderators!'
                    });
                }
            });
        });
    }
    else
    {
        return res.status(403).send({
            good = false,
            message = 'You don\'t have permission for this!'
        });
    }
});

router.put('/:identification', (req, res, next) => {
    if(req.user.accountType === "Administrator" || req.user.accountType === "Moderator"){
        mongoose.connect(PATH, {dbName: 'meta'}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good = false,
                    message = 'Error while connecting to the database!',
                    errMessage = err.message
                });
            }
            var query = {$or : [{name:req.params.identification},{principal:req.params.identification},{location:req.params.identification}]};
            Facility.findOne(query, (err, doc) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good = false,
                        message = 'Error while querying the database!',
                        errMessage = err.message
                    });
                }
                if (req.user.accountType === "Administrator" || (req.user.accountType === "Moderator" && doc.moderators.includes(req.user.username)))
                {
                    Facility.findOneAndUpdate(query, req.body, {new: true}, (err, docs) => {
                        if (err) {
                            console.log(err.message);
                            return res.status(500).send({
                                good = false,
                                message = 'Error while editing a document in the database!',
                                errMessage = err.message
                            });
                        }
                        res.status(200).send({
                            good = true,
                            data = docs
                        });
                    });
                }
                else {
                    return res.status(403).send({
                        good = false,
                        message = 'You don\'t have the permission to do that! You\'re not on the list of moderators!'
                    });
                }
            });
        });
    }
    else
    {
        return res.status(403).send({
            good = false,
            message = 'You don\'t have permission for this!'
        });
    }
});

router.delete('/:identification', (req, res, next) => {
    if(req.user.accountType === "Administrator" || req.user.accountType === "Moderator"){
        mongoose.connect(PATH, {dbName: 'meta'}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good = false,
                    message = 'Error while connecting to the database!',
                    errMessage = err.message
                });
            }
            var query = {$or : [{name:req.params.identification},{principal:req.params.identification},{location:req.params.identification}]};
            Facility.findOne(query, (err, doc) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good = false,
                        message = 'Error while querying the database!',
                        errMessage = err.message
                    });
                }
                if (req.user.accountType === "Administrator" || (req.user.accountType === "Moderator" && doc.moderators.includes(req.user.username)))
                {
                    Facility.findOneAndUpdate(query, {$pull : {moderators: req.body.moderatorName}}, {new: true}, (err, docs) => {
                        if (err) {
                            console.log(err.message);
                            return res.status(500).send({
                                good = false,
                                message = 'Error while editing a document in the database!',
                                errMessage = err.message
                            });
                        }
                        res.status(200).send({
                            good = true,
                            data = docs
                        });
                    });
                }
                else {
                    return res.status(403).send({
                        good = false,
                        message = 'You dont have the permission to do that! You\'re not on the list of moderators!'
                    });
                }
            });
        });
    }
    else
    {
        return res.status(403).send({
            good = false,
            message = 'You don\'t have permission for this!'
        });
    }
});

router.delete('/:identification/moderators', (req, res, next) => {
    if(req.user.accountType === "Administrator" || req.user.accountType === "Moderator"){
        mongoose.connect(PATH, {dbName: 'meta'}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good = false,
                    message = 'Error while connecting to the database!',
                    errMessage = err.message
                });
            }
            var query = {$or : [{name:req.params.identification},{principal:req.params.identification},{location:req.params.identification}]};
            Facility.findOne(query, (err, doc) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good = false,
                        message = 'Error while querying the database!',
                        errMessage = err.message
                    });
                }
                if (req.user.accountType === "Administrator" || (req.user.accountType === "Moderator" && doc.moderators.includes(req.user.username)))
                {
                    Facility.findOneAndUpdate(query, {$pull : {moderators: req.body.moderatorName}}, {new: true}, (err, docs) => {
                        if (err) {
                            console.log(err.message);
                            return res.status(500).send({
                                good = false,
                                message = 'Error while editing a document in the database!',
                                errMessage = err.message
                            });
                        }
                        res.status(200).send({
                            good = true,
                            data = docs
                        });
                    });
                }
                else {
                    return res.status(403).send({
                        good = true,
                        message = 'You dont have the permission to do that! You\'re not on the list of moderators!'
                    });
                }
            });
        });
    }
    else
    {
        return res.status(403).send({
            good = false,
            message = 'You don\'t have permission for this!'
        });
    }
});

module.exports = router;