const router = require('express').Router();
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fetch = require('fetch');

const PATH = process.env.MONGODBPATH;
const PORT = process.env.PORT;

var thisYR = "";
const apipath = 'http://localhost:' + PORT + '/api/authentication';

router.use(bodyparser.json());
router.use(bodyparser.urlencoded({extended: false}));

router.use('/classes', require('./classRouter'));
router.use('/grades', require('./gradeRouter'));
router.use('/subjects', require('./subjectRouter'));

module.exports = router;