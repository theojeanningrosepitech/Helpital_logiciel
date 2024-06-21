var express = require('express');
var router = express.Router();
const db = require('../../database');
const utils = require('../../utils');
const axios = require("axios");
const middlewares = require("../../middlewares");

// router.use goal is for manage user access to route
// router.use('/', async function (req, res, next) {
//     await middlewares.RoleMiddleware(req.cookies.userId, res, next);
// });

router.get('/:id', async function (req, res, next) {
    const response = await db.Select(`select * from notifications where user_id = ${req.params.id}`);

    if (response.err)
        res.status(500).send(response.err);
    res.send(response.data);
});


router.delete('/:id', async function (req, res, next) {
    const response = await db.Select(`delete from notifications where id = ${req.params.id}`);

    if (response.err)
        res.status(500).send(response.err);
    res.send(response.data);
});

module.exports = router;