const router = require('express').Router();
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fetch = require('fetch');

const SY = require('./schoolYearsModel');

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
                good : false,
                errMessage : err.message,
                message : 'Error while gathering the data on you!'
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
                    good : false,
                    message : 'Error while connecting to the database!',
                    errMessage : err.message
                });
            }
            SY.find({}, (err, docs) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good : false,
                        message : 'Error while querying the database!',
                        errMessage : err.message
                    });
                }
                return res.status(200).send({
                    good : true, 
                    data : docs
                });
            });
        });
    }
    else
    {
        return res.status(403).send({
            good : false,
            message : 'You don\'t have permission for this!'
        });
    }
});

router.get('/now', (req, res, body) => {
    if(req.user.accountType){
        mongoose.connect(PATH, {dbName: 'meta'}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good : false,
                    message : 'Error while connecting to the database!',
                    errMessage : err.message
                });
            }
            SY.find({yearRange:(require('../../config/getActiveYear')())}, (err, doc) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good : false,
                        message : 'Error while querying the database!',
                        errMessage : err.message
                    });
                }
                return res.status(200).send({
                    good : true,
                    data : doc
                });
            });
        });
    }
    else
    {
        return res.status(403).send({
            good : false,
            message : 'You don\'t have permission for this!'
        });
    }
});

router.get('/:yearRange', (req, res, body) => {
    if(req.user.accountType === "Moderator" || req.user.accountType === "Administrator" || req.user.accountType === "Profesor"){
        mongoose.connect(PATH, {dbName: 'meta'}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good : false,
                    message : 'Error while connecting to the database!',
                    errMessage : err.message
                });
            }
            SY.find({yearRange:req.params.yearRange}, (err, doc) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good : false,
                        message : 'Error while querying the database!',
                        errMessage : err.message
                    });
                }
                return res.status(200).send({
                    good : true,
                    data : doc
                });
            });
        });
    }
    else
    {
        return res.status(403).send({
            good : false,
            message : 'You don\'t have permission for this!'
        });
    }
});

router.post('/', (req, res, next) => {
    if(req.user.accountType === "Moderator" || req.user.accountType === "Administrator"){
        mongoose.connect(PATH, {dbName: 'meta'}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good : false,
                    message : 'Error while connecting to the database!',
                    errMessage : err.message
                });
            }
            SY.create({active:true}, (err, doc) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good : false,
                        message : 'Error while inserting in the database!',
                        errMessage : err.message
                    });
                }
                return res.status(200).send({
                    good : true,
                    data : doc
                });
            });
        });
    }
    else
    {
        return res.status(403).send({
            good : false,
            message : 'You don\'t have permission for this!'
        });
    }
});

router.post('/:yearRange/facilities', (req, res, body) => {
    if(req.user.accountType === "Moderator" || req.user.accountType === "Administrator"){
        mongoose.connect(PATH, {dbName: 'meta'}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good : false,
                    message : 'Error while connecting to the database!',
                    errMessage : err.message
                });
            }
            SY.findOne({yearRange: req.params.yearRange}, (err, docs) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good : false,
                        message : 'Error while querying the database!',
                        errMessage : err.message
                    });
                }
                if (docs.active === true)
                {
                    SY.updateOne({yearRange:req.params.yearRange}, {$push: {facilities: req.body.facilityName}}, (err, doc) => {
                        if (err) {
                            console.log(err.message);
                            return res.status(500).send({
                                good : false,
                                message : 'Error while editing a document in the database!',
                                errMessage : err.message
                            });
                        }
                        return res.status(200).send({
                            good : true,
                            data : doc
                        });
                    });
                }
                else {
                    return res.status(410).send({
                        good : false,
                        message : 'The SchoolYear is now inactive, so it cannot be edited!'
                    });
                }
            });
        });
    }
    else
    {
        return res.status(403).send({
            good : false,
            message : 'You don\'t have permission for this!'
        });
    }
});

