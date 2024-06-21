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
 * /api/prescription:
 *   get:
 *     tags:
 *      - prescription api
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
 *         description: A JSON array containing a list of all prescription.
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
    const all_prescription = await db.Select(`select * from note`);
    const my_user = await db.Select(`select * from users WHERE id = ` + req.query.user_id);
    const all_users = await db.Select(`select * from users`);
    const all_messages = await db.Select(`select * from msg`);
    const all_conversations = await db.Select(`select * from conversation`);
    const all_roles = await db.Select(`select * from software_role`);
    const all_patients = await db.Select(`select * from patients`);

    if (all_users.err || all_prescription.err || all_patients.err || all_messages.err || all_conversations.err || all_roles.err || my_user.err)
        res.status(500).send("Erreur Serveur /api/prescription/prescription.js");

    const response = {
        all_prescription: all_prescription,
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
 * /api/prescription:
 *   post:
 *     tags:
 *      - prescription api
 *     summary: Add a prescription to the current selected patient
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
 *               p_content:
 *                 type: string
 *                 example: 500mg paracetamol
 *     responses:
 *       200:
 *         description: Prescription successfully added
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
    let buffer = req;
    req.body.creation_date = new Date();
    req.body.modification_date = new Date();

    const result = await utils.PostController(req, res, 'prescription');

    if (result)
        websocket.sendMessage(req, 'new', 'prescription', { id: result.id }, result.data, null);
});

/**
 * @swagger
 * /api/prescritpion:
 *   put:
 *     tags:
 *      - prescription api
 *     summary: Add a prescription to the current selected patient
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
 *         description: Prescription successfully modified
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
    const result = await utils.PutController(req, res, 'prescription');

    if (result)
        websocket.sendMessage(req, 'update', 'prescription', { id: result.id }, result.data, null);
});

/**
 * @swagger
 * /api/prescription:
 *   delete:
 *     tags:
 *      - prescription api
 *     summary: Remove a prescription from the current note list
 *     responses:
 *       200:
 *         description: Prescription successfully removed
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
    const result = await utils.DeleteController(req, res, 'prescription');

    if (result)
        websocket.sendMessage(req, 'delete', 'prescription', { id: result.id }, null, null);
});

module.exports = router;
