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
 * /api/rooms/types:
 *   get:
 *     tags:
 *       - rooms api
 *     summary: Get a list of all types of rooms
 *     description: Query parameters are optional, they are used to filter the search.
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: type ID
 *        example: 1
 *      - in: query
 *        name: display_name
 *        schema:
 *          type: string
 *        description: search input
 *        example: room type name
 *     responses:
 *       200:
 *         description: A JSON array containing a list of room types.
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
        where.push('display_name LIKE E\'%' + db.EscapeQuote(req.query.search) + '%\'');
    let query = 'SELECT * FROM rooms_types';

    if (where.length != 0)
        query += ' WHERE ' + where.join(' AND ');
    let response = await db.Select(query);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }
    res.send(response.data);
});

/**
  * @swagger
  * /api/rooms/types:
  *   post:
  *     tags:
  *       - rooms api
  *     summary: Create a room type
  *     requestBody:
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               display_name:
  *                 type: string
  *                 example: Surgery
  *     responses:
  *       200:
  *         description: Room type successfully created.
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 response:
  *                   type: string
  *                   example: Row created
  *                 id:
  *                   type: integer
  *                   example: 2
  *       400:
  *         description: Bad parameters
  *       401:
  *         description: Bad credentials
  *       500:
  *         description: Internal server error
  */
router.post('/', async function(req, res) {
    const result = await utils.PostController(req, res, 'rooms_types');

    if (result)
        websocket.sendMessage(req, 'new', 'room_type', { id: result.id }, result.data, null);
});

/**
 * @swagger
 * /api/rooms/types:
 *   put:
 *     tags:
 *       - rooms api
 *     summary: Modify a room type
 *     description: The request body can contain any field present in the rooms table of the database.
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: object ID to modify
 *        example: 1
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               display_name:
 *                 type: string
 *                 example: Surgery
 *     responses:
 *       200:
 *         description: Room type successfully modified.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: data ID
 *                 data:
 *                   type: object
 *                   example: {modified_field: value}
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.put('/', async function(req, res) {
    const result = await utils.PutController(req, res, 'rooms_types');

    if (result)
        websocket.sendMessage(req, 'update', 'room_type', { id: result.id }, result.data, null);
});


/**
 * @swagger
 * /api/inventory/types:
 *   delete:
 *     tags:
 *       - rooms api
 *     summary: Delete an inventory type
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: type ID to delete
 *        example: 1
 *     responses:
 *       200:
 *         description: Type successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   example: Row deleted
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       409:
 *         description: Type cannot be deleted, it is used by a room
 *       500:
 *         description: Internal server error
 */
router.delete('/', async function(req, res) {

    if (!req.query.id) {
        res.status(400).json({ error: "\'id'\ is missing" });
        return;
    }

    // check if type is used
    const response = await db.Select(`SELECT COUNT(1) FROM rooms WHERE type = ${req.query.id}`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data[0].count !== '0') {
        res.status(409).send('Operation refused, this room category is used by a room.');
        return;
    }
    const result = await utils.DeleteController(req, res, 'rooms_types');

    if (result)
        websocket.sendMessage(req, 'delete', 'room_type', { id: result.id }, null, null);
});

module.exports = router;
