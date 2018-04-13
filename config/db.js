const mongoose = require('mongoose');

module.exports = () => {
    mongoose.connect(process.env.MONGODBPATH, ree => {
        if (ree) 
        {
            console.log('Connection to the database failed : ');
            console.log(ree);
            return ree;
        } else {
            console.log('Successfully connected to the database!');
        }
    });
}