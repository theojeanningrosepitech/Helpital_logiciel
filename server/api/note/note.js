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
 * /api/note:
 *   get:
 *     tags:
 *      - note api
 *     summary: Get a list of patients
 *     parameters:
 *      - in: query
 *        name: Cookie sessionID
 *        schema:
 *          type: string
 *        description: session ID
 *        example: BdKLj3RGiD67F4kOF4
 *     responses:
 *       200:
 *         description: A JSON array containing a list of all note.
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

    const all_note = await db.Select(`select * from note`);
    const my_user = await db.Select(`select * from users WHERE id = ` + req.query.user_id);
    const all_users = await db.Select(`select * from users`);
    const all_messages = await db.Select(`select * from msg`);
    const all_conversations = await db.Select(`select * from conversation`);
    const all_roles = await db.Select(`select * from software_role`);
    const all_patients = await db.Select(`select * from patients`);

    if (all_users.err || all_note.err || all_patients.err || all_messages.err || all_conversations.err || all_roles.err || my_user.err)
        res.status(500).send("Erreur Serveur /api/note/note.js");

    const response = {
        all_note: all_note,
        all_users: all_users,
        all_patients: all_patients,
        all_messages: all_messages,
        all_conversations: all_conversations,
        all_roles: all_roles,
        my_user: my_user,
    }
    res.send(response);
});

/**
 * @swagger
 * /api/note:
 *   get:
 *     tags:
 *      - note api
 *     summary: Get a list of patients
 *     parameters:
 *      - in: query
 *        name: Cookie sessionID
 *        schema:
 *          type: string
 *        description: session ID
 *        example: BdKLj3RGiD67F4kOF4
 *     responses:
 *       200:
 *         description: A JSON array containing a list of all note.
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
router.get('/:ss', async function (req, res, next) {

    let notes = await db.Select('select * from note where n_attached_to = ' + req.params.ss)

    if (notes.err)
        res.send(response.err)
    else
        res.send(response);
});

/**
 * @swagger
 * /api/note:
 *   post:
 *     tags:
 *      - note api
 *     summary: Add a note to the current selected patient
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               myUser:
 *                 type: int
 *                 example: 1
 *               ss_number:
 *                 type: string
 *                 example: 0123456789012
 *               n_content:
 *                 type: string
 *                 example: this patient is green
 *     responses:
 *       200:
 *         description: Note successfully added
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

    // MODIFIER LE POST COMME DANS PRESCRIPTION
    req.body.validity = new Date();
    req.body.creation_date = new Date();
    req.body.modification_date = new Date();
    console.log(req.body);
    const result = await utils.PostController(req, res, 'note');

    if (result)
        websocket.sendMessage(req, 'new', 'note', { id: result.id }, result.data, null);

    // const insertData = {
    //     n_creator: req.body.n_creator,
    //     n_attached_to: req.body.n_attached_to,
    //     n_content: req.body.n_content.outerText
    // };
    // const response = await db.InsertData('note', insertData);

    //websocket.sendMessage(req, 'new', 'note', { id: response.data }, insertData, null);
})

/**
 * @swagger
 * /api/note:
 *   put:
 *     tags:
 *      - note api
 *     summary: Add a note to the current selected patient
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               myUser:
 *                 type: string
 *                 example: paul.riba
 *               ss_number:
 *                 type: string
 *                 example: 0123456789012
 *               n_content:
 *                 type: string
 *                 example: this patient is green
 *     responses:
 *       200:
 *         description: Note successfully modified
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
router.put('/', async function(req, res) {
    /*const result = await utils.PutController(req, res, 'note');

    if (result)
        websocket.sendMessage(req, 'update', 'note', { id: result.id }, result.data, null);*/

    req.body.modification_date = new Date();

    const result = await utils.PutController(req, res, 'note');

    if (result)
        websocket.sendMessage(req, 'update', 'note', { id: result.id }, result.data, null);
});

/**
 * @swagger
 * /api/note:
 *   delete:
 *     tags:
 *      - note api
 *     summary: Remove a note from the current note list
 *     responses:
 *       200:
 *         description: note successfully removed
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
    /*const result = await utils.DeleteController(req, res, 'note');

    if (result)
        websocket.sendMessage(req, 'delete', 'note', { id: result.id }, null, null);*/

    const result = await utils.DeleteController(req, res, 'note');

    if (result)
        websocket.sendMessage(req, 'delete', 'note', { id: result.id }, null, null);
});

module.exports = router;
