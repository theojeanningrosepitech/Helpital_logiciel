var express = require('express');
var router = express.Router();
const db = require('../../database');
const axios = require('axios');
const middlewares = require('../../middlewares');
const utils = require('../../utils');

// router.use goal is for manage user access to route
// router.use('/', async function (req, res, next) {
//     await middlewares.RoleMiddleware(req.cookies.userId, res, next);
// });

/**
 * @swagger
 * /api/availability:
 *   get:
 *     tags:
 *      - availability api
 *     summary: Get a list of all availability
 *     responses:
 *       200:
 *         description: A JSON array containing a list of all user unavailability.
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
    const response = await db.Select(`SELECT * FROM availabilities`);

    if (response.err) {
        res.sendStatus(500).send(response.err);
        return;
    }
    res.send(response.data);
});

/**
 * @swagger
 * /api/availability:
 *   post:
 *     tags:
 *      - availability api
 *     summary: Add an inavailability to a user in the availability list
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 2
 *               title:
 *                  type: string
 *                  example: Malade
 *               note:
 *                  type: string
 *                  example: Grippe
 *     responses:
 *       200:
 *         description: A JSON array containing information about the new avaibility.
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
router.post('/', async function (req, res, next) {
    const user_id = req.body.user_id;
    const title = req.body.title;
    const note = req.body.note;
    const send_at = new Date();
    const insertData = {
        user_id: user_id,
        title: title,
        note: note,
        send_at: utils.FormatSqlDate(send_at)
    };

    const result = await db.InsertData('availabilities', insertData);
    if (result.err) {
        res.status(500).json({error: result.err})
        return
    }
});

/**
 * @swagger
 * /api/availability/closeAt:
 *   put:
 *     tags:
 *      - availability api
 *     summary: Change the inavailability in availability
 *     parameters:
 *      - in: query
 *        id: id
 *        schema:
 *          type: integer
 *        description: ID of the inavailability
 *        example: 2
 *     responses:
 *       200:
 *         description: Availability successfully modified
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
router.put('/closeAt', async function(req, res) {
    const id = req.query.id;
    const send_at = new Date();

    const result = await db.UpdateData('availabilities', id, { close_at: utils.FormatSqlDate(send_at) });

    if (result.err) {
        res.status(500).json({ error: result.err });
        return;
    }
    res.status(200).json({ response: 'Event updated' });
})

module.exports = router;
