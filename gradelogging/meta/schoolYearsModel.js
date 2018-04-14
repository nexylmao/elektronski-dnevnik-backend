const mongoose = require('mongoose');

const _schoolYear = new mongoose.Schema({
    yearRange : {
        type: String,
        unique: true,
        default: ""
    },
    active : {
        type: Boolean,
        required: true, 
        default: true
    },
    facilities : {
        type: [String],
        required: true,
        default: []
    },
    profesors : {
        type: [String],
        required: true,
        default: []
    }
},{collection:'SchoolYears'});

_schoolYear.pre('save', function(next) {
    this.yearRange = require('../config/getActiveYear')();
    next();
});

_schoolYear.plugin(require('mongoose-timestamp'));
_schoolYear.plugin(require('mongoose-unique-validator'));

module.exports = mongoose.model('SchoolYear', _schoolYear);