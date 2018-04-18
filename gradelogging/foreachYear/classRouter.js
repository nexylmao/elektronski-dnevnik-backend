const router = require('express').Router();
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fetch = require('fetch');

const Class = require('./classModel');
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
                good = false,
                errMessage = err.message,
                message = 'Error while gathering the data on you!'
            });
        }
        req.user = JSON.parse(body);
        next();
    });
});

router.all('*', (req, res, next) => {
    fetch.fetchUrl('http://localhost:'+PORT+'/meta/facilities/myFacility', {
        headers : { 'x-access-token' : req.headers['x-access-token'] || "" }
        }, (err, meta, body) => {
        if (err) {
            console.log(err.message);
            return res.status(500).send({
                good = false,
                errMessage = err.message,
                message = 'Error while gathering the data on your main facility!'
            });
        }
        if(req.user.accountType === "Moderator")
        {
            body = JSON.parse(body);
            req.facilities = body.data.name;
        }
        else {
            req.facilities = null;
        }
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
                    good = false,
                    errMessage = err.message,
                    message = 'Error while gathering the data on schoolyears!'
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
                            good = false,
                            message = 'You can\'t edit that schoolYear! It\'s inactive!'
                        });
                    }
                }
                else {
                    return res.status(403).send({
                        good = false,
                        message = 'You can\'t edit that schoolYear! It\'s inactive!'
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
    if (req.user.accountType) {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good = false,
                    message = 'Error while connecting to the database!',
                    errMessage = err.message
                });
            }
            var query = {$or : [{students: {$in : [req.user.username]}},{parents: {$in : [req.user.username]}}]}; 
            var projection = {_id:0, _v:0, updatedAt:0, createdAt:0};
            if(req.user.accountType === "Administrator") {
                query = {};
                projection = {};
            }
            if(req.user.accountType === "Moderator") {
                query = {facility : req.facilities};
            }
            if(req.user.accountType === "Profesor") {
                query = {$or : [{teachers: {$in : [req.user.username]}},{homeTeachers: {$in : [req.user.username]}}]};
            }
            Class.find(query, projection, (err, docs) => {
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
    else {
        return res.status(403).send({
            good = false,
            message = 'You don\'t have permission for this!'
        });
    }
});

router.get('/:name', (req, res, next) => {
    if (req.user.accountType) {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good = false,
                    message = 'Error while connecting to the database!',
                    errMessage = err.message
                });
            }
            var query = {$and : [{name: req.params.name},{$or : [{students: {$in : [req.user.username]}},{parents: {$in : [req.user.username]}}]}]}; 
            var projection = {_id:0, _v:0, updatedAt:0, createdAt:0};
            if(req.user.accountType === "Administrator") {
                query = {name: req.params.name};
                projection = {};
            }
            if(req.user.accountType === "Moderator") {
                query = {$and : [{name: req.params.name},{facility : req.facilities}]};
            }
            if(req.user.accountType === "Profesor") {
                query = {$and : [{name: req.params.name},{$or : [{teachers: {$in : [req.user.username]}},{homeTeachers: {$in : [req.user.username]}}]}]};
            }
            Class.find(query, projection, (err, docs) => {
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
    else {
        return res.status(403).send({
            good = false,
            message = 'You don\'t have permission for this!'
        });
    }
});

router.post('/', (req, res, next) => {
    if(req.user.accountType === "Moderator" || req.user.accountType === "Administrator") {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good = false,
                    message = 'Error while connecting to the database!',
                    errMessage = err.message
                });
            }
            let fac;
            if (req.user.accountType === "Moderator") {
                fac = req.facilities;
            }
            else {
                fac = req.body.facility || "*not assigned*";
            }
            var newclass = {
                name : req.body.name,
                facility : fac,
                homeTeachers : req.body.homeTeachers,
                students : req.body.students,
                parents : req.body.parents,
                subjects : req.body.subjects,
                teachers : req.body.teachers
            };
            Class.create(newclass, (err, doc) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good = false,
                        message = 'Error while inserting in the database!',
                        errMessage = err.message
                    });
                }
                res.status(200).send({
                    good = true,
                    data = doc
                });
            });
        });
    }
    else {
        return res.status(403).send({
            good = false,
            message = 'You don\'t have permission for this!'
        });
    }
});

