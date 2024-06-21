/**
 * @module integrity
 * @requires crypto
 */
const crypto = require('crypto');

const key = process.env.SECURE_KEY; // secure key used to create unique data integrity hashs
let enabled = false; // enable/disable data integrity check (only for unit tests)
let db = null; // database client/module reference
let integrityValid = false; // variable filled by CheckTableIntegrity() result
let exception = ''; // Filled is data integrity is false
const checkIntegrityLoopTime = 60 * 60 * 1000; // Interval to check data integrity (60 minutes)
const devIntegrityLoopTime = 60 * 1000; // 1 minutes

/**
 * Defines a list of database tables to check data integrity
 */
const tables = [
/*    'software_avatar',
    'log_service',
    'waiting_room',
    'vehicl',
    'doctor',
    'nurse',
    repair
    repair_reports
    'users_back_office',*/
    'conversation',
    'msg',
    'note',
    'files',
    'rooms',
    'users',
    'oauth2',
    'folders',
    'meeting',
    'services',
    'planning',
    'patients',
    'machines',
    'sessions',
    'inventory',
    'rooms_types',
    'rooms_types',
    'back_office',
    'software_role',
    'group_service',
    'patient_files',
    'machines_users',
    'availabilities',
    'inventory_types',
    'patient_archives',
    'two_factor_authentication'
];

/*
API call to reset data integrity in case of an error:
http://localhost:3000/api/integrity/recompute-all-integrity
*/

/**
 * Initialize and check the data integrity during the (first and only) server initialization.
 * @param {PostgresClient} _db - Database client
 */
async function Init(_db) {
    db = _db;
    enabled = (process.env.NODE_ENV !== 'test');
    await RecomputeAllIntegrity();
    await checkIntegrityLoop();
    console.log("Server ready!");
}

/**
 * Launch a data integrity check and start a new timeout to check again the data integrity.
 */
async function checkIntegrityLoop() {
    let startTime = new Date();
    await CheckAllIntegrity();
    let endTime = new Date();

    console.log("Integrity checked in " + (endTime - startTime) + "ms.");
    setTimeout(checkIntegrityLoop, process.env.NODE_ENV === 'prod' ? checkIntegrityLoopTime : devIntegrityLoopTime);
}

/**
 * Check if last data integrity check return true or false.
 */
function IsValid() {
    return !enabled || integrityValid;
}

/**
 * Get the error message from the last data integrity check. (not null if integrity isn't valid).
 */
function GetException() {
    return exception;
}

/**
 * Check data integrity of all tables listed in {tables}
 */
async function CheckAllIntegrity() {

    if ( !enabled)
        return;

    for (const table of tables) {
        if ( !(await CheckTableIntegrity(table)))
            break;
    }

    if ( !integrityValid)
        console.error(exception);
}

/**
 * Reset / delete and compute integrity hashs for all data.
 */
async function RecomputeAllIntegrity() {

    if ( !enabled)
        return;

    for (const table of tables)
        await RecomputeTableIntegrity(table);
    // CheckAllIntegrity();
}

/**
 * Check data integrity a table.
 * @param {string} tableName - Database table to check
 */
async function CheckTableIntegrity(tableName) {
    let queries = '';
    let hash;

    if ( !enabled || tables.indexOf(tableName) === -1)
        return;

    try {
        const integrity = await db.query(`SELECT * FROM data_integrity_hashes WHERE table_name = '${tableName}';`);
        const data = await db.query(`SELECT * FROM ${tableName};`);

        if (integrity.rows.length !== data.rows.length) {
            integrityValid = false;
            exception = `Data integrity error: Invalid rows count
data_integrity_hashes: ${integrity.rows.length}
${tableName}: ${data.rows.length}`;
            let integrityNotLinked = [];
            let dataNotLinked = [];

            for (let i = 0; i !== integrity.rows.length; i++) {
                for (let j = 0; j !== data.rows.length; j++) {
                    if (integrity.rows[i].dataID === data.rows[j].id) {
                        integrity.rows[i].found = true;
                        data.rows[j].found = true;
                        break; // record found
                    }
                }
            }

            for (let i = 0; i !== integrity.rows.length; i++)
                if ( !integrity.rows[i].found)
                    integrityNotLinked.push(integrity.rows[i]);
            for (let i = 0; i !== data.rows.length; i++)
                if ( !data.rows[i].found)
                    dataNotLinked.push(data.rows[i]);

            if (integrityNotLinked.length !== 0) {
                exception += `\nIntegrity not linked: [\n`;

                for (let i = 0; i !== integrityNotLinked.length; i++) {
                    exception += `{ dataID: ${integrityNotLinked[i].dataID}, updated_at: ${integrityNotLinked[i].updated_at} }\n`;
                }
                exception += `]`;
            }

            if (dataNotLinked.length !== 0) {
                exception += `\nData not linked: [\n`;

                for (let i = 0; i !== dataNotLinked.length; i++) {
                    exception += `{ id: ${dataNotLinked[i].id} }\n`;
                }
                exception += `]`;
            }

            return false;
        }

        for (let i = 0; i !== integrity.rows.length; i++) {
            for (let j = 0; j !== data.rows.length; j++) {
                if (integrity.rows[i].dataID === data.rows[j].id) {
                    if (integrity.rows[i].hash !== getIntegrityHash(data.rows[j])) {
                        integrityValid = false;

                        console.log(data.rows[j]);
                        exception = `Data integrity error: Invalid hash
        table_name: ${tableName}
        data_id: ${integrity.rows[i].dataID}
        updated_at: ${integrity.rows[i].updated_at}
        integrity_hash: ${integrity.rows[i].hash}
        data_hash: ${getIntegrityHash(data.rows[j])}`;
                        return false;
                    }
                    break;
                }
            }
        }
        await db.query(queries);
    } catch (e) {
        console.error(e);
        integrityValid = false;
        exception = 'Data integrity error: ' + tableName + ' | ' + e.toString();
        return false;
    }
    integrityValid = true;
    exception = '';

    return true;
}

