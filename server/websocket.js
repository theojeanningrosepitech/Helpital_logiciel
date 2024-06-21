/**
 * @module websocket
 * @requires ws
 * @requires utils
 * @requires db
 */
const ws = require('ws');
const utils = require('./utils');
const db = require('./database');

/**
 * Object used as an array of websocket users
 */

let socketList = {};

/**
 * Websocket user data class
 */

class User {
    constructor(userID, service) {
        this.userID = userID;
        this.service = service;
        this.sockets = [];
    }
}

/**
 * Websocket event ressource names (based on SQL schema)
 */
const ressourceNames = ['contact', 'inventory', 'inventory_type', 'message', 'meeting', 'note', 'prescription', 'patient', 'planning', 'radiograph', 'room', 'room_type', 'service_group', 'user', 'repair', 'repair_report', 'radiograph'];

/**
 * Websocket server instance
 */
const socketServer = new ws.WebSocket.Server({
    noServer: true,
    path: '/websocket',
});

/**
 * Link and initialize websocket listeners on the main web server.
 * @param {Http.Server} webServer - Web server
 */
function init(webServer) {

    // The client request an upgrade from HTTP to WebSocket.
    webServer.on('upgrade', (request, socket, head) => {
        socketServer.handleUpgrade(request, socket, head, (websocket) => {
            socketServer.emit('connection', websocket, request);
        });
    });

    // The client is connecting to the websocket.
    socketServer.on('connection', async (socket, req) => {
        req.cookies = { sessionID: utils.getCookie(req.headers.cookie, 'sessionID') };
        const session = await utils.GetSessionInfo(req);

        // Check if user is connected.
        if ( !session) {
            socket.close();
            return;
        }
        socket.isAlive = true;

        // Append the new user to socketList.
        if ( !socketList.hasOwnProperty(session.userID)) {
            const response = await db.Select(`SELECT service FROM users WHERE id = ${session.userID}`);

            if (response.err) {
                console.log(response.err);
                socket.close();
                return;
            }
            // Create a new user instance
            socketList[session.userID] = new User(session.userID, response.data[0].service);
        }

        // Delete the previous socket associated with the current login session.
        if (socketList[session.userID].sockets.hasOwnProperty(session.sessionID)) {
            socketList[session.userID].sockets[session.sessionID].terminate();
            socketList[session.userID].sockets[session.sessionID] = socket;
            // removeSocketFromList(session.userID, session.sessionID);
        }
        // Register the new socket session into socketList.
        socketList[session.userID].sockets[session.sessionID] = socket;

        // Keep the connection alive.
        socket.on('pong', () => {
            socket.isAlive = true;
        });

        // Receive data (not used for the moment)
        socket.on('message', (data) => {
            console.log(message);
        });

    /*    socket.on('disconnect', () => {
            console.log('disconnect');
        });

        socket.on('close', function(reasonCode, description) {
                console.log('close')
            });*/
    });

    const interval = setInterval(checkSocketConnections, 30000);

    socketServer.on('close', function(reasonCode, description) {
        clearInterval(interval);
    });
}

/**
 * Sends a ping to every sockets to check if connections are still alive.
 */
function checkSocketConnections() {
    for (const userID in socketList) {
        for (const sessionID in socketList[userID].sockets) {
            socketList[userID].sockets[sessionID].isAlive = false;
            socketList[userID].sockets[sessionID].ping();
        }
    }
    setTimeout(checkSocketPongs, 500);
}

/**
 * Check if connection is closed on every sockets by detecting timeouts.
 */
function checkSocketPongs() {
    for (const userID in socketList) {
        for (const sessionID in socketList[userID].sockets) {
            if ( !socketList[userID].sockets[sessionID].isAlive) {
                socketList[userID].sockets[sessionID].terminate();
                removeSocketFromList(userID, sessionID);
            }
        }
    }
}

/**
 * Remove a socket and user (if possible) from {socketList}
 * @param {int} userID - user ID
 * @param {int} sessionID - session ID
 */
function removeSocketFromList(userID, sessionID) {

    if ( !socketList.hasOwnProperty(userID) || !socketList[userID].sockets.hasOwnProperty(sessionID))
        return;
    delete socketList[userID].sockets[sessionID];

    if (Object.keys(socketList[userID].sockets).length === 0)
        delete socketList[userID];
}

/**
 * Emit a message/event to one or several websocket clients
 * @param {Http.Request} req - user ID
 * @param {string} type - Event type (new / update / delete)
 * @param {string} ressource - see {ressourceNames}
 * @param {object} identifiers - target ressource ({ id: 1, service: 4 } / null)
 * @param {object} data - any-value / {} / [] / null
 * @param {array} receivers - specify target users to send the message to (null / [userID])
 * @param {boolean} excludeSelf - prevent the message to be sent back to the current user session
 */
async function sendMessage(req, type, ressource, identifiers, data, receivers, excludeSelf = true) {
    let creator;

    if (req) {
        const session = await utils.GetSessionInfo(req);

        if ( !session) {
            console.log('websocket - invalid session');
            return;
        }
        const response = await db.Select(`SELECT firstname, lastname FROM users WHERE id = ${session.userID}`);

        if (response.err) {
            console.log(response.err);
            return;
        }
        creator = {
            userID: session.userID,
            sessionID: session.sessionID,
            name: response.data[0].firstname + ' ' + response.data[0].lastname
        };
    }

    if (type === 'new' && identifiers.id)
        data.id = identifiers.id;
    sendRawMessage(creator, type, ressource, identifiers, data, receivers, excludeSelf);
}

/**
 * Emit a message/event to one or several websocket clients
 * @param {object} creator - Information about the sender ({ userID: 1, sessionID: '0000-0000-0000-000000' / null } / null)
 * @param {string} type - Event type (new / update / delete)
 * @param {string} ressource - see {ressourceNames}
 * @param {object} identifiers - target ressource ({ id: 1, service: 4 } / null)
 * @param {object} data - any-value / {} / [] / null
 * @param {array} receivers - specify target users to send the message to (null / [userID])
 * @param {boolean} excludeSelf - prevent the message to be sent back to the current user session
 */
function sendRawMessage(creator, type, ressource, identifiers, data, receivers, excludeSelf = true) {
    const message = JSON.stringify({
        creator: creator,
        type: type,
        ressource: ressource,
        identifiers: identifiers,
        data: data
    });

    if ( !creator)
        excludeSelf = false;
    // emit
    for (const userID in socketList) {
        if (!receivers || receivers.length === 0 || receivers.indexOf(parseInt(userID)) !== -1) {
            for (const sessionID in socketList[userID].sockets) {
                if (((excludeSelf && creator && (userID != creator.userID || sessionID != creator.sessionID)) || !excludeSelf) && (!identifiers || !identifiers.hasOwnProperty('service') || identifiers.service == socketList[userID].service)) {
                    socketList[userID].sockets[sessionID].send(message);
                }
            }
        }
    }
}

module.exports = {
    init: init,
    sendMessage: sendMessage
}
