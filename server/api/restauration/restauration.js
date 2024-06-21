var express = require('express');
var router = express.Router();
const db = require('../../database');
const utils = require('../../utils');

router.get('/', async function (req, res, next) {
    const response = await db.Select(`select * from restaurants`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    } else
        res.send(response);
});

router.get('/relais_h', async function (req, res, next) {
    const response = await db.Select(`select * from menu_relais_h`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }
    res.send(response);
});

router.get('/medirest', async function (req, res, next) {
    const response = await db.Select(`select * from menu_medirest`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }
    res.send(response);
});

router.get('/helpifood', async function (req, res, next) {
    const response = await db.Select(`select * from menu_helpifood`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }
    res.send(response);
});

module.exports = router;
