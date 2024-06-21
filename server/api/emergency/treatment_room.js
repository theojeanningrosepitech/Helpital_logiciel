var express = require('express');
var router = express.Router();
const db = require('../../database');
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
    let query = 'SELECT * FROM TREATMENT_ROOM';

    if (where.length != 0)
        query += ' WHERE ' + where.join(' AND ');

    let response = await db.Select(query + ";");

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }
    res.send(response.data);
});

router.post('/', function (req, res) {
    return utils.PostController(req, res, 'treatment_room');
});

router.put('/', function (req, res) {
    return utils.PutController(req, res, 'treatment_room');
});

router.delete('/', async function (req, res) {
    return utils.DeleteController(req, res, 'treatment_room');
});

module.exports = router;
