var express = require('express');
var router = express.Router();
const db = require('../../database');
const utils = require('../../utils');
const crypto = require("crypto");
const axios = require("axios");
const middlewares = require('../../middlewares');
const websocket = require('../../websocket');

// router.use goal is for manage user access to route
/*router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});
*/

/**
 * @swagger
 * /api/contacts:
 *   get:
 *     tags:
 *       - contacts api
 *     summary: Get a list of contacts (directory)
 *     parameters:
 *      - in: query
 *        name: Cookie sessionID
 *        schema:
 *          type: string
 *        description: session ID
 *        example: BdKLj3RGiD67F4kOF4
 *     responses:
 *       200:
 *         description: A JSON array containing a list of all contacts (directory) of a currently connected user.
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
    let contacts, users;

    if (req.query.id) {
        contacts = await db.Select(`SELECT * FROM contacts WHERE id = ${req.query.id}`);

        if (contacts.err) {
            res.status(500).send(contacts.err);
            return;
        }
        users = await  db.Select(`SELECT id, login, user_role, service, avatar, firstname, lastname, phone, email FROM users WHERE id IN (SELECT contact_user_id FROM contacts WHERE id = ${req.query.id})`);
    } else {
        const userID = await utils.GetUserIdFromSession(req);

        if (userID === -1) {
            res.status(401).send('Session not valid');
            return;
        }
        contacts = await  db.Select(`SELECT * FROM contacts WHERE user_id = ${userID} ORDER BY created_at DESC`);

        if (contacts.err) {
            res.status(500).send(contacts.err);
            return;
        }
        users = await  db.Select(`SELECT id, login, user_role, service, avatar, firstname, lastname, phone, email FROM users WHERE id IN (SELECT contact_user_id FROM contacts WHERE user_id = ${userID})`);
    }

    if (users.err) {
        res.status(500).send(users.err);
        return;
    }
    let data = [];

    for (let i = 0; i !== contacts.data.length; i++) {
        for (let j = 0; j !== users.data.length; j++) {
            if (contacts.data[i].contact_user_id === users.data[j].id) {
                data.push({...users.data[j], ...contacts.data[i] });
                break;
            }
        }
    }

    res.send(data);
});

/**
 * @swagger
 * /api/contacts:
 *   post:
 *     tags:
 *       - contacts api
 *     summary: Add a user to the current user's contact list
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
 *               user_id:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Contact successfully added
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
router.post('/', async function(req, res, next) {
    const contactUserID = req.body.user_id;
    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('Session not valid');
        return;
    }

    if ( !contactUserID || contactUserID === '') {
        res.status(400).send('missing parameters');
        return;
    }
    let result = await  db.Select(`SELECT id FROM contacts WHERE user_id = ${userID} AND contact_user_id = ${contactUserID}`);

    if (result.err) {
        res.status(500).send(result.err);
        return;
    }

    if (result.data.length !== 0 || userID == contactUserID) {
        res.status(409).send('Contact already exist');
        return;
    }
    const request = await  db.Select(`SELECT firstname, lastname FROM users WHERE id = ${contactUserID}`);

    if (request.err) {
        res.status(500).send(request.err);
        return;
    }

    const insertData = {
        user_id: userID,
        contact_user_id: contactUserID,
        name: request.data[0].firstname + ' ' + request.data[0].lastname,
        created_at: utils.FormatSqlDate(new Date())
    };
    result = await db.InsertData('contacts', insertData);

    if (result.err) {
        res.status(500).send(result.err);
        return;
    }
    res.send('Data inserted');
    websocket.sendMessage(req, 'new', 'contact', { id: result.data, userID: insertData.user_id }, insertData, [ userID ]);
});

/**
 * @swagger
 * /api/contacts/name:
 *   put:
 *     tags:
 *       - contacts api
 *     summary: Change the display name of a user's contact
 *     parameters:
 *      - in: query
 *        name: Cookie sessionID
 *        schema:
 *          type: string
 *        description: session ID
 *        example: BdKLj3RGiD67F4kOF4
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: user ID of the contact
 *        example: 2
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jojo the bro
 *     responses:
 *       200:
 *         description: Contact successfully modified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   example: Name updated
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.put('/name', async function(req, res) {
    const contactUserID = req.query.id;
    const name = req.body.name;
    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('Session not valid');
        return;
    }

    if ( !contactUserID || contactUserID === '' || !name || name === '') {
        res.status(400).send('missing parameters');
        return;
    }
    const request = await  db.Select(`SELECT id FROM contacts WHERE user_id = ${userID} AND contact_user_id = ${contactUserID}`);

    if (request.err) {
        res.status(500).send(request.err);
        return;
    }
    const updateData = { name: name };
    const result = await db.UpdateData('contacts', request.data[0].id, updateData);

    if (result.err) {
        res.status(500).json({ error: result.err });
        return;
    }
    res.status(200).json({ response: 'Name updated' });
    websocket.sendMessage(req, 'update', 'contact', { id: request.data[0].id, userID: userID }, updateData, [ userID ]);
})

router.put('/fav',async function(req, res) {
    const userID = await utils.GetUserIdFromSession(req);
    const id = req.query.id;
    const result = await db.UpdateData('contacts', id, {fav: req.body.fav});
    const updateData = {fav: req.body.fav};

    if (result.err) {
        res.status(500).json({error: result.err});
        return;
    }
    res.status(200).json({response: 'Event updated'});
    websocket.sendMessage(req, 'update', 'contact', { id: id, userID: userID }, updateData, [ userID ]);
});

/**
 * @swagger
 * /api/contacts:
 *   delete:
 *     tags:
 *       - contacts api
 *     summary: Remove a contact from the current user's contacts list
 *     parameters:
 *      - in: query
 *        name: Cookie sessionID
 *        schema:
 *          type: string
 *        description: session ID
 *        example: BdKLj3RGiD67F4kOF4
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: user ID of the contact to delete
 *        example: 2
 *     responses:
 *       200:
 *         description: Contact successfully modified
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
    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('Session not valid');
        return;
    }
    const result = await utils.DeleteController(req, res, 'contacts');

    if (result)
        websocket.sendMessage(req, 'delete', 'contact', { id: result.id, userID: userID }, null, [ userID ]);
});

module.exports = router;
