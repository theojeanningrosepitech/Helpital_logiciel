
/**
 * Return the current local datetime
 */
function GetLocalDate() {
    return new Date((new Date()).getTime() + -60000 * c.getTimezoneOffset());
}

/**
 * Merge all key and values from {cookies} into a raw string cookie for HTTP header
 * @param {object} cookies - Cookies
 */
function GetRawCookie(cookies) {
    let rawCookie = '';

    for (const key in cookies) {
        rawCookie += key + '=' + cookies[key] + ';';
    }
    return rawCookie;
}

/**
 * Return a formated date string from sql encoded date
 * @param {string} date - Date to format
 */
 function FormatDateFromSQL(date) {
    return (new Date(date)).toLocaleDateString();
}

/**
 * Return a formated date string to use in sql statements
 * @param {Date} date - Date to format
 */
 function FormatSqlDate(date) {
    return date.getFullYear() + '-' +
        Pad(date.getMonth() + 1, 2) + '-' +
        Pad(date.getDate(), 2) + ' ' +
        Pad(date.getHours(), 2) + ':' +
        Pad(date.getMinutes(), 2) + ':' +
        Pad(date.getSeconds(), 2);
}

/**
 * Return a formated date string to use in front-end
 * @param {Date} date - Date to format
 */
 function FormatDate(date) {
    return Pad(date.getDate(), 2) + '/' +
        Pad(date.getMonth() + 1, 2) + '/' +
        Pad(date.getFullYear(), 2) + ' à ' +
        Pad(date.getHours(), 2) + 'h' +
        Pad(date.getMinutes(), 2);
}

/**
 * Add extra '0' if {str} length is smaller than {length}
 * Example: pad('3', 2) --> '03'
 * @param {string/integer} str - Number to format
 * @param {integer} length - length of padding
 */
function Pad(str, length) {
    if (typeof str !== 'string')
        str = String(str);
    if (str.length >= length)
        return str;

    let result = '';

    for (let i = length - str.length - 1; i !== -1; i--)
        result += '0';
    return (result + str);
}

/**
 * Synchronously read stat of the file specified by {path}
 * @param {string} path - File path
 */
function FileStat(path) {
    try {
        return fs.statSync(path);
    } catch(err) {
        console.error(err);
        return null;
    }
}

// take a file size (in bytes) and return a formatted string
function FormatSize(size) {
    if (size < 1000)
        return (Math.round(size) + " o");
    else if (size < 1000000)
        return (Math.round(size / 1000) + " Ko");
    else if (size < 1000000000)
        return (Math.round(size / 1000000) + " Mo");
    return (Math.round(size / 1000000000) + " Go");
}

module.exports = {
    GetRawCookie: GetRawCookie,
    GetLocalDate: GetLocalDate,
    FormatDateFromSQL: FormatDateFromSQL,
    FormatSqlDate: FormatSqlDate,
    FormatDate: FormatDate,
    Pad: Pad,
    FileStat: FileStat,
    FormatSize: FormatSize
}
