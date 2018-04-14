module.exports = () => {
    let currDate = new Date();
    let month = currDate.getUTCMonth() + 1;
    let year = currDate.getUTCFullYear();
    let yearRange = "";
    if (month < 9) {
        yearRange = year - 1 + ' - ' + year;
    }
    else
    {
        yearRange = year + ' - ' + year + 1;
    }
    return yearRange;
};