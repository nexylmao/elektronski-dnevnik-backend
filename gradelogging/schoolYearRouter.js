const router = require('express').Router();
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fetch = require('fetch');

const User = require('../authentication/userModel');
const SY = require('../gradelogging/schoolYearsModel');

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
        if(body.accountType === "Moderator" || body.accountType === "Administrator" || body.accountType === "Profesor"){
            mongoose.connect(PATH, {dbName: 'meta'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('Internal server error while connecting to the database!');
                }
                SY.find({}, (err, docs) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send('Internal server error!');
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
        if(body.accountType === "Moderator" || body.accountType === "Administrator"){
            mongoose.connect(PATH, {dbName: 'meta'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('Internal server error while connecting to the database!');
                }
                SY.create({active:true}, (err, data) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send('Internal sever error while creting the SchoolYear!');
                    }
                    return res.status(200).send(data);
                });
            });
        }
        else
        {
            return res.status(401).send('You dont have the permission to do this!');
        }
    });
});

router.get('/:yearRange', (req, res, body) => {
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
        if(body.accountType === "Moderator" || body.accountType === "Administrator" || body.accountType === "Profesor"){
            mongoose.connect(PATH, {dbName: 'meta'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('Internal server error while connecting to the database!');
                }
                SY.find({yearRange:req.params.yearRange}, (err, doc) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send('Internal server error!');
                    }
                    return res.status(200).send(doc);
                });
            });
        }
        else
        {
            return res.status(401).send('You dont have the permission to do this!');
        }
    });
});

router.post('/:yearRange/facilities', (req, res, body) => {
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
        if(body.accountType === "Moderator" || body.accountType === "Administrator"){
            mongoose.connect(PATH, {dbName: 'meta'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('Internal server error while connecting to the database!');
                }
                SY.findOne({yearRange: req.params.yearRange}, (err, docs) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send('Internal server error!');
                    }
                    if (docs.active === true)
                    {
                        SY.updateOne({yearRange:req.params.yearRange}, {$push: {facilities: req.body.facilityName}}, (err, doc) => {
                            if (err) {
                                console.log(err.message);
                                return res.status(500).send('Internal server error while adding the facility to the year!');
                            }
                            return res.status(200).send(doc);
                        });
                    }
                    else {
                        return res.status(410).send('The SchoolYear is now inactive, so it cannot be edited!');
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

router.post('/:yearRange/profesors', (req, res, body) => {
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
        if(body.accountType === "Moderator" || body.accountType === "Administrator"){
            mongoose.connect(PATH, {dbName: 'meta'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('Internal server error while connecting to the database!');
                }
                SY.findOne({yearRange: req.params.yearRange}, (err, docs) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send('Internal server error!');
                    }
                    if (docs.active == true)
                    {
                        SY.updateOne({yearRange:req.params.yearRange}, {$push: {profesors: req.body.profesorName}}, (err, doc) => {
                            if (err) {
                                console.log(err.message);
                                return res.status(500).send('Internal server error while adding the facility to the year!');
                            }
                            return res.status(200).send(doc);
                        });
                    }
                    else {
                        return res.status(410).send('The SchoolYear is now inactive, so it cannot be edited!');
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

router.post('/:yearRange/deactivate', (req, res, body) => {
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
            mongoose.connect(PATH, {dbName: 'meta'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('Internal server error while connecting to the database!');
                }
                SY.updateOne({yearRange:req.params.yearRange}, {active : false}, (err, doc) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send('Internal server error while adding the facility to the year!');
                    }
                    return res.status(200).send(doc);
                });
            });
        }
        else
        {
            return res.status(401).send('You dont have the permission to do this!');
        }
    });
});

router.post('/:yearRange/activate', (req, res, body) => {
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
            mongoose.connect(PATH, {dbName: 'meta'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('Internal server error while connecting to the database!');
                }
                SY.updateOne({yearRange:req.params.yearRange}, {active : true}, (err, doc) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send('Internal server error while adding the facility to the year!');
                    }
                    return res.status(200).send(doc);
                });
            });
        }
        else
        {
            return res.status(401).send('You dont have the permission to do this!');
        }
    });
});

router.delete('/:yearRange/profesors/', (req, res, next) => {
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
            mongoose.connect(PATH, {dbName: 'meta'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('Internal server error while connecting to the database!');
                }
                SY.findOne({yearRange: req.params.yearRange}, (err, docs) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send('Internal server error!');
                    }
                    if (docs.active == true)
                    {
                        SY.updateOne({yearRange:req.params.yearRange}, {$pull : {profesors:req.body.profesorName}}, (err, doc) => {
                            if (err) {
                                console.log(err.message);
                                return res.status(500).send('Internal server error while adding the facility to the year!');
                            }
                            return res.status(200).send(doc);
                        });
                    }
                    else {
                        return res.status(410).send('The SchoolYear is now inactive, so it cannot be edited!');
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

router.delete('/:yearRange/facilities/', (req, res, next) => {
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
            mongoose.connect(PATH, {dbName: 'meta'}, err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send('Internal server error while connecting to the database!');
                }
                SY.findOne({yearRange: req.params.yearRange}, (err, docs) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send('Internal server error!');
                    }
                    if (docs.active == true)
                    {
                        SY.updateOne({yearRange:req.params.yearRange}, {$pull : {facilities:req.body.facilityName}}, (err, doc) => {
                            if (err) {
                                console.log(err.message);
                                return res.status(500).send('Internal server error while adding the facility to the year!');
                            }
                            return res.status(200).send(doc);
                        });
                    }
                    else {
                        return res.status(410).send('The SchoolYear is now inactive, so it cannot be edited!');
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
