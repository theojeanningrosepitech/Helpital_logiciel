var express = require('express');
var router = express.Router();
const db = require('../../database');
const utils = require('../../utils');
const axios = require("axios");
const middlewares = require('../../middlewares');

/*router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});*/

router.get('/', async function (req, res, next) {
    let where = [];

    if (req.query.id)
        where.push('id = ' + req.query.id);

    let query = 'SELECT * FROM patient_files';

    if (where.length != 0)
        query += ' WHERE ' + where.join(' AND ');

    let response = await db.Select(query + ";");

    if (response.err) {
        res.send(response.err);
        return;
    }
    res.send(response.data);
});

router.post('/', function(req, res) {
    console.log("POST FILE PAT");
    console.log(req);
    console.log(res);
    return utils.PostController(req, res, 'patient_files');
});

router.put('/', function(req, res) {
    return utils.PutController(req, res, 'patient_files');
});

router.delete('/', async function(req, res) {
    return utils.DeleteController(req, res, 'patient_files');
});

module.exports = router;
