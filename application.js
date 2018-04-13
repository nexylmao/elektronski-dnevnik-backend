const express = require('express');
const bodyparser = require('body-parser');
const application = express();

const PORT = process.env.PORT || 3000;

application.use(bodyparser.json());
application.use(require('morgan')('dev'));

application.use('/api/users', require('./authentication/userRouter'));
application.use('/schoolYears/', require('./gradelogging/schoolYearRouter'));
application.use('/facilities', require('./gradelogging/facilityRouter'));
application.use('/users', require('./gradelogging/publicUserRouter'));
application.use('/api/authentication', require('./authentication/authRouter'));

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
