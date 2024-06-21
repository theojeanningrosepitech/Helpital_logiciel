const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../../database');
const middlewares = require('../../middlewares');
const websocket = require('../../websocket');
const utils = require('../../utils');

// router.use goal is for manage user access to route
/*router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 4, res, next);
});*/

/**
 * @swagger
 * /api/oauth2/email/{service}:
 *   get:
 *     tags:
 *       - oauth2 api
 *     summary: Get email address of the OAuth2 service connected user
 *     responses:
 *       200:
 *         description: A JSON array containing a list of inventory objects.
 *         content:
 *           plain/text:
 *             example: eip.helpital@gmail.com
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/email/:service', async function (req, res, next) {
    const service = req.params.service;

    if (!service || service === '') {
        res.sendStatus(404);
        return;
    }
    const response = await db.Select(`SELECT email FROM oauth2 WHERE service = '${service}' AND bearer != ''`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length === 0) {
        res.send('');
        return;
    }
    res.send(response.data[0].email);
});

/**
 * @swagger
 * /api/oauth2:
 *   put:
 *     tags:
 *       - oauth2 api
 *     summary: Modify an OAuth2 service data
 *     description: The request body can contain any field present in the inventory_types table of the database.
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: data ID to modify
 *        example: 1
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expiration:
 *                 type: timestamp
 *                 example: 2022-03-23 22:53:13
 *               service:
 *                 type: string
 *                 example: google
 *               email:
 *                 type: string
 *                 example: eip.helpital@gmail.com
 *               bearer:
 *                 type: string
 *                 example: hEOgu3ejskqvnzifvfi5aozfsv8nqkzenfnioe33Fzin2zicnoeiznfze95cAoie59
 *               refresh_token:
 *                 type: string
 *                 example: fhgu3ejskqvnzifvfi5aozfsv8nqkzenfnioe33Fzin2zicnoeiznfze95caoiefn
 *     responses:
 *       200:
 *         description: Data successfully modified.
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
    const result = await utils.PutController(req, res, 'oauth2');

    if (result)
        websocket.sendMessage(null, 'update', 'oauth2', { id: req.query.id }, { email: req.body.email }, null);
});


/**
 * @swagger
 * /api/oauth2:
 *   delete:
 *     tags:
 *       - oauth2 api
 *     summary: Disconnect a user from an OAuth2 service
 *     parameters:
 *      - in: query
 *        name: X-Service
 *        schema:
 *          type: string
 *        description: service
 *        example: google
 *     responses:
 *       200:
 *         description: Data successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   example: OAuth2 session deleted
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.delete('/', async function (req, res, next) {
    const service = req.get("X-Service");

    if (service == "") {
        res.sendStatus(404);
        return
    }
    let response = await db.Select(`SELECT id, refresh_token FROM oauth2 WHERE service = '${service}'`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length === 0) {
        res.sendStatus(404);
        return;
    }
    const oauth2sessionID = response.data[0].id;
    await requestRevokeOAuth2(Buffer.from(response.data[0].refresh_token, 'base64'))

    response = await db.UpdateData('oauth2', oauth2sessionID, {
        email: '',
        bearer: '',
        refresh_token: '',
        expiration: '1970-01-01'
    });

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }
    res.status(200).json({ response: 'OAuth2 session deleted' });
    websocket.sendMessage(req, 'delete', 'oauth2', { id: oauth2sessionID }, null, null, false);
});

/**
 * Revoke an OAuth2 refresh token to prevent hacking
 * @param {string} token - OAuth2 refresh token
 */
async function requestRevokeOAuth2(token) {
    try {
        const response = await axios.post(`https://oauth2.googleapis.com/revoke?token=${token}`, null, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            }
        });
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

module.exports = router;
