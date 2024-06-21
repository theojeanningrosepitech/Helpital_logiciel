var express = require('express');
var router = express.Router();
const middlewares = require('../../utils');
const utils = require('../../utils');
const db = require('../../database');
const websocket = require('../../websocket');


/**
 * @swagger
 * /api/preferences:
 *   get:
 *     tags:
 *       - preferences api
 *     summary: Get the currently connected user preferences
 *     parameters:
 *      - in: query
 *        name: Cookie sessionID
 *        schema:
 *          type: string
 *        description: session ID
 *        example: BdKLj3RGiD67F4kOF4
 *     responses:
 *       200:
 *         description: A JSON object containing all user preferences.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/', async function (req, res, next) {
    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('No session could be found.');
        return;
    }
    const response = await db.Select(`SELECT id, prefered_theme, service, prefered_floor, accessibility, favorite_pages FROM users WHERE id = '${userID}' LIMIT 1`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length === 0) {
        res.status(401).send('No user could be found');
        return;
    }
    response.data[0].favorite_pages = (response.data[0].favorite_pages) ? response.data[0].favorite_pages.split(',') : [];

    res.status(200).send(response.data[0]);
});


/**
 * @swagger
 * /api/preferences:
 *   put:
 *     tags:
 *       - preferences api
 *     summary: Change the currently connected user preferences
 *     parameters:
 *      - in: query
 *        name: Cookie sessionID
 *        schema:
 *          type: string
 *        description: session ID
 *        example: BdKLj3RGiD67F4kOF4
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prefered_theme:
 *                 type: integer
 *                 example: 0
 *               service:
 *                 type: integer
 *                 example: 1
 *               prefered_floor:
 *                 type: integer
 *                 example: 0
 *               accessibility:
 *                 type: boolean
 *                 example: false
 *               favorite_pages:
 *                 type: string
 *                 example: page1,page2,page3
 *               filter:
 *                  type: integer
 *                  example: 1
 *     responses:
 *       200:
 *         description: Data successfully modified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   example: Row updated
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.put('/', async function(req, res) {
    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('No session could be found.');
        return;
    }

    const data = {
        prefered_theme: req.body.prefered_theme,
        service: req.body.service,
        prefered_floor: req.body.prefered_floor,
        accessibility: req.body.accessibility,
        favorite_pages: req.body.favorite_pages,
        filter: req.body.filter
    };
    const response = await db.UpdateData('users', userID, data);

    if (response.err) {
        if (response.err == "Missing data") {
            res.status(400).json({ error: "Empty statement" });
            return;
        } else if (response.err == "Missing id") {
            res.status(400).json({ error: "\'id'\ is missing" });
            return;
        } else {
            res.status(500).send(response.err);
            return;
        }
    } else
        res.status(200).json({ response: 'Row updated' });
    websocket.sendMessage(req, 'update', 'user', { id: userID }, data, null);
});

module.exports = router;
