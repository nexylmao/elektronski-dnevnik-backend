const router = require('express').Router();
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fetch = require('fetch');

const Grade = require('./gradeModel');
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

router.all('*', (req, res, next) => {
    if(req.headers['year-range']) {
        fetch.fetchUrl('http://localhost:'+PORT+'/meta/schoolYears/'+req.headers['year-range'], { headers : {
            'x-access-token' : req.headers['x-access-token'] || ""
        }}, (err, meta, body) => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good : false,
                    errMessage : err.message,
                    message : 'Error while gathering the data on schoolyears!'
                });
            }
            else {
                body = JSON.parse(body)[0];
                if(body) {
                    if(body.active === true) {
                        req.databaseName = req.headers['year-range'].substring(0,req.headers['year-range'].indexOf(' '));
                        next();
                    }
                    else {
                        return res.status(403).send({
                            good : false,
                            message : 'You can\'t edit that schoolYear! It\'s inactive!'
                        });
                    }
                }
                else {
                    return res.status(403).send({
                        good : false,
                        message : 'You can\'t edit that schoolYear! It\'s inactive!'
                    });
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
    if (req.user.accountType === "Student") {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                        good : false,
                        message : 'Error while connecting to the database!',
                        errMessage : err.message
                });
            }
            Grade.find({givenTo: req.user.username},(err, docs) => {
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
    else if (req.user.accountType === "Parent") {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good : false,
                    message : 'Error while connecting to the database!',
                    errMessage : err.message
                });
            }
            fetch.fetchUrl('http://localhost:'+PORT+'/classes/', {
                headers : {
                    'x-access-token' : req.params['x-access-token']
                }
            }, (err, meta, body) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good : false,
                        message : 'Error while gathering the classes data!',
                        errMessage : err.message
                    });
                }
                body = JSON.parse(body);
                var studs = [];
                body.forEach(element => {
                    if(element.parents.includes(req.user.username))
                    {
                        element.students.forEach(element => {
                            studs.push(element);
                        });
                        Grade.find({givenTo: {$in: array}},(err, docs) => {
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
                    }
                });
            });
        });
    }
    else if (req.user.accountType === "Profesor") {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good : false,
                    message : 'Error while connecting to the database!',
                    errMessage : err.message
                });
            }
            fetch.fetchUrl('http://localhost:'+PORT+'/classes/', {
                headers : {
                    'x-access-token' : req.params['x-access-token']
                }
            }, (err, meta, body) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good : false,
                        message : 'Error while gathering the classes data!',
                        errMessage : err.message
                    });
                }
                body = JSON.parse(body);
                var studs = [];
                body.forEach(element => {
                    if(element.teachers.includes(req.user.username) || element.homeTeachers.includes(req.user.username))
                    {
                        element.students.forEach(element => {
                            studs.push(element);
                        });
                        Grade.find({givenTo: {$in: array}},(err, docs) => {
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
                    }
                });
            });
        }); 
    }
    else if (req.user.accountType === "Administrator") {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good : false,
                    message : 'Error while connecting to the database!',
                    errMessage : err.message
                });
            }
            Grade.find({},(err, docs) => {
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
    else if (req.user.accountType === "Moderator") {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good : false,
                    message : 'Error while connecting to the database!',
                    errMessage : err.message
                });
            }
            fetch.fetchUrl('http://localhost:'+PORT+'/meta/facilities/myFacility',{
                headers : {
                    'x-access-token' : req.headers['x-access-token']
                }
            }, (err, meta, body) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good : false,
                        message : 'Error while gathering the facility data!',
                        errMessage : err.message
                    });
                }
                req.facility = JSON.parse(body).name;
                fetch.fetchUrl('http://localhost:'+PORT+'/classes', {
                    headers: {
                        'x-access-token' : req.headers['x-access-token']
                    }
                }, (err, meta, body) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send({
                            good : false,
                            message : 'Error while gathering the classes data!',
                            errMessage : err.message
                        });
                    }
                    body = JSON.parse(body);
                    facstuds = [];
                    body.forEach(element => {
                        if(element.facility === req.facility)
                        {
                            element.students.forEach(element => {
                                facstuds.push(element);
                            });
                            Grade.find({givenTo:{$in:facstuds}}, (err, docs) => {
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
                        }
                    });
                });
            });
        });
    }
    else {
        return res.status(403).send({
            good : false,
            message : 'You don\'t have permission for this!'
        });
    }
});

router.post('/', (req, res, next) => {
    if (req.user.accountType === "Profesor" || req.user.accountType === "Administrator") {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good : false,
                    message : 'Error while connecting to the database!',
                    errMessage : err.message
                });
            }
            var newgrade;
            if (req.user.accountType === "Profesor")
            {
                newgrade = {
                    grade : req.body.grade,
                    points : req.body.points,
                    comment : req.body.comment,
                    givenBy : req.user.username,
                    givenTo : req.body.student,
                    subject : req.body.subject
                }
                fetch.fetchUrl('http://localhost:'+PORT+'/subjects/profesor/'+req.user.username, {
                    headers : {
                        'x-access-token' : req.params['x-access-token']
                    }
                }, (err, meta, body) => {
                    if (err) {
                        console.log(err.message);
                        return res.status(500).send({
                            good : false,
                            message : 'Error while gathering the subjects data!',
                            errMessage : err.message
                        });
                    }
                    body = JSON.parse(body);
                    subjs = [];
                    body.forEach(element => {
                        subjs.push(element.name);
                    });
                    if(subjs.includes(newgrade.subject)){
                        fetch.fetchUrl('http://localhost:'+PORT+'/classes/', {
                            headers : {
                                'x-access-token' : req.params['x-access-token']
                            }
                        }, (err, meta, body) => {
                            if (err) {
                                console.log(err.message);
                                return res.status(500).send({
                                    good : false,
                                    message : 'Error while gathering the classes data!',
                                    errMessage : err.message
                                });
                            }
                            body = JSON.parse(body);
                            studs = [];
                            body.forEach(element => {
                                element.students.forEach(element => {
                                    studs.push(element);
                                });
                                if (studs.includes(newgrade.givenTo)) {
                                    // go to next 
                                }
                                else {
                                    return res.status(401).send({
                                        good : false,
                                        message : 'You can\'t give a grade to someone who you don\'t teach!'
                                    });
                                }
                            });
                        });
                    }
                    else {
                        return res.status(401).send({
                            good : false,
                            message : 'You can\'t give a grade for a subject you don\'t teach!'
                        });
                    }
                });
            }
            else {
                newgrade = {
                    grade : req.body.grade,
                    points : req.body.points,
                    comment : req.body.comment,
                    givenBy : req.body.profesor || req.user.username,
                    givenTo : req.body.student,
                    subject : req.body.subject
                }
            }
            Grade.create(newgrade, (err, doc) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good : false,
                        message : 'Error occured while inserting in the database!',
                        errMessage : err.message
                    });
                }
                res.status(200).send({
                    good : true,
                    data : doc
                });
            });
        });
    }
    else {
        return res.status(403).send({
            good : false,
            message : 'You don\'t have permission for this!'
        });
    }
});

module.exports = router;