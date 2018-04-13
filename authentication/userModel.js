const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const _user = new mongoose.Schema({
    email : {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    fullname: {
        type: String
    },
    accountType : {
        type: String,
        required: true,
        enum: ["Student","Parent","Profesor","Moderator","Administrator"],
        default: "Student"
    },
    password: {
        type: String,
        required: true
    }
});

_user.pre('save', function(next) {
    let doc = this;
    bcrypt.hash(doc.password, 10, (err, hash) => {
        if (err) {
            console.log('Something went wrong while hashing the password!');
            return next(err.message);
        }
        doc.password = hash;
        next();
    });
});

_user.pre('update', function(next) {
    let doc = this;
    if(doc.password === "")
    {
        bcrypt.hash(doc.password, 10, (err, hash) => {
            if (err) {
                console.log('Something went wrong while hashing the password!');
                return next(err.message);
            }
            doc.password = hash;
            next();
        })
    }
});

_user.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

_user.plugin(require('mongoose-timestamp'));
_user.plugin(require('mongoose-unique-validator'));
var User = mongoose.model('User', _user);
module.exports = User;