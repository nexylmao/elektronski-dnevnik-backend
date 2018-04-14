const express = require('express');
const bodyparser = require('body-parser');
const fetch = require('fetch');
const mongoose = require('mongoose');
const application = express();

const PATH = process.env.MONGODBPATH;
const PORT = process.env.PORT || 3000;

application.use(bodyparser.json());
application.use(require('morgan')('dev'));

application.use('/api/authentication', require('./authentication/authRouter'));
application.use('/api/users', require('./authentication/userRouter'));
application.use('/meta/schoolYears', require('./gradelogging/meta/schoolYearRouter'));
application.use('/meta/facilities', require('./gradelogging/meta/facilityRouter'));
application.use('/', require('./gradelogging/foreachYear/unifiedRouter'));

application.use((err, req, res, next) => {
    console.log(err.message);
    res.status(err.status || 500).json({
        message: err.message,
        error: err.error,
        status: err.status
    });
    next();
});

application.listen(PORT, () => {
    console.log('Application up and runing, we\'re flowing data through port ' + PORT);
});
