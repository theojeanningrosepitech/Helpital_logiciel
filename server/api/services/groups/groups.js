var express = require('express');
var router = express.Router();
const db = require('../../../database');
const websocket = require('../../../websocket');
const utils = require('../../../utils');
const axios = require("axios");
// const middlewares = require("../../../utils");
const {JSONStream} = require("mocha/lib/reporters");

// router.use goal is for manage user access to route
// router.use('/', async function (req, res, next) {
//     await middlewares.RoleMiddleware(req.cookies.userId, res, next);
// });

/**
 * @swagger
 * /api/groups:
 *   get:
 *     tags:
 *      - services groups api
 *     summary: Get a list of groups of all or 1 service(s)
 *     parameters:
 *      - in: query
 *        service_id: service id
 *        schema:
 *          type: integer
 *        description: ID of the service
 *        example: 2
 *     responses:
 *       200:
 *         description: A JSON array containing a list of groups of all or 1 service(s).
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

    if (req.query.service_id)
        response = await db.Select(`SELECT * FROM group_service WHERE service = ${req.query.service_id}`);
    else
        response = await db.Select(`SELECT * FROM group_service`);
    if (response.err)
        res.sendStatus(500).send(response.err);
    else
        res.send(response.data);
});

/**
 * @swagger
 * /api/groups:
 *   post:
 *     tags:
 *      - services groups api
 *     summary: Add a group in a service
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               service:
 *                 type: integer
 *                 example: 2
 *               chief:
 *                  type: integer
 *                  example: 2
 *               users_id:
 *                  type: string
 *                  example: 2,5,4
 *               name:
 *                  type: string
 *                  example: Les 4 fantastisque
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
router.post('/', async function(req, res, next) {
    const insertData = {
        service: req.body.service,
        chief: req.body.chief,
        users_id: req.body.users_id,
        name: req.body.name,
    };
    const response = await db.InsertData('group_service', insertData);

    if (response.err) {
        res.status(500).json({error: result.err});
        return;
    }
    res.sendStatus(201);
    websocket.sendMessage(req, 'new', 'service_group', { id: response.id }, insertData, null);
});

/**
 * @swagger
 * /api/groups/add-personal:
 *   put:
 *     tags:
 *      - services groups api
 *     summary: Add a user in the group
 *     parameters:
 *      - in: query
 *        id: id
 *        schema:
 *          type: integer
 *        description: ID of the group
 *        example: 2
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *                 example: 2,5
 *     responses:
 *       200:
 *         description: Group successfully modified
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
router.put('/add-personal', async function(req, res) {
    const id = req.query.id;
    const response = await db.Select(`SELECT * FROM group_service WHERE id = ${id}`);
    if (response.err)
        res.status(500).json({error: result.err});
    const users = req.body.users_id + ',' + response.data[0].users_id;
    const updateData = { users_id: users };
    const result = await db.UpdateData('group_service', id, updateData);

    if (result.err) {
        res.status(500).json({ error: result.err });
        return;
    }
    res.status(200).json({ response: 'Event updated' });
    websocket.sendMessage(req, 'update', 'service_group', { id: id }, updateData, null);
});

/**
 * @swagger
 * /api/groups/delete-personal:
 *   put:
 *     tags:
 *      - services groups api
 *     summary: Delete a user in the group
 *     parameters:
 *      - in: query
 *        id: id
 *        schema:
 *          type: integer
 *        description: ID of the group
 *        example: 2
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
 *         description: Group successfully modified
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
router.put('/delete-personal', async function(req, res) {
    const id = req.query.id;
    const response = await db.Select(`SELECT * FROM group_service WHERE id = ${id}`);
    if (response.err)
        res.status(500).json({error: result.err});
    const user = response.data[0].users_id.split(',');
    let new_user = [];

    for (let i = 0; user[i]; i++) {
        if (req.body.user_id != user[i])
            new_user.push(user[i]);
    }
    const updateData = { users_id: new_user.toString() };
    const result = await db.UpdateData('group_service', id, updateData);

    if (result.err) {
        res.status(500).json({ error: result.err });
        return;
    }
    res.status(200).json({ response: 'Event updated' });
    websocket.sendMessage(req, 'update', 'service_group', { id: id }, updateData, null);
});

/**
 * @swagger
 * /api/groups/update-name:
 *   put:
 *     tags:
 *      - services groups api
 *     summary: Update name of the group
 *     parameters:
 *      - in: query
 *        id: id
 *        schema:
 *          type: integer
 *        description: ID of the group
 *        example: 2
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Les 2 medecins
 *     responses:
 *       200:
 *         description: Group successfully modified
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
router.put('/update-name', async function(req, res) {
    const id = req.query.id;
    const name = req.body.name;
    const updateData = { name: name };
    const result = await db.UpdateData('group_service', id, updateData);

    if (result.err) {
        res.status(500).json({ error: result.err });
        return;
    }
    res.status(200).json({ response: 'Event updated' });
    websocket.sendMessage(req, 'update', 'service_group', { id: id }, updateData, null);
});

/**
 * @swagger
 * /api/groups:
 *   delete:
 *     tags:
 *      - services groups api
 *     summary: Delete a group
 *     parameters:
 *      - in: query
 *        id: id
 *        schema:
 *          type: integer
 *        description: ID of the group
 *        example: 2
 *     responses:
 *       200:
 *         description: Group successfully delete
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
router.delete('/', async function(req, res) {
    const result = await utils.DeleteController(req, res, 'group_service');

    if (result)
        websocket.sendMessage(req, 'delete', 'service_group', { id: result.id }, null, null);
});

module.exports = router;
