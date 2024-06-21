var express = require('express');
var router = express.Router();
const db = require('../../database');
const utils = require('../../utils');
const axios = require('axios');
const middlewares = require('../../middlewares');
const websocket = require('../../websocket');
const path = require('path');
const fs = require('fs');

/*router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});*/

/**
 * @swagger
 * /api/xrays:
 *   get:
 *     tags:
 *      - xrays api
 *     summary: Get a list of xrays
 *     parameters:
 *      - in: query
 *        name: Cookie sessionID
 *        schema:
 *          type: string
 *        description: session ID
 *        example: BdKLj3RGiD67F4kOF4
 *     responses:
 *       200:
 *         description: A JSON array containing a list of all xrays.
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

    if (req.query.id)
        where.push('id = ' + req.query.id);

    let query = 'SELECT * FROM xrays';

    if (where.length != 0)
        query += ' WHERE ' + where.join(' AND ');

    let response = await db.Select(query + ";");

    if (response.err) {
        res.send(response.err);
        return;
    }
    res.send(response.data);
});

/**
 * @swagger
 * /api/xrays:
 *   post:
 *     tags:
 *      - xrays api
 *     summary: Add a xray to the current xrays list
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               href:
 *                 type: string
 *                 example: /files/xrays/
 *               date:
 *                 type: string
 *                 example: 2000-07-19 12:00:00
 *               lastEdit:
 *                 type: string
 *                 example: 2000-07-19 12:00:00
 *     responses:
 *       200:
 *         description: Xray successfully added
 *         content:
 *           plain/text:
 *             example: Data inserted
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.post('/', async function (req, res, next) {
    const result = await utils.PostController(req, res, 'xrays');

    if (result)
        websocket.sendMessage(req, 'new', 'radiograph', { id: result.id }, result.data, null);
})

/**
 * @swagger
 * /api/xrays:
 *   put:
 *     tags:
 *      - xrays api
 *     summary: Change informations of a xray
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: xray ID of the xray
 *        example: 2
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               href:
 *                 type: string
 *                 example: /files/xrays/
 *               date:
 *                 type: string
 *                 example: 2000-07-19 12:00:00
 *               lastEdit:
 *                 type: string
 *                 example: 2000-07-19 12:00:00
 *     responses:
 *       200:
 *         description: Xray successfully modified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   example: Xray updated
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.put('/', async function(req, res) {
    const result = await utils.PutController(req, res, 'xrays');

    if (result)
        websocket.sendMessage(req, 'update', 'radiograph', { id: result.id }, result.data, null);
});

/**
 * @swagger
 * /api/xrays:
 *   delete:
 *     tags:
 *      - xrays api
 *     summary: Remove a xray from the current xrays list
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: xray ID of the xray to delete
 *        example: 2
 *     responses:
 *       200:
 *         description: Xray successfully modified
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
 *       500:
 *         description: Internal server error
 */
router.delete('/', async function(req, res) {
    const directoryPath = path.join(__dirname, '../../../public/xrays/');
    const xray = await axios.get(`${process.env.SERVER_ADDRESS}/api/xrays?id=${req.query.id}`, {header:{cookies:req.cookies}});

    fs.unlinkSync(directoryPath + xray.data[0].href);
/*    console.log("File deleted");

    console.log("QUERY: " + req.query.id);

    console.log(xray.data[0].href);
    console.log(xray.data);
*/
    const result = await utils.DeleteController(req, res, 'xrays');

    if (result)
        websocket.sendMessage(req, 'delete', 'radiograph', { id: result.id }, null, null);
});

module.exports = router;
