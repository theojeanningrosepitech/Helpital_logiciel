var express = require('express');
var router = express.Router();
const db = require('../../database');
const utils = require('../../utils');
const axios = require("axios");
const middlewares = require('../../middlewares');
const websocket = require('../../websocket');

/*router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});*/

/**
 * @swagger
 * /api/services:
 *   get:
 *     tags:
 *      - services api
 *     summary: Get a list of 1 service or all services
 *     parameters:
 *      - in: query
 *        search: search
 *        schema:
 *          type: string
 *        description: Title of service
 *        example: Radiologie
 *      - in: query
 *        id: id
 *        schema:
 *          type: integer
 *        description: ID of the service
 *        example: 2
 *     responses:
 *       200:
 *         description: A JSON array containing a list of 1 service or all services.
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
    let where = [];

    // add where clauses
    if (req && req.query.id)
        where.push('id = ' + req.query.id);
    else if (req && req.query.search)
        where.push('title LIKE E\'%' + db.EscapeQuote(req.query.search) + '%\'');
    let query = 'SELECT * FROM services';

    if (where.length != 0)
        query += ' WHERE ' + where.join(' AND ');

    const response = await db.Select(query);

    if (response.err)
        res.status(500).send(response.err);
    res.send(response.data);
});

/**
 * @swagger
 * /api/services/list:
 *   get:
 *     tags:
 *      - services api
 *     summary: Get a list of all services
 *     responses:
 *       200:
 *         description: A JSON array containing a list of all services.
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
router.get('/list', async function (req, res, next) {
    const response = await db.Select('SELECT * FROM services');

    if (response.err)
        res.status(500).send(response.err);
    res.send(response.data);
});

/**
 * @swagger
 * /api/services:
 *   post:
 *     tags:
 *      - services api
 *     summary: Add a service at the list
 *     responses:
 *       200:
 *         description: A JSON array containing a list of all services.
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
router.post('/', async function(req, res) {
    const result = await utils.PostController(req, res, 'services');

    if (result)
        websocket.sendMessage(req, 'new', 'service', { id: result.id }, result.data, null);
});

/**
 * @swagger
 * /api/services:
 *   put:
 *     tags:
 *      - services api
 *     summary: Update service
 *     responses:
 *       200:
 *         description: A JSON array containing a list of all services.
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
router.put('/', async function(req, res) {
    const result = await utils.PutController(req, res, 'services');

    if (result)
        websocket.sendMessage(req, 'update', 'service', { id: result.id }, result.data, null);
});

/**
 * @swagger
 * /api/services:
 *   delete:
 *     tags:
 *      - services api
 *     summary: Delete service
 *     responses:
 *       200:
 *         description: A JSON array containing a list of all services.
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
router.delete('/', async function(req, res) {
    const result = await utils.DeleteController(req, res, 'services');

    if (result)
        websocket.sendMessage(req, 'delete', 'service', { id: result.id }, null, null);
});

module.exports = router;
