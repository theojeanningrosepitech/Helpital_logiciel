#!/usr/bin/env node
/**
 * @file Create a server using http module.
 * @author Arnaud Lubert <arnaud.lubert@epitech.eu>
 * @author Emmanuel Lena <emmanuel.lena@epitech.eu>
 * @version 2.0
 */

/** Server module used to run Helpital's server.
 * @module server
 * @requires app.js
 * @requires debug
 * @requires http
 * @requires websocket
 */
var app = require('../app');
var debug = require('debug')('test:server');
var http = require('http');
var websocket = require('./websocket');

/**
 * Get port from environment and store in Express.
 * @constant
 * @default 3000
 */
var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server from http module.
 * @constant
 */
var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 *
 */
function run() {
    server.listen(port);
    console.log('Server listening to port ' + port)
    server.on('error', onError);
    server.on('listening', onListening);
}

/**
 * Normalize a port into a number, string, or false.
 * @param {number} val - the port value to normalize
 * @example <caption>Example usage of normalizePort</caption>
 * normalizePort(3000);
 * // returns 3000
 * @returns {number|boolean} normalized port or false if it failed to determine a port.
 */
function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        return val;
    }

    if (port >= 0) {
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 * @param {Error} error - error that occurred
 */
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}

websocket.init(server);
run()
