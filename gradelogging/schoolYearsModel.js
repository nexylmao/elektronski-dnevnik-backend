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
    let currDate = new Date();
    let month = currDate.getUTCMonth() + 1;
    let year = currDate.getUTCFullYear();
    let doc = this;
    let yearRange = "";
    if (month < 9) {
        yearRange = year - 1 + ' - ' + year;
    }
    else
    {
        yearRange = year + ' - ' + year + 1;
    }
    doc.yearRange = yearRange;
    next();
});

_schoolYear.plugin(require('mongoose-timestamp'));
_schoolYear.plugin(require('mongoose-unique-validator'));

module.exports = mongoose.model('SchoolYear', _schoolYear);