router.post('/:name/homeTeacher', (req, res, next) => {
    if (req.user.accountType == 'Administrator' || req.user.accountType == 'Moderator') {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good = false,
                    message = 'Error while connecting to the database!',
                    errMessage = err.message
                });
            }
            Class.find({name: req.params.name}, (err, doc) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good = false,
                        message = 'Error while querying the database!',
                        errMessage = err.message
                    });
                }
                if((req.user.accountType === "Moderator" && doc.facility === req.facilities) || req.user.accountType === "Administrator")
                {
                    Class.findOneAndUpdate({name: req.params.name}, {$push:{homeTeachers:req.body.teacherName}}, {new:true}, (err, doc) => {
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
                            data = doc
                        });
                    });
                }
                else {
                    return res.status(403).send({
                        good = false,
                        message = 'You\'re not the moderator of that facility!'
                    });
                }
            });
        });
    }
    else {
        return res.status(403).send({
            good = false,
            message = 'You don\'t have permission for this!'
        });
    }
});

router.post('/:name/student', (req, res, next) => {
    if (req.user.accountType == 'Administrator' || req.user.accountType == 'Moderator') {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good = false,
                    message = 'Error while connecting to the database!',
                    errMessage = err.message
                });
            }
            Class.findOne({name: req.params.name}, (err, doc) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good = false,
                        message = 'Error while querying the database!',
                        errMessage = err.message
                    });
                }
                if((req.user.accountType === "Moderator" && doc.facility === req.facilities) || req.user.accountType === "Administrator")
                {
                    Class.findOneAndUpdate({name: req.params.name}, {$push:{students:req.body.studentName}}, {new:true}, (err, doc) => {
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
                            data = doc
                        });
                    });
                }
                else {
                    return res.status(403).send({
                        good = false,
                        message = 'You\'re not the moderator of that facility!'
                    });
                }
            });
        });
    }
    else {
        return res.status(403).send({
            good = false,
            message = 'You don\'t have permission for this!'
        });
    }
});

router.post('/:name/parent', (req, res, next) => {
    if (req.user.accountType == 'Administrator' || req.user.accountType == 'Moderator') {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good = false,
                    message = 'Error while connecting to the database!',
                    errMessage = err.message
                });
            }
            Class.find({name: req.params.name}, (err, doc) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good = false,
                        message = 'Error while querying the database!',
                        errMessage = err.message
                    });
                }
                if((req.user.accountType === "Moderator" && doc.facility === req.facilities) || req.user.accountType === "Administrator")
                {
                    Class.findOneAndUpdate({name: req.params.name}, {$push:{parents:req.body.parentName}}, {new:true}, (err, doc) => {
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
                            data = doc
                        });
                    });
                }
                else {
                    return res.status(403).send({
                        good = false,
                        message = 'You\'re not the moderator of that facility!'
                    });
                }
            });
        });
    }
    else {
        return res.status(403).send({
            good = false,
            message = 'You don\'t have permission for this!'
        });
    }
});

router.post('/:name/subject', (req, res, next) => {
    if (req.user.accountType == 'Administrator' || req.user.accountType == 'Moderator') {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good = false,
                    message = 'Error while connecting to the database!',
                    errMessage = err.message
                });
            }
            Class.find({name: req.params.name}, (err, doc) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good = false,
                        message = 'Error while querying the database!',
                        errMessage = err.message
                    });
                }
                if((req.user.accountType === "Moderator" && doc.facility === req.facilities) || req.user.accountType === "Administrator")
                {
                    Class.findOneAndUpdate({name: req.params.name}, {$push:{subjects:req.body.subjectName}}, {new:true}, (err, doc) => {
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
                            data = doc
                        });
                    });
                }
                else {
                    return res.status(403).send({
                        good = false,
                        message = 'You\'re not the moderator of that facility!'
                    });
                }
            });
        });
    }
    else {
        return res.status(403).send({
            good = false,
            message = 'You don\'t have permission for this!'
        });
    }
});

