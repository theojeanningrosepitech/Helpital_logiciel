/**
 * @module utils
 * @requires db
 * @requires axios
 * @requires fs
 */
const db = require('./database');
const axios = require ('axios');
const fs = require('fs');

/**
 * Return the current local datetime
 */
function GetLocalDate() {
    return new Date((new Date()).getTime() + -60000 * c.getTimezoneOffset());
}

/**
 * Create/insert a row into the database table {tableName}
 * The data used for the creation is retreived from the request's body
 * @param {Http.Request} req - Request object
 * @param {Http.Response} res - Response to fill
 * @param {string} tableName - Name of the database table to target
 */
async function PostController(req, res, tableName) {
    const response = await db.InsertData(tableName, req.body);

    if (response.err) {
        if (response.err == "Missing data") {
            res.status(400).json({ error: "Empty statement" });
            return null;
        } else {
            console.log(response.err);
            res.status(500).send(response.err);
            return null;
        }
    } else {
        res.status(200).json({ response: 'Row created', id: response.data });
        return { id: response.data, data: req.body };
    }
}

/**
 * Update a row from the database table {tableName}
 * loop over each key of the JSON sent throw body
 * WARNING: tables fields are not protected, any field except 'id' will be updated
 * @param {Http.Request} req - Request object
 * @param {Http.Response} res - Response to fill
 * @param {string} tableName - Name of the database table to target
 */
async function PutController(req, res, tableName) {
    const response = await db.UpdateData(tableName, req.query.id, req.body);

    if (response.err) {
        if (response.err == "Missing data") {
            res.status(400).json({ error: "Empty statement" });
            return null;
        } else if (response.err == "Missing id") {
            res.status(400).json({ error: "\'id'\ is missing" });
            return null;
        } else {
            res.status(500).send(response.err);
            return null;
        } 
    } else {
        res.status(200).json({ response: 'Row updated' });
        return { id: parseInt(req.query.id), data: req.body };
    }
}

/**
 * Delete a row from the database table {tableName}
 * @param {Http.Request} req - Request object
 * @param {Http.Response} res - Response to fill
 * @param {string} tableName - Name of the database table to target
 */
