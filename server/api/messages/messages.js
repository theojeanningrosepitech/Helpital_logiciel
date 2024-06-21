var express = require('express');
var router = express.Router();
const db = require('../../database');
const axios = require("axios");
const middlewares = require('../../middlewares');
const {FormatSqlDate} = require("../../utils");
const websocket = require("../../websocket");

/*
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});*/

/**
 * @swagger
 * /api/messages:
 *    get:
 *     tags:
 *      - messages api
 *     summary: Get a list of 1 messages or all message of 1 conversation or all messages
 *     parameters:
 *      - in: query
 *        id_conv: id conv
 *        schema:
 *          type: integer
 *        description: ID of the conversation
 *        example: 2
 *      - in: query
 *        id: id
 *        schema:
 *          type: integer
 *        description: ID of the message
 *        example: 2
 *     responses:
 *       200:
 *         description: A JSON array containing a list of 1 conversation or all conversations of 1 user or all conversations.
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
router.get('/', async function (req, res) {
    let messages;

    if (req.query.id)
        messages = await db.Select(`SELECT * FROM msg WHERE id = ${req.query.id}`)
    else if (req.query.id_conv)
        messages = await db.Select(`SELECT * FROM msg WHERE conversation_id = ${req.query.id_conv}`)
    else
        messages = await db.Select(`SELECT * FROM msg`);
    if (messages.err)
        res.status(500).send(messages.err);
    messages.data.sort((a, b) => (a.id > b.id) ? 1 : -1);
    res.send(messages.data);
});

/**
 * @swagger
 * /api/messages/state:
 *    get:
 *     tags:
 *      - messages api
 *     summary: Get state of the message
 *     parameters:
 *      - in: query
 *        id_msg: id message
 *        schema:
 *          type: integer
 *        description: ID of the message
 *        example: 2
 *     responses:
 *       200:
 *         description: A JSON array containing a state and id conversation of the message.
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
router.get('/state', async function (req, res) {
    let messages;

    if (req.query.id_msg)
        messages = await db.Select(`SELECT state, conversation_id FROM msg WHERE id = ${req.query.id_msg}`);
    if (messages.err)
        res.status(500).send(messages.err);
    res.status(201).send(messages.data[0]);
});

/**
 * @swagger
 * /api/messages/message:
 *   post:
 *     tags:
 *      - messages api
 *     summary: Add a message in the messages list
 *     parameters:
 *      - in: query
 *        my_id: my id
 *        schema:
 *          type: integer
 *        description: ID of the sender
 *        example: 2
 *      - in: query
 *        users_id: users id
 *        schema:
 *          type: string
 *        description: ID of the users receiver
 *        example: 2,5,6
 *      - in: query
 *        conv_id: conv id
 *        schema:
 *          type: integer
 *        description: ID of the conversation
 *        example: 2
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: Salut ça va ?
 *               content_filter:
 *                 type: string
 *                 example: Salut ça va ** ?
 *               file_name:
 *                  type: string
 *                  example: chien.png
 *               file:
 *                  type: string
 *                  example: png
 *               emergency:
 *                  type: integer
 *                  example: 1
 *               group_msg:
 *                  type: integer
 *                  example: 1
 *     responses:
 *       200:
 *         description: A JSON array containing information about the new message.
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
router.post('/message', async function(req, res, next) {
    const content = req.body.content;
    const content_filter = req.body.content_filter
    const myUser = req.query.my_id;
    const users = req.query.users_id;
    const convId = req.query.conv_id;
    const fileName = req.body.file_name;
    const file = req.body.file;
    const emergency = req.body.emergency_btn;
    const expiresAt = new Date();
    const state = null;
    const group_msg = req.body.group_msg;
    const insertData = {
        conversation_id: convId,
        content: content,
        content_filter: content_filter,
        file: file,
        file_name: fileName,
        emergency: emergency,
        send_at: FormatSqlDate(expiresAt),
        sender_id: myUser,
        receiver_id: users,
        state: state,
        group_msg: group_msg
    };
    const result = await db.InsertData('msg', insertData);

    if (result.err) {
        res.status(500).json({error: result.err});
        return;
    }
    res.status(200).json({message: 'message send', id: result.data});

    const receivers = users.split(',').map((id) => {
        return parseInt(id)
    });
    websocket.sendMessage(req, 'new', 'message', { id: result.data }, insertData, receivers);
});

/**
 * @swagger
 * /api/messages:
 *   put:
 *     tags:
 *      - messages api
 *     summary: Change the state of the message
 *     parameters:
 *      - in: query
 *        id: id
 *        schema:
 *          type: integer
 *        description: ID of the message
 *        example: 2
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               state:
 *                 type: string
 *                 example: 2,5
 *     responses:
 *       200:
 *         description: Messages successfully modified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   example: Event updated
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.put('/', async function(req, res) {
    const id = req.query.id;
    const state = req.body.state;
    const result = await db.UpdateData('msg', id, {state: state});

    if (result.err) {
        res.status(500).json({error: result.err});
        return;
    }
    res.status(200).json({response: 'Event updated'});
})

/**
 * @swagger
 * /api/messages/delete:
 *   put:
 *     tags:
 *      - messages api
 *     summary: Change the del_msg of the message
 *     parameters:
 *      - in: query
 *        id: id
 *        schema:
 *          type: integer
 *        description: ID of the message
 *        example: 2
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               del_msg:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Messages successfully modified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   example: Event updated
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.put('/delete', async function(req, res) {
    const id = req.query.id;
    const del_msg = req.body.del_msg;
    const result = await db.UpdateData('msg', id, {del_msg: del_msg});

    if (result.err) {
        res.status(500).json({error: result.err});
        return;
    }
    res.status(200).json({response: 'Event updated'});
})

module.exports = router;
