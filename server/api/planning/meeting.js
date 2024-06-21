var express = require('express');
var router = express.Router();
const db = require('../../database');
const websocket = require('../../websocket');
const utils = require('../../utils');
const axios = require("axios");

router.get('/', async function (req, res, next) {

    let where = [];

    if (req.query.id)
        where.push('id = ' + req.query.id);
    else {
        if (req.query.service_id)
            where.push('service_id = ' + req.query.service_id);
    }
    let query = 'SELECT * FROM MEETING';

    if (where.length != 0)
        query += ' WHERE ' + where.join(' AND ');

    let response = await db.Select(query + ";");

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }
    res.send(response.data);
});

router.post('/', async function (req, res) {
    const result = await utils.PostController(req, res, 'meeting');

    if (result)
        websocket.sendMessage(req, 'new', 'meeting', { id: result.id }, result.data, null);
});

router.put('/', async function (req, res) {
    const result = await utils.PutController(req, res, 'meeting');

    if (result)
        websocket.sendMessage(req, 'update', 'meeting', { id: result.id }, result.data, null);
});

router.delete('/', async function (req, res) {
    const result = await utils.DeleteController(req, res, 'meeting');

    if (result)
        websocket.sendMessage(req, 'delete', 'meeting', { id: result.id }, null, null);
});

module.exports = router;