async function DeleteController(req, res, tableName) {
    const response = await db.DeleteData(tableName, req.query.id);

    if (response.err) {
        if (response.err == "Missing id") {
            res.status(400).json({ error: "\'id'\ is missing" });
            return null;
        } else {
            res.status(500).send(response.err);
            return null;
        }
    } else {
        res.status(200).json({ response: 'Row deleted' });
        return { id: parseInt(req.query.id) };
    }
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
 * Get the user identifier of the currently connected user.
 * Return -1 if the user isn't connected/found.
 * @param {Http.Request} req - Request object
 */
async function GetUserIdFromSession(req) {

    if (!req || !req.cookies || typeof req.cookies.sessionID === 'undefined' || !req.cookies.sessionID) {
        // missing \'sessionID\' cookie'
        return -1;
    }
    const response = await db.Select('SELECT user_id FROM sessions WHERE uuid = \'' + req.cookies.sessionID + '\'');

    if (response.err) {
        console.error(response.err);
        return -1;
    }

    if (!response.data || response.data.length === 0) {
        // No session could be found.
        return -1;
    }

    return response.data[0].user_id;
}

/**
 * Get the information of the currently connected user.
 * Return null if the user isn't connected/found.
 * @param {Http.Request} req - Request object
 */
async function GetSessionInfo(req) {

    if (!req || !req.cookies || typeof req.cookies.sessionID === 'undefined' || !req.cookies.sessionID) {
        // missing \'sessionID\' cookie'
        return null;
    }
    const response = await db.Select('SELECT user_id, device_type, created_at, expires_at FROM sessions WHERE uuid = \'' + req.cookies.sessionID + '\'');

    if (response.err) {
        console.error(response.err);
        return null;
    }

    if (!response.data || response.data.length === 0) {
        // No session could be found.
        return null;
    }

    return {
        sessionID: req.cookies.sessionID,
        userID: response.data[0].user_id,
        deviceType: response.data[0].device_type,
        createdAt: response.data[0].created_at,
        expiresAt: response.data[0].expires_at
    };
}

/**
 * Extract and return the value of a cookie targeted by {cookieName}.
 * Return an empty string if not found.
 * @param {string} cookies - Raw cookie header
 * @param {string} cookieName - Cookie name to target
 */
function getCookie(cookies, cookieName) {
    const cookie = cookies.split('; ').find(row => row.startsWith(cookieName));

    return cookie ? cookie.split('=')[1] : '';
}

function decodeImage(fileContent, fileName, dir) {
    //TODO: Maybe change the url and create directory directly if doesn't exist
    const urlFiles = `http://${process.env.TEST_POSTGRES_ADDRESS}:3000/files/${dir}/`;
    if (!fs.existsSync(`server/files/${dir}`)) {
        fs.mkdirSync(`server/files/${dir}`, { recursive: true });
    }
    fs.writeFile(`server/files/${dir}/${fileName}`, fileContent, 'binary',
        function(err) {
            if (err) return console.error(err)
            console.log('saved')
        });
    return urlFiles + fileName;
}

function initCap(str) {
    return str.toLowerCase().replace(/(?:^|\s)[a-z]/g, function (m) {
      return m.toUpperCase();
   });
}

/**
 * Convert all timestamps (seconds int / string) fields to Date objects, contained in {data} and filtered by {dateFields}.
 * Return an empty string if not found.
 * @param {object} data - Data object
 * @param {array} dateFields - Array of object keys to parse
 */
function parseTimestamps(data, dateFields) {
    for (const key of dateFields)
        if (data.hasOwnProperty(key) && (typeof data[key] === 'string' || typeof data[key] === 'number')) {
            data[key] = new Date(((typeof data[key] === 'string') ? parseInt(data[key]) : data[key]) * 1000);
        }
}

/**
 * Check if a file specified by {path} exists
 * @param {string} path - File path
 */
function FileExists(path) {
    return fs.existsSync(path);
}

/**
 * Move a file from {oldPath} to {newPath}
 * @param {string} oldPath - Source path
 * @param {string} newPath - Destination path
 */
function MoveFile(oldPath, newPath) {
    try {
        fs.renameSync(oldPath, newPath);
    } catch(err) {
        console.error(err);
        return false;
    }
    return true;
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

/**
 * Delete synchronously the file specified by {path}
 * @param {string} path - File path
 */
function DeleteFile(path) {
    try {
        fs.unlinkSync(path);
    } catch(err) {
        console.error(err);
        return false;
    }
    return true;
}

/**
 * Check a magic number (4-8 first bytes of a file)
 * If the file is not recognized this function will return false
 * @param {string} bytes - First 8 bytes if a file
 */
function CheckMagicNumber(bytes) {
    const magic = [
        [ 0xFF, 0xD8, 0xFF ],       // jpeg
        [ 0x89, 0x50, 0x4E, 0x47 ], // png
        [ 0x42, 0x4D ],             // bmp
        [ 0x52, 0x49, 0x46, 0x46 ], // webp
        [ 0x00, 0x00, 0x00, 0x18 ], // heic
        [ 0x47, 0x49, 0x46, 0x38 ], // gif
        [ 0x49, 0x49, 0x2A, 0x00 ], // tiff
        [ 0x4D, 0x4D, 0x00, 0x2A ], // tiff
        [ 0x25, 0x50, 0x44, 0x46 ], // pdf, ai, weps
        [ 0x50, 0x4B, 0x03, 0x04 ], // zip, docx, xlsx
        [ 0x52, 0x61, 0x72,  0x21 ], // rar
        [ 0x37, 0x7A, 0xBC, 0xAF ],   // 7z
        [ 0xC5, 0xD0, 0xD3, 0xC6 ], // eps (Adobe)
        [ 0x25, 0x21, 0x50, 0x53 ], // eps (original)
        [ 0x38, 0x42, 0x50, 0x53 ], // psd (photoshop)
        [ 0x50, 0x4B, 0x03, 0x04 ], // docx (MS Office Open XML Format Document)
    ];

    for (let i = magic.length - 1; i !== -1; i--) {
        for (let j = magic[i].length - 1; j !== -1; j--) {
            if (magic[i][j] !== bytes[j]) {
                break;
            } else if (j === 0) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Check a magic number (4-8 first bytes of a file)
 * If the file is not recognized this function will return false
 * @param {string} bytes - First 8 bytes if a file
 */
function CheckMagicNumberUploadCloud(bytes) {
    const magic = [
        [ 0xFF, 0xD8, 0xFF ],       // jpeg
        [ 0x89, 0x50, 0x4E, 0x47 ], // png
        [ 0x42, 0x4D ],             // bmp
        [ 0x52, 0x49, 0x46, 0x46 ], // webp
        [ 0x00, 0x00, 0x00, 0x18 ], // heic
        [ 0x47, 0x49, 0x46, 0x38 ], // gif
        [ 0x49, 0x49, 0x2A, 0x00 ], // tiff
        [ 0x4D, 0x4D, 0x00, 0x2A ], // tiff
        [ 0x25, 0x50, 0x44, 0x46 ], // pdf, ai, weps
        [ 0x52, 0x61, 0x72,  0x21 ], // rar
        [ 0x37, 0x7A, 0xBC, 0xAF ], // 7z
        [ 0x50, 0x4B, 0x03, 0x04 ], // zip, docx, xlsx, docx, ODT, ODP, OTT, JAR, SXC, SXD, SXI, SXW (MS Office Open XML Format Document)
    ];

    for (let i = magic.length - 1; i !== -1; i--) {
        for (let j = magic[i].length - 1; j !== -1; j--) {
            if (magic[i][j] !== bytes[j]) {
                break;
            } else if (j === 0) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Return the file content/MIME type
 * Return 'application/octet-stream' if not found
 * @param {string} extension - File extention (example.png -> png)
 */
function GetContentType(extension) {

    if (extension === '')
        return 'application/octet-stream';

    switch (extension) {
        case 'html':
            return 'text/html';
        case 'css':
            return 'text/css';
        case 'js':
            return 'application/javascript';
        case 'json':
            return 'application/json';
        case 'pdf':
            return 'application/pdf';
        case 'php':
            return 'application/php';
        case 'txt':
            return 'text/plain';
        case 'xml':
            return 'application/xml';
        case 'eot':
            return 'application/vnd.ms-fontobject';
        case 'bin':
            return 'application/octet-stream';
        case 'ttf':
            return 'font/ttf';
        case 'rtf':
            return 'application/rtf';
        case 'woff':
            return 'font/woff';
        case 'woff2':
            return 'font/woff2';
        case 'otf':
            return 'font/otf';
        case 'jpg':
            return 'image/jpeg';
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'ico':
            return 'image/vnd.microsoft.icon';
        case 'gif':
            return 'image/gif';
        case 'heic':
            return 'image/heic';
        case 'heif':
            return 'image/heif';
        case 'webp':
            return 'image/webp';
        case 'svg':
            return 'image/svg+xml';
        case 'bmp':
            return 'image/bmp';
        case 'tif':
            return 'image/tiff';
        case 'tiff':
            return 'image/tiff';
        case 'mpeg':
            return 'video/mpeg';
        case 'webm':
            return 'video/webm';
        case 'avi':
            return 'video/x-msvideo';
        case 'ogv':
            return 'video/ogg';
        case 'mp4':
            return 'video/mp4';
        case 'ogx':
            return 'application/ogg';
        case 'swf':
            return 'application/x-shockwave-flash';
        case 'mp3':
            return 'audio/mpeg';
        case 'wav':
            return 'audio/wav';
        case 'oga':
            return 'audio/ogg';
        case 'weba':
            return 'audio/webm';
        case 'opus':
            return 'audio/opus';
        case 'aac':
            return 'audio/aac';
        case 'rar':
            return 'application/vnd.rar';
        case 'zip':
            return 'application/zip';
        case '7z':
            return 'application/x-7z-compressed';
        case 'tar':
            return 'application/x-tar';
        case 'gz':
            return 'application/gzip';
        case 'bz':
            return 'application/x-bzip';
        case 'bz2':
            return 'application/x-bzip2';
        case 'csv':
            return 'text/csv';
        case 'ics':
            return 'text/calendar';
        case 'doc':
            return 'application/msword';
        case 'docx':
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'obp':
            return 'application/vnd.oasis.opendocument.presentation';
        case 'ods':
            return 'application/vnd.oasis.opendocument.spreadsheet';
        case 'odt':
            return 'application/vnd.oasis.opendocument.text';
        case 'ppt':
            return 'application/vnd.ms-powerpoint';
        case 'pptx':
            return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    }

    return 'application/octet-stream';
}

module.exports = {
    PostController: PostController,
    PutController: PutController,
    DeleteController: DeleteController,
    FormatSqlDate: FormatSqlDate,
    Pad: Pad,
    GetUserIdFromSession: GetUserIdFromSession,
    GetSessionInfo: GetSessionInfo,
    GetLocalDate: GetLocalDate,
    initCap: initCap,
    parseTimestamps: parseTimestamps,
    getCookie: getCookie,
    decodeImage: decodeImage,
    GetContentType: GetContentType,
    FileExists: FileExists,
    FileStat: FileStat,
    MoveFile: MoveFile,
    DeleteFile: DeleteFile,
    CheckMagicNumber: CheckMagicNumber,
    CheckMagicNumberUploadCloud: CheckMagicNumberUploadCloud
}
