var express = require('express');
var router = express.Router();
const db = require('../../../database');
const axios = require("axios");
const middlewares = require('../../../utils');

// router.use goal is for manage user access to route
// router.use('/', async function (req, res, next) {
//     await middlewares.RoleMiddleware(req.cookies.userId, res, next);
// });

/**
 * @swagger
 * /api/log/service:
 *   get:
 *     tags:
 *      - log api
 *     summary: Get list of log in service
 *     responses:
 *       200:
 *         description: A JSON array containing a list of all log service.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/', async function (req, res, next) {
    let response;

    if (req.query.id && req.query.id != 1)
        response = await db.Select(`SELECT * FROM log_service WHERE service = ${req.query.id}`);
    else
        response = await db.Select(`SELECT * FROM log_service`);
    if (response.err)
        res.sendStatus(500).send(response.err);
    else
        res.send(response.data);
});

/**
 * @swagger
 * /api/log/service:
 *   post:
 *     tags:
 *      - conversations api
 *     summary: Add a logs in service on the table log_service list
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               service:
 *                 type: integer
 *                 example: 2
 *               done_by:
 *                  type: interger
 *                  example: 10
 *               for_him:
 *                  type: interger
 *                  example: 10
 *               content:
 *                  type: text
 *                  example: a creé le groupe + name + le
 *     responses:
 *       200:
 *         description: A JSON array containing information about the log service.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.post('/', async function (req, res, next) {
    const service = req.body.service;
    const done_by = req.body.done_by;
    const for_him = req.body.for_him;
    const content = req.body.content;
    const send_at = new Date();
    let result;

    if (req.body.done_by == null || req.body.done_by == "null") {
        result = await db.InsertData('log_service', {
            service: service,
            for_him: for_him,
            content: content,
            send_at: middlewares.FormatSqlDate(send_at)
        });
    } else {
        result = await db.InsertData('log_service', {
            service: service,
            done_by: done_by,
            for_him: for_him,
            content: content,
            send_at: middlewares.FormatSqlDate(send_at)
        });
    }
    // result = await db.Insert(`INSERT INTO log_service (service, done_by, for_him, content, send_at) VALUES (${service}, ${done_by}, ${for_him}, '${content}', '${middlewares.FormatSqlDate(send_at)}')`);
    if (result.err)
        res.status(500).json({error: result.err})
});

module.exports = router;
