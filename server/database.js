/**
 * @module database
 * @requires postgres
 * @requires integrity
 */
const postgres = require('pg');
const integrity = require('./integrity');
const user = process.env.POSTGRES_USER
const password = process.env.POSTGRES_PASSWORD
const test = (process.env.NODE_ENV === 'test');
const host = test ? process.env.TEST_POSTGRES_ADDRESS : process.env.POSTGRES_ADDRESS;
const port = test ? process.env.TEST_POSTGRES_PORT : process.env.POSTGRES_PORT;
const database = test ? process.env.TEST_POSTGRES_DATABASE : process.env.POSTGRES_DATABASE;
let client = null;

connect();

async function connect() {
    try {
        client = new postgres.Client({
            user: user,
            host: host,
            database: database,
            password: password,
            port: port
        })
        await client.connect();
        integrity.Init(client);
        console.log("Client connected to database");

        /*
        client.query('LISTEN new_trigger');

        client.on('notification', async (data) => {
            const payload = JSON.parse(data.payload);
            function getSource() {
                switch (payload.source) {
                    case 'msg':
                        return '/conversation?user_two=' + payload.data.sender_id
                    default:
                        return ''
                }
            }
            await InsertData('notifications', {
                user_id: payload.data.receiver_id,
                data: JSON.stringify(payload.data),
                event_type: payload.source,
                path: getSource()
            })
            io.emit('new message', payload.data);
            console.log("new msg added", payload.data);
            console.log("data from trigger notif", data);
        })
        */
    } catch (e) {
    //    throw e
        console.error(e);
    }
}

async function disconnect() {

    if (client !== null) {
        await client.end();
        client = null;
        console.log("Client disconnected from database");
    }
}

// perform an asynchronous request using raw query
async function Select(rawQuery) {

    if ( !integrity.IsValid()) {
        return {
            data: null,
            err: integrity.GetException()
        };
    }

    try {
        const data = await client.query(rawQuery);
        // console.log(data.rows);
        // console.log({data: data, dataRows: data.rows[0]})
        //    if (data.rowCount > 1) {
        return {
            data: data.rows,
            err: null
        }
        /*} else {
            return {
                data: data.rows[0],
                err: null
            }
        }*/

    } catch (e) {
        return {
            data: null,
            err: e
        }
    }
}

// insert a new line into a table
// loop over each data key to get the values
async function Insert(query) {

    if ( !integrity.IsValid()) {
        return {
            data: null,
            code: "KO",
            err: integrity.GetException()
        };
    }

    try {
        let res = await client.query(query);
        return {
            data: res.rows,
            code: "OK",
            err: null
        }
    } catch (e) {
        console.log("cacth on insert");
        return {
            data: null,
            code: "KO",
            err: e
        }
    }
}

async function Update(query) {

    if ( !integrity.IsValid()) {
        return {
            data: null,
            code: "KO",
            err: integrity.GetException()
        };
    }

    try {
        let res = await client.query(query);
        return {
            data: res.rows,
            code: "OK",
            err: null
        }
    } catch (e) {
        return {
            code: "KO",
            err: e
        }
    }
}

// data can be an ID or an Array of ID
async function Delete(tableName, data) {

    if ( !integrity.IsValid()) {
        return {
            code: "KO",
            err: integrity.GetException()
        };
    }

    if (Array.isArray(data)) {
        // data is an Array of ID
        return await client.query('DELETE FROM ' + tableName + ' WHERE id IN (' + data.join(',') + ')');
    } else {
        // data is an ID
        return await client.query('DELETE FROM ' + tableName + ' WHERE id = \'' + data + '\'');
    }
}

// async function getUsersPassword(login) {
//     return await this.Select(`select *
//                                  from users
//                                  where login like '${login}'`)
// }
//
// async function getTable(selectorArray, tableName) {
//     return await this.Select(`select ${selectorArray}
//                                  from ${tableName}`)
// }


// insert a row in any table
async function InsertData(tableName, data) {
    let keys = [];
    let values = [];

    for (const key in data) {
        keys.push(key);

        if (data[key] instanceof Date)
            data[key] = formatSqlDate(data[key]);
        values.push('E\'' + EscapeQuote(data[key]) + '\'');
    }

    if (keys.length === 0) {
        return {
            err: "Missing data",
            data: 0
        };
    }
    const response = await Select('INSERT INTO ' + tableName + ' (' + keys.join(',') + ') VALUES (' + values.join(',') + ') RETURNING id');

    if (response.err) {
        return {
            err: response.err,
            data: 0
        };
    }
    integrity.CreateDataIntegrity(tableName, response.data[0].id);

    return {
        err: null,
        data: response.data[0].id
    };
}

// update any table
// loop over each key of the JSON sent throw body
// WARNING: tables fields are not protected, any field except 'id' can be updated
async function UpdateData(tableName, id, data) {
    let updateQuery = [];

    if (!id) {
        return {
            err: "Missing id",
            data: null
        };
    }

    for (const key in data) {
        if (key === 'id') {
            return {
                err: "Error: id should not be in data",
                data: null
            };
        }

        if (data[key] instanceof Date)
            data[key] = formatSqlDate(data[key]);
        updateQuery.push(key + ' = E\'' + EscapeQuote(data[key]) + '\'');
    }
    console.log(updateQuery.join(","))
    if (updateQuery.length === 0) {
        return {
            err: "Missing data",
            data: null
        };
    }
    const response = await Update('UPDATE ' + tableName + ' SET ' + updateQuery.join(',') + ' WHERE id = ' + id);

    if (response.err) {
        return {
            err: response.err,
            data: null
        };
    }
    integrity.RecomputeDataIntegrity(tableName, id);

    return {
        err: null,
        data: null
    };
}

// insert a row in any table
async function DeleteData(tableName, id) {

    if (!id) {
        return {
            err: "Missing id",
            data: null
        };
    }
    const response = await Delete(tableName, id);

    if (response.err) {
        return {
            err: response.err,
            data: null
        };
    }
    integrity.DeleteDataIntegrity(tableName, id);

    return {
        err: null,
        data: null
    };
}

// add '\' before every single quotes
function EscapeQuote(data) {
    return (typeof data === 'string') ? data.replaceAll('\'', '\\\'') : data;
}

function formatSqlDate(date) {
    return date.getFullYear() + '-' +
        pad(date.getMonth() + 1, 2) + '-' +
        pad(date.getDate(), 2) + ' ' +
        pad(date.getHours(), 2) + ':' +
        pad(date.getMinutes(), 2) + ':' +
        pad(date.getSeconds(), 2);
}

// pad('3', 2) --> '03'
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
    Select: Select,
    Insert: Insert,
    Delete: Delete,
    Update: Update,
    InsertData: InsertData,
    UpdateData: UpdateData,
    DeleteData: DeleteData,
    EscapeQuote: EscapeQuote,
    connect: connect,
    disconnect: disconnect
}
