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
 * /api/inventory/types:
 *   get:
 *     tags:
 *       - inventory api
 *     summary: Get a list of all types of inventory objects
 *     description: Query parameters are optional, they are used to filter the search.
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: inventory type ID
 *        example: 1
 *      - in: query
 *        name: search
 *        schema:
 *          type: string
 *        description: search input
 *        example: inventory type name
 *     responses:
 *       200:
 *         description: A JSON array containing a list of inventory types.
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
    let query = 'SELECT * FROM inventory_types';

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
  * /api/inventory/types:
  *   post:
  *     tags:
  *       - inventory api
  *     summary: Create an inventory type
  *     requestBody:
  *       content:
  *         application/json:
  *           schema:
  *             type: object
  *             properties:
  *               name:
  *                 type: string
  *                 example: type_example
  *               display_name:
  *                 type: string
  *                 example: Type example
  *     responses:
  *       200:
  *         description: Type successfully created.
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 response:
  *                   type: string
  *                   example: Row deleted
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

    if (req.body.length === 0) {
        res.status(400).json({ error: "Empty statement" });
        return;
    }
    req.body.name = req.body.display_name.toLocaleLowerCase().replaceAll(' ', '_');
    const response = await db.InsertData('inventory_types', req.body);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }
    res.status(200).json({ response: 'Row created', id: response.data });
    websocket.sendMessage(req, 'new', 'inventory_type', { id: response.data }, req.body, null);
});

/**
 * @swagger
 * /api/inventory/types:
 *   put:
 *     tags:
 *       - inventory api
 *     summary: Modify an inventory type
 *     description: The request body can contain any field present in the inventory_types table of the database.
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: type ID to modify
 *        example: 1
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: type_example
 *               display_name:
 *                 type: string
 *                 example: Type example
 *     responses:
 *       200:
 *         description: Type successfully modified.
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
    const result = await utils.PutController(req, res, 'inventory_types');

    if (result)
        websocket.sendMessage(req, 'update', 'inventory_type', { id: result.id }, result.data, null);
});


/**
 * @swagger
 * /api/inventory/types:
 *   delete:
 *     tags:
 *       - inventory api
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
 *         description: Type cannot be deleted, it is used by an inventory object
 *       500:
 *         description: Internal server error
 */
router.delete('/', async function(req, res) {

    if (!req.query.id) {
        res.status(400).json({ error: "\'id'\ is missing" });
        return;
    }

    // check if type is used
    const response = await db.Select(`SELECT COUNT(1) FROM inventory WHERE type = ${req.query.id}`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data[0].count !== '0') {
        res.status(409).send('Operation refused, this room category is used by a room.');
        return;
    }
    const result = await utils.DeleteController(req, res, 'inventory_types');

    if (result)
        websocket.sendMessage(req, 'delete', 'inventory_type', { id: result.id }, null, null);
});

module.exports = router;
