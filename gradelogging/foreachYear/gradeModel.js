const mongoose = require('mongoose');

const allowedGrades = [1,2,3,4,5];

const _grade = new mongoose.Schema({
    grade : {
        type: Number,
        required: true,
        enum: allowedGrades
    },
    points : {
        type: Number,
        default: 0
    },
    comment : {
        type: String,
        default: 'No comment given on this grade'
    },
    givenBy : {
        type: String,
        required: true
    },
    givenTo : {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    }
},{collection:'Grades'});

_grade.plugin(require('mongoose-timestamp'));
_grade.plugin(require('mongoose-unique-validator'));

module.exports = mongoose.model('Grade',_grade);