var express = require('express');
var router = express.Router();
const db = require('../../database');
const utils = require('../../utils');

router.get('/', async function (req, res, next) {
    let where = [];

    if (req.query.id)
        where.push(`id = ${req.query.id}`);
    let query = 'SELECT id, title, status, created_at FROM orders';

    if (where.length !== 0) {
        query += ' WHERE ' + where.join(' AND ');
    }
    const response = await db.Select(query + ' ORDER BY status, title ASC');

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }
    res.send(response.data);
});

router.post('/', async function(req, res, next) {
    await utils.PostController(req, res, 'orders');
});

router.put('/', async function(req, res) {
    await utils.PutController(req, res, 'orders');
});

router.delete('/', async function(req, res) {
    await utils.DeleteController(req, res, 'orders');
});

module.exports = router;
