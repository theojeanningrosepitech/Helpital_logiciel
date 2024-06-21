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
    const all_patients = await db.Select(`select * from patients`);

    if (all_users.err || all_note.err || all_patients.err || all_messages.err || all_conversations.err || all_roles.err || my_user.err)
        res.status(500).send("Erreur Serveur /api/note/note.js");

    const response = {
        all_patients: all_patients,
    };

    res.send(response);
});

router.get('/', async function (req, res, next) {

    const all_patients = await db.Select(`select * from patients`);
    let where = [];

    if (req.query.id)
        where.push('id = ' + req.query.id);
    else {
        if (req.query.service_id)
            where.push('service_id = ' + req.query.service_id);
        if (req.query.floor)
            where.push('floor = ' + req.query.floor);
    }
    let query = 'SELECT * FROM rooms WHERE type == 5';

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
    return utils.PostController(req, res, 'rooms');
});

router.put('/', function (req, res) {
    return utils.PutController(req, res, 'rooms');
});

router.delete('/', async function (req, res) {
    return utils.DeleteController(req, res, 'rooms');
});

module.exports = router;