const mongoose = require('mongoose');

const _class = new mongoose.Schema({
    name : {
        type: String,
        required: true
    },
    homeTeachers : {
        type: [String], 
        required: true
    },
    students : {
        type: [String],
        required: true,
        default: []
    },
    parents : {
        type: [String],
        required: true,
        default: []
    },
    subjects : {
        type: [String],
        required: true,
        default: []
    },
    teachers: {
        type: [String],
        required: true,
        default: []
    }
}, {collection: 'Classes'});

_class.plugin(require('mongoose-timestamp'));
_class.plugin(require('mongoose-unique-validator'));

module.exports = mongoose.model('Class', _class);