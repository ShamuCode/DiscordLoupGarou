let timeToString = (minutes) => {

    let years = minutes / 60 / 24 / 31 / 12;
    let months = minutes / 60 / 24 / 31 % 12;
    let days = minutes / 60 / 24 % 31;
    let hours = minutes / 60 % 24;

    let seconds = (minutes * 60) % 60;

    if (minutes < 1) {
        minutes = 0;
    }

    let timestring = `${(minutes % 60).toFixed()}`;

    if (minutes >= 1) {
        timestring = `${timestring}m${seconds}s`;
    } else {
        timestring = `${seconds}s`
    }
    if (hours >= 1) timestring = `${hours.toFixed()}h${timestring}`;
    if (days >= 1) timestring = `${days.toFixed()}D${timestring}`;
    if (months >= 1) timestring = `${months.toFixed()}M${timestring}`;
    if (years >= 1) timestring = `${years.toFixed()}Y${timestring}`;

    return timestring;

};

module.exports = timeToString;