router.post('/:name/teacher', (req, res, next) => {
    if (req.user.accountType == 'Administrator' || req.user.accountType == 'Moderator') {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good = false,
                    message = 'Error while connecting to the database!',
                    errMessage = err.message
                });
            }
            Class.find({name: req.params.name}, (err, doc) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good = false,
                        message = 'Error while querying the database!',
                        errMessage = err.message
                    });
                }
                if((req.user.accountType === "Moderator" && doc.facility === req.facilities) || req.user.accountType === "Administrator")
                {
                    Class.findOneAndUpdate({name: req.params.name}, {$push:{teachers:req.body.teacherName}}, {new:true}, (err, doc) => {
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
                            data = doc
                        });
                    });
                }
                else {
                    return res.status(403).send({
                        good = false,
                        message = 'You\'re not the moderator of that facility!'
                    });
                }
            });
        });
    }
    else {
        return res.status(403).send({
            good = false,
            message = 'You don\'t have permission for this!'
        });
    }
});

router.put('/:name', (req, res, next) => {
    if (req.user.accountType == 'Administrator' || req.user.accountType == 'Moderator') {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good = false,
                    message = 'Error while connecting to the database!',
                    errMessage = err.message
                });
            }
            Class.find({name: req.params.name}, (err, doc) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good = false,
                        message = 'Error while querying the database!',
                        errMessage = err.message
                    });
                }
                if((req.user.accountType === "Moderator" && doc.facility === req.facilities) || req.user.accountType === "Administrator")
                {
                    Class.findOneAndUpdate({name: req.params.name}, req.body, {new:true}, (err, doc) => {
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
                            data = doc
                        });
                    });
                }
                else {
                    return res.status(403).send({
                        good = false,
                        message = 'You\'re not the moderator of that facility!'
                    });
                }
            });
        });
    }
    else {
        return res.status(403).send({
            good = false,
            message = 'You don\'t have permission for this!'
        });
    }
});

router.delete('/:name', (req, res, next) => {
    if (req.user.accountType == 'Administrator' || req.user.accountType == 'Moderator') {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good = false,
                    message = 'Error while connecting to the database!',
                    errMessage = err.message
                });
            }
            Class.find({name: req.params.name}, (err, doc) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good = false,
                        message = 'Error while querying the database!',
                        errMessage = err.message
                    });
                }
                if((req.user.accountType === "Moderator" && doc.facility === req.facilities) || req.user.accountType === "Administrator")
                {
                    Class.findOneAndRemove({name: req.params.name}, (err, doc) => {
                        if (err) {
                            console.log(err.message);
                            return res.status(500).send({
                                good = false,
                                message = 'Error while deleting a document in the database!',
                                errMessage = err.message
                            });
                        }
                        res.status(200).send({
                            good = true,
                            data = doc
                        });
                    });
                }
                else {
                    return res.status(403).send({
                        good = false,
                        message = 'You\'re not the moderator of that facility!'
                    });
                }
            });
        });
    }
    else {
        return res.status(403).send({
            good = false,
            message = 'You don\'t have permission for this!'
        });
    }
});

router.delete('/:name/homeTeacher', (req, res, next) => {
    if (req.user.accountType == 'Administrator' || req.user.accountType == 'Moderator') {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good = false,
                    message = 'Error while connecting to the database!',
                    errMessage = err.message
                });
            }
            Class.find({name: req.params.name}, (err, doc) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good = false,
                        message = 'Error while querying the database!',
                        errMessage = err.message
                    });
                }
                if((req.user.accountType === "Moderator" && doc.facility === req.facilities) || req.user.accountType === "Administrator")
                {
                    Class.findOneAndUpdate({name: req.params.name}, {$pull:{homeTeachers:req.body.teacherName}}, {new:true}, (err, doc) => {
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
                            data = doc
                        });
                    });
                }
                else {
                    return res.status(403).send({
                        good = false,
                        message = 'You\'re not the moderator of that facility!'
                    });
                }
            });
        });
    }
    else {
        return res.status(403).send({
            good = false,
            message = 'You don\'t have permission for this!'
        });
    }
});

