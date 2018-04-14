const router = require('express').Router();
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fetch = require('fetch');

const Subject = require('./subjectModel');
var thisYR = require('../../config/getActiveYear')();
var dbName = thisYR.substring(0,thisYR.indexOf(' '));

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
            return res.status(500).send('Internal server error while identifying you!');
        }
        req.user = JSON.parse(body);
        next();
    });
});

router.all('*', (req, res, next) => {
    if(req.headers['year-range']) {
        fetch.fetchUrl('http://localhost:'+PORT+'/meta/schoolYears/'+req.headers['year-range'], { headers : {
            'x-access-token' : req.headers['x-access-token'] || ""
        }}, (err, meta, body) => {
            if (err) {
                console.log(err.message);
                return res.status(500).send('Internal server error!');
            }
            else {
                body = JSON.parse(body)[0];
                if(body) {
                    if(body.active === true) {
                        req.databaseName = req.headers['year-range'].substring(0,req.headers['year-range'].indexOf(' '));
                        next();
                    }
                    else {
                        return res.status(403).send('You can\'t edit that schoolYear! It\'s inactive!');
                    }
                }
                else {
                    return res.status(403).send('You can\'t edit that schoolYear! It\'s inactive!');
                }
            }
        });
    }
    else {
        req.databaseName = dbName;  
        next();
    }
});

router.get('/', (req, res, next) => {
    if (req.user.accountType) {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
            }
            var query = {};
            var projection = {_id:0, _v:0, createdAt:0, updatedAt:0};
            if (req.user.accountType === "Administrator"){
                projection = {};
            }
            Subject.find(query, projection, (err, doc) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Internal server error!');
                }
                res.status(200).send(doc);
            });
        });
    }
    else {
        return res.status(403).send('You don\'t have permission to do that!');
    }
});

router.get('/byName/:name', (req, res, next) => {
    if (req.user.accountType) {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
            }
            var query = {name: req.params.name};
            var projection = {_id:0, _v:0, createdAt:0, updatedAt:0};
            if (req.user.accountType === "Administrator"){
                projection = {};
            }
            Subject.find(query, projection, (err, doc) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Internal server error!');
                }
                res.status(200).send(doc);
            });
        });
    }
    else {
        return res.status(403).send('You don\'t have permission to do that!');
    }
});

router.get('/profesor/:profesor', (req, res, next) => {
    if (req.user.accountType) {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
            }
            var query = {profesors: {$in:[req.params.profesor]}};
            var projection = {_id:0, _v:0, createdAt:0, updatedAt:0};
            if (req.user.accountType === "Administrator"){
                projection = {};
            }
            Subject.find(query, projection, (err, doc) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Internal server error!');
                }
                res.status(200).send(doc);
            });
        });
    }
    else {
        return res.status(403).send('You don\'t have permission to do that!');
    }
});

router.post('/', (req, res, next) => {
    if (req.user.accountType === "Moderator" || req.user.accountType === "Administrator") {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
            }
            var newsubj = {
                name : req.body.name,
                profesors : req.body.profesors,
                minimumGradeCount : req.body.minimumGradeCount
            }
            Subject.create(newsubj, (err, doc) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Internal server error!');
                }
                res.status(200).send(doc);
            });
        });
    }
    else {
        return res.status(403).send('You don\'t have permission to do that!');
    }
});

router.post('/:name/profesor', (req, res, next) => {
    if (req.user.accountType === "Moderator" || req.user.accountType === "Administrator") {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
            }
            Subject.findOneAndUpdate({name: req.params.name}, {$push : {profesors:req.body.profesorName}},{new:true}, (err, doc) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Internal server error!');
                }
                res.status(200).send(doc);
            });
        });
    }
    else {
        return res.status(403).send('You don\'t have permission to do that!');
    }
});

router.put('/:name', (req, res, next) => {
    if (req.user.accountType === "Moderator" || req.user.accountType === "Administrator") {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
            }
            Subject.findOneAndUpdate({name: req.params.name},req.body,{new:true}, (err, doc) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Internal server error!');
                }
                res.status(200).send(doc);
            });
        });
    }
    else {
        return res.status(403).send('You don\'t have permission to do that!');
    }
});

router.delete('/:name', (req, res, next) => {
    if (req.user.accountType === "Moderator" || req.user.accountType === "Administrator") {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
            }
            Subject.findOneAndRemove({name: req.params.name}, (err, doc) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Internal server error!');
                }
                res.status(200).send(doc);
            });
        });
    }
    else {
        return res.status(403).send('You don\'t have permission to do that!');
    }
});

router.delete('/:name/profesor', (req, res, next) => {
    if (req.user.accountType === "Moderator" || req.user.accountType === "Administrator") {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
            }
            Subject.findOneAndUpdate({name: req.params.name}, {$pull : {profesors:req.body.profesorName}},{new:true}, (err, doc) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Internal server error!');
                }
                res.status(200).send(doc);
            });
        });
    }
    else {
        return res.status(403).send('You don\'t have permission to do that!');
    }
});

module.exports = router;