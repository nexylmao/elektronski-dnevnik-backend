const mongoose = require('mongoose');

const _facility = new mongoose.Schema({
    name : {
        type: String,
        required: true,
        unique: true
    },
    location : {
        type: String,
        default: ""
    },
    principal : {
        type: String,
        unique: true,
        required: true
    },
    moderators: {
        type: [String],
        required: true
    }
},{collection:'Facilities'});

_facility.plugin(require('mongoose-timestamp'));
_facility.plugin(require('mongoose-unique-validator'));

module.exports = mongoose.model('Facility', _facility);