router.delete('/:name/student', (req, res, next) => {
    if (req.user.accountType == 'Administrator' || req.user.accountType == 'Moderator') {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good = false,
                    message = 'Error while connecting to the database!',
                    errMessage = err.message
                });
            }
            Class.find({name: req.params.name}, (err, doc) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good = false,
                        message = 'Error while querying the database!',
                        errMessage = err.message
                    });
                }
                if((req.user.accountType === "Moderator" && doc.facility === req.facilities) || req.user.accountType === "Administrator")
                {
                    Class.findOneAndUpdate({name: req.params.name}, {$pull:{students:req.body.studentName}}, {new:true}, (err, doc) => {
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
                            data = doc
                        });
                    });
                }
                else {
                    return res.status(403).send({
                        good = false,
                        message = 'You\'re not the moderator of that facility!'
                    });
                }
            });
        });
    }
    else {
        return res.status(403).send({
            good = false,
            message = 'You don\'t have permission for this!'
        });
    }
});

router.delete('/:name/parent', (req, res, next) => {
    if (req.user.accountType == 'Administrator' || req.user.accountType == 'Moderator') {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good = false,
                    message = 'Error while connecting to the database!',
                    errMessage = err.message
                });
            }
            Class.find({name: req.params.name}, (err, doc) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good = false,
                        message = 'Error while querying the database!',
                        errMessage = err.message
                    });
                }
                if((req.user.accountType === "Moderator" && doc.facility === req.facilities) || req.user.accountType === "Administrator")
                {
                    Class.findOneAndUpdate({name: req.params.name}, {$pull:{parents:req.body.parentName}}, {new:true}, (err, doc) => {
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
                            data = doc
                        });
                    });
                }
                else {
                    return res.status(403).send({
                        good = false,
                        message = 'You\'re not the moderator of that facility!'
                    });
                }
            });
        });
    }
    else {
        return res.status(403).send({
            good = false,
            message = 'You don\'t have permission for this!'
        });
    }
});

router.delete('/:name/subject', (req, res, next) => {
    if (req.user.accountType == 'Administrator' || req.user.accountType == 'Moderator') {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good = false,
                    message = 'Error while connecting to the database!',
                    errMessage = err.message
                });
            }
            Class.find({name: req.params.name}, (err, doc) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good = false,
                        message = 'Error while querying the database!',
                        errMessage = err.message
                    });
                }
                if((req.user.accountType === "Moderator" && doc.facility === req.facilities) || req.user.accountType === "Administrator")
                {
                    Class.findOneAndUpdate({name: req.params.name}, {$pull:{subjects:req.body.subjectName}}, {new:true}, (err, doc) => {
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
                            data = doc
                        });
                    });
                }
                else {
                    return res.status(403).send({
                        good = false,
                        message = 'You\'re not the moderator of that facility!'
                    });
                }
            });
        });
    }
    else {
        return res.status(403).send({
            good = false,
            message = 'You don\'t have permission for this!'
        });
    }
});

router.delete('/:name/teacher', (req, res, next) => {
    if (req.user.accountType == 'Administrator' || req.user.accountType == 'Moderator') {
        mongoose.connect(PATH, {dbName: req.databaseName}, err => {
            if (err) {
                console.log(err.message);
                return res.status(500).send({
                    good = false,
                    message = 'Error while connecting to the database!',
                    errMessage = err.message
                });
            }
            Class.find({name: req.params.name}, (err, doc) => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send({
                        good = false,
                        message = 'Error while querying the database!',
                        errMessage = err.message
                    });
                }
                if((req.user.accountType === "Moderator" && doc.facility === req.facilities) || req.user.accountType === "Administrator")
                {
                    Class.findOneAndUpdate({name: req.params.name}, {$pull:{teachers:req.body.teacherName}}, {new:true}, (err, doc) => {
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
                            data = doc
                        });
                    });
                }
                else {
                    return res.status(403).send({
                        good = false,
                        message = 'You\'re not the moderator of that facility!'
                    });
                }
            });
        });
    }
    else {
        return res.status(403).send({
            good = false,
            message = 'You don\'t have permission for this!'
        });
    }
});


module.exports = router;