/**
 * Reset / Delete and compute data hashs of a table.
 * @param {string} tableName - Database table to compute
 */
async function RecomputeTableIntegrity(tableName) {
    let queries = '';
    let hash;

    if ( !enabled || tables.indexOf(tableName) === -1)
        return;

    try {
        await db.query(`DELETE FROM data_integrity_hashes WHERE table_name = '${tableName}';`);
        const data = await db.query(`SELECT * FROM ${tableName};`);

        for (let i = 0; i !== data.rows.length; i++) {
            hash = getIntegrityHash(data.rows[i]);
            queries += `INSERT INTO data_integrity_hashes (table_name, data_id, hash, updated_at) VALUES (\'${tableName}\', ${data.rows[i].id}, '${hash}', '${formatSqlDate(new Date())}');`;
        }

        await db.query(queries);
    } catch (e) {
        console.error(e);
    }
}

/**
 * Reset / Delete and compute a data hash.
 * @param {string} tableName - Database table totarget
 * @param {integer} dataID - Identifier of the data to target
 */
async function RecomputeDataIntegrity(tableName, dataID) {

    if ( !enabled || tables.indexOf(tableName) === -1)
        return;

    try {
        const data = await db.query(`SELECT * FROM ${tableName} WHERE id = ${dataID};`);

        if (data.rows.length === 0) {
            console.error(`RecomputeDataIntegrity() 0 record found for table = ${tableName} and id = ${dataID}`);
            return;
        }
        const hash = getIntegrityHash(data.rows[0]);
        await db.query(`UPDATE data_integrity_hashes SET hash = '${hash}', updated_at = '${formatSqlDate(new Date())}' WHERE table_name = '${tableName}' AND data_id = ${dataID};`);
    } catch (e) {
        console.error(e);
    }
}

/**
 * Insert a new data hash into the data integrity system.
 * @param {string} tableName - Database table totarget
 * @param {integer} dataID - Identifier of the data to target
 */
async function CreateDataIntegrity(tableName, dataID) {

    if ( !enabled || tables.indexOf(tableName) === -1)
        return;

    try {
        const data = await db.query(`SELECT * FROM ${tableName} WHERE id = ${dataID};`);

        if (data.rows.length === 0) {
            console.error(`CreateDataIntegrity() 0 record found for table = ${tableName} and id = ${dataID}`);
            return;
        }
        const hash = getIntegrityHash(data.rows[0]);
        await db.query(`INSERT INTO data_integrity_hashes (table_name, data_id, hash, updated_at) VALUES ('${tableName}', ${dataID}, '${hash}', '${formatSqlDate(new Date())}');`);
    } catch (e) {
        console.error(e);
    }
}

/**
 * Delete a data hash from the data integrity system.
 * @param {string} tableName - Database table totarget
 * @param {integer} dataID - Identifier of the data to target
 */
async function DeleteDataIntegrity(tableName, dataID) {

    if ( !enabled || tables.indexOf(tableName) === -1)
        return;

    try {
        await db.query(`DELETE FROM data_integrity_hashes WHERE table_name = '${tableName}' AND data_id = ${dataID};`);
    } catch (e) {
        console.error(e);
    }
}

/**
 * Compute an SHA256 Hmac hash to use as integrity unique identifier.
 * @param {object} data - Any data to hash
 */
function getIntegrityHash(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data) + key).digest('hex');
}

/**
 * Return a formated date string to use in sql statements
 * @param {Date} date - Date to format
 */
function formatSqlDate(date) {
    return date.getFullYear() + '-' +
        pad(date.getMonth() + 1, 2) + '-' +
        pad(date.getDate(), 2) + ' ' +
        pad(date.getHours(), 2) + ':' +
        pad(date.getMinutes(), 2) + ':' +
        pad(date.getSeconds(), 2);
}

/**
 * Add extra '0' if {str} length is smaller than {length}
 * Example: pad('3', 2) --> '03'
 * @param {string/integer} str - Number to format
 * @param {integer} length - length of padding
 */
function pad(str, length) {
    if (typeof str !== 'string')
        str = String(str);
    if (str.length >= length)
        return str;

    let result = '';

    for (let i = length - str.length - 1; i !== -1; i--)
        result += '0';
    return (result + str);
}

module.exports = {
    Init: Init,
    IsValid: IsValid,
    GetException: GetException,
    CheckAllIntegrity: CheckAllIntegrity,
    CreateDataIntegrity: CreateDataIntegrity,
    CheckTableIntegrity: CheckTableIntegrity,
    DeleteDataIntegrity: DeleteDataIntegrity,
    RecomputeAllIntegrity: RecomputeAllIntegrity,
    RecomputeDataIntegrity: RecomputeDataIntegrity,
    RecomputeTableIntegrity: RecomputeTableIntegrity,
}
