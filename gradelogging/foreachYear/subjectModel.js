const mongoose = require('mongoose');

const _subject = new mongoose.Schema({
    name : {
        type: String,
        require: true
    },
    profesors : {
        type: [String],
        require: true,
        default: []
    },
    minimumGradeCount : {
        type: Number,
        required: true,
        default: 3
    }
},{collection:'Subjects'});

_subject.plugin(require('mongoose-timestamp'));
_subject.plugin(require('mongoose-unique-validator'));

module.exports = mongoose.model('Subject',_subject);