router.post('/:yearRange/profesors', (req, res, body) => {
    if(req.user.accountType === "Moderator" || req.user.accountType === "Administrator"){
        mongoose.connect(PATH, {dbName: 'meta'}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good : false,
                    message : 'Error while connecting to the database!',
                    errMessage : err.message
                });
            }
            SY.findOne({yearRange: req.params.yearRange}, (err, docs) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good : false,
                        message : 'Error while querying the database!',
                        errMessage : err.message
                    });
                }
                if (docs.active == true)
                {
                    SY.updateOne({yearRange:req.params.yearRange}, {$push: {profesors: req.body.profesorName}}, (err, doc) => {
                        if (err) {
                            console.log(err.message);
                            return res.status(500).send({
                                good : false,
                                message : 'Error while editing a document in the database!',
                                errMessage : err.message
                            });
                        }
                        return res.status(200).send({
                            good : true,
                            data : doc
                        });
                    });
                }
                else {
                    return res.status(410).send({
                        good : false,
                        message : 'The SchoolYear is now inactive, so it cannot be edited!'
                    });
                }
            });
        });
    }
    else
    {
        return res.status(403).send({
            good : false,
            message : 'You don\'t have permission for this!'
        });
    }
});

router.post('/:yearRange/deactivate', (req, res, body) => {
    if(req.user.accountType === "Administrator"){
        mongoose.connect(PATH, {dbName: 'meta'}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good : false,
                    message : 'Error while connecting to the database!',
                    errMessage : err.message
                });
            }
            SY.updateOne({yearRange:req.params.yearRange}, {active : false}, (err, doc) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good : false,
                        message : 'Error while editing a document in the database!',
                        errMessage : err.message
                    });
                }
                return res.status(200).send({
                    good : true,
                    data : doc
                });
            });
        });
    }
    else
    {
        return res.status(403).send({
            good : false,
            message : 'You don\'t have permission for this!'
        });
    }
});

router.post('/:yearRange/activate', (req, res, body) => {
    if(req.user.accountType === "Administrator"){
        mongoose.connect(PATH, {dbName: 'meta'}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good : false,
                    message : 'Error while connecting to the database!',
                    errMessage : err.message
                });
            }
            SY.updateOne({yearRange:req.params.yearRange}, {active : true}, (err, doc) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good : false,
                        message : 'Error while editing a document in the database!',
                        errMessage : err.message
                    });
                }
                return res.status(200).send({
                    good : true,
                    data : doc
                });
            });
        });
    }
    else
    {
        return res.status(403).send({
            good : false,
            message : 'You don\'t have permission for this!'
        });
    }
});

router.delete('/:yearRange/profesors/', (req, res, next) => {
    if(req.user.accountType === "Administrator"){
        mongoose.connect(PATH, {dbName: 'meta'}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good : false,
                    message : 'Error while connecting to the database!',
                    errMessage : err.message
                });
            }
            SY.findOne({yearRange: req.params.yearRange}, (err, docs) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good : false,
                        message : 'Error while editing querying the database!',
                        errMessage : err.message
                    });
                }
                if (docs.active == true)
                {
                    SY.updateOne({yearRange:req.params.yearRange}, {$pull : {profesors:req.body.profesorName}}, (err, doc) => {
                        if (err) {
                            console.log(err.message);
                            return res.status(500).send({
                                good : false,
                                message : 'Error while editing a document in the database!',
                                errMessage : err.message
                            });
                        }
                        return res.status(200).send({
                            good : true,
                            data : doc
                        });
                    });
                }
                else {
                    return res.status(410).send({
                        good : false,
                        message : 'The SchoolYear is now inactive, so it cannot be edited!'
                    });
                }
            });
        });
    }
    else
    {
        return res.status(403).send({
            good : false,
            message : 'You don\'t have permission for this!'
        });
    }
});

router.delete('/:yearRange/facilities/', (req, res, next) => {
    if(req.user.accountType === "Administrator"){
        mongoose.connect(PATH, {dbName: 'meta'}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good : false,
                    message : 'Error while connecting to the database!',
                    errMessage : err.message
                });
            }
            SY.findOne({yearRange: req.params.yearRange}, (err, docs) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good : false,
                        message : 'Error while querying the database!',
                        errMessage : err.message
                    });
                }
                if (docs.active == true)
                {
                    SY.updateOne({yearRange:req.params.yearRange}, {$pull : {facilities:req.body.facilityName}}, (err, doc) => {
                        if (err) {
                            console.log(err.message);
                            return res.status(500).send({
                                good : false,
                                message : 'Error while editing a document in the database!',
                                errMessage : err.message
                            });
                        }
                        return res.status(200).send({
                            good : true,
                            data : doc
                        });
                    });
                }
                else {
                    return res.status(410).send({
                        good : false,
                        message : 'The SchoolYear is now inactive, so it cannot be edited!'
                    });
                }
            });
        });
    }
    else
    {
        return res.status(403).send({
            good : false,
            message : 'You don\'t have permission for this!'
        });
    }
});

module.exports = router;
