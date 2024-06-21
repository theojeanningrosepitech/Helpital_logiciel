var express = require('express');
var router = express.Router();
const db = require('../../database');
const {FormatSqlDate} = require("../../utils");
const axios = require("axios");
const middlewares = require('../../middlewares');
// const websocket = require("../../websocket");
const utils = require("../../utils");
const {response} = require("express");

/*
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});*/

/**
 * @swagger
 * /api/conversations:
 *    get:
 *     tags:
 *      - conversations api
 *     summary: Get a list of 1 conversation or all conversations of 1 user or all conversations
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
 *        description: ID of the user
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
    let conversations;
    let split;
    let id_conv = [];
    let add_conv = {data: []};

    if (req.query.id_conv) {
        conversations = await db.Select(`SELECT * FROM conversation WHERE id = ${req.query.id_conv}`);
        if (conversations.err) {
            res.status(500).send(conversations.err);
            return;
        }
    } else if (req.query.id) {
        all_conversations = await db.Select(`SELECT * FROM conversation`);
        if (all_conversations.err) {
            res.status(500).send(all_conversations.err);
            return;
        }
        for (let i = 0; all_conversations.data[i]; i++) {
            split = all_conversations.data[i].user_id.split(',');
            for (let y = 0; split[y]; y++) {
                if (split[y] == req.query.id)
                    id_conv.push(all_conversations.data[i].id);
            }
        }
        for (let i = 0; id_conv[i]; i++) {
            conversations = await db.Select(`SELECT * FROM conversation WHERE id = ${id_conv[i]}`);
            if (conversations.err) {
                res.status(500).send(conversations.err);
                return;
            }
            add_conv.data.push(conversations.data[0]);
        }
        conversations = add_conv;
    } else {
        conversations = await db.Select(`SELECT * FROM conversation`);
        if (conversations.err)
            res.status(500).send(conversations.err);
            return;
    }
    res.send(conversations.data);
});

/**
 * @swagger
 * /api/conversations/all_conv:
 *    get:
 *     tags:
 *      - conversations api
 *     summary: Get a list of 1 conversation or all conversations of 1 user or all conversations
 *     responses:
 *       200:
 *         description: A JSON array containing a list of all conversations.
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
router.get('/all_conv', async function (req, res) {
    const conversations = await db.Select(`SELECT * FROM conversation`);

    if (conversations.err) {
        res.status(500).send(conversations.err);
        return;
    }
    res.send(conversations.data);
});

/**
 * @swagger
 * /api/conversations/conversation:
 *   post:
 *     tags:
 *      - conversations api
 *     summary: Add a conversation between a user in the conversations list
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *                 example: 2,5
 *               title:
 *                  type: string
 *                  example: Anniv 20 ans
 *     responses:
 *       200:
 *         description: A JSON array containing information about the new conversation.
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
router.post('/conversation', async function(req, res) {
    let y = 0;
    let count = 0;
    const insertData = {
        user_id: req.body.user_id,
        title: req.body.title,
        group_conv: req.body.group_conv,
    };
    const check = await db.Select(`SELECT * FROM conversation WHERE user_id = '${req.body.user_id}'`);

    if (check.data.length == 0) {
        const result = await db.InsertData('conversation', insertData);
        if (result.err)
            res.status(500).json({error: result.err})
        else
            res.status(201).json({message: 'Conversation create', id: result.data})
    } else {
        for (let i = 0; check.data[i]; i++) {
            if (check.data[i].group_conv == 0) {
                y = i;
                count = 1;
                break;
            }
        }
        if (count == 1)
            res.status(201).json({message: 'already create', id: check.data[y].id})
        else {
            const result = await db.InsertData('conversation', insertData);
            if (result.err)
                res.status(500).json({error: result.err})
            else
                res.status(201).json({message: 'Conversation create', id: result.data})
        }
    }
});

/**
 * @swagger
 * /api/conversations/notif:
 *   put:
 *     tags:
 *      - conversations api
 *     summary: Change notif in conversation
 *     parameters:
 *      - in: query
 *        id: id
 *        schema:
 *          type: integer
 *        description: ID conversation
 *        example: 2
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notif:
 *                 type: string
 *                 example: 1
 *     responses:
 *       200:
 *         description: Conversations successfully modified
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
router.put('/notif', async function(req, res) {
    const id = req.query.id;
    const check = await db.Select(`SELECT * FROM conversation WHERE id = ${req.query.id}`);
    let notif = req.body.notif;
    if (check.data[0].notif)
        notif += "," + check.data[0].notif
    const result = await db.UpdateData('conversation', id, {notif: notif});

    if (result.err) {
        res.status(500).json({error: result.err});
        return;
    }
    res.status(200).json({response: 'Event updated'});
})

/**
 * @swagger
 * /api/conversations/notif_state:
 *   put:
 *     tags:
 *      - conversations api
 *     summary: Change notif in conversation
 *     parameters:
 *      - in: query
 *        id: id
 *        schema:
 *          type: integer
 *        description: ID conversation
 *        example: 2
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notif:
 *                 type: string
 *                 example: 1
 *     responses:
 *       200:
 *         description: Conversations successfully modified
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
router.put('/notif_state', async function(req, res) {
    const id = req.query.id;
    const check = await db.Select(`SELECT * FROM conversation WHERE id = ${req.query.id}`);
    let notif = [];
    let split;
    if (check.data[0].notif)
        split = check.data[0].notif.split(',');
    if (split) {
        for (let i = 0; split[i]; i++) {
            if (split[i] != req.body.notif)
                notif.push(split[i]);
        }
    }
    const result = await db.UpdateData('conversation', id, {notif: notif.toString()});

    if (result.err) {
        res.status(500).json({error: result.err});
        return;
    }
    res.status(200).json({response: 'Event updated'});
})

router.put('/add_users', async function(req, res) {
    const id = req.query.id;
    const check = await db.Select(`SELECT * FROM conversation WHERE id = ${req.query.id}`);
    let user_id = req.body.user_id;
    if (check.data[0].user_id)
        user_id += "," + check.data[0].user_id
    const result = await db.UpdateData('conversation', id, {user_id: user_id});

    if (result.err) {
        res.status(500).json({error: result.err});
        return;
    }
    res.status(200).json({response: 'Event updated'});
})

router.put('/delete_user', async function(req, res) {
    const id = req.query.id;
    const check = await db.Select(`SELECT * FROM conversation WHERE id = ${req.query.id}`);
    let user_id = [];
    let split;
    if (check.data[0].user_id)
        split = check.data[0].user_id.split(',');
    if (split) {
        for (let i = 0; split[i]; i++) {
            if (split[i] != req.body.user_id)
                user_id.push(split[i]);
        }
    }
    const result = await db.UpdateData('conversation', id, {user_id: user_id.toString()});

    if (result.err) {
        res.status(500).json({error: result.err});
        return;
    }
    res.status(200).json({response: 'Event updated'});
})

router.delete('/', async function(req, res) {
    const result = await utils.DeleteController(req, res, 'conversation');
})

module.exports = router;