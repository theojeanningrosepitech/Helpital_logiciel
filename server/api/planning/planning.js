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
 * /api/planning:
 *   get:
 *     tags:
 *      - planning api
 *     summary: Get a list of events
 *     parameters:
 *      - in: query
 *        name: Cookie sessionID
 *        schema:
 *          type: string
 *        description: session ID
 *        example: BdKLj3RGiD67F4kOF4
 *      - in: query
 *        name: begin_at
 *        schema:
 *          type: string
 *        description: begin at date of the events
 *        example: 2021-12-02 09:00:00
 *     responses:
 *       200:
 *         description: A JSON array containing a list of all events of a currently connected user.
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

    // add where clauses
    if (req.query.id)
        where.push('id = ' + req.query.id);
    else if (req.query.from) {
        where.push('begin_at >= \'' + req.query.from + '\'');

        if (req.query.to)
            where.push("begin_at < '" + req.query.to + '\'');
        else if (req.query.duration) {
            let to = new Date(req.query.from);

            to.setSeconds(req.query.duration);
            where.push("begin_at < '" + utils.FormatSqlDate(to) + '\'');
        } else {
            let to = new Date(req.query.from);

            to.setDate(to.getDate() + 7);
            where.push("begin_at < '" + utils.FormatSqlDate(to).substr(0, 10) + '\'');
        }
    } else {
        let from = new Date();
        from.setDate(from.getDate() - (from.getDay() + 6) % 7);
        where.push('begin_at >= \'' + utils.FormatSqlDate(from).substr(0, 10) + '\'');

        let to = new Date(from);
        to.setDate(to.getDate() + 7);
        where.push("begin_at < '" + utils.FormatSqlDate(to).substr(0, 10) + '\'');
    }
    let query = 'SELECT * FROM planning';

    if (where.length != 0)
        query += ' WHERE ' + where.join(' AND ');
    const planning = await db.Select(query);

    if (planning.err) {
        res.status(500).send(planning.err);
        return;
    }

    res.send(planning.data);
});

/**
 * @swagger
 * /api/planning:
 *   post:
 *     tags:
 *      - planning api
 *     summary: Add an event to the current events list
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Consultation de Tao
 *               description:
 *                 type: string
 *                 example: Douleurs au ventre
 *               user_id:
 *                 type: integer
 *                 example: 7
 *               begin_at:
 *                 type: string
 *                 example: 2021-12-02 09:00:00
 *               end_at:
 *                 type: string
 *                 example: 2021-12-02 10:00:00
 *     responses:
 *       200:
 *         description: Event successfully added
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
    const beginAt = new Date(req.body.begin_at);
    const endAt = new Date(req.body.end_at);

    req.body.duration = (endAt - beginAt) / 1000;

    // const insertData = {
    //     title: req.body.title,
    //     description: req.body.description,
    //     ss_number: req.body.ss_number,
    //     type: req.body.type,
    //     begin_at: beginAt,
    //     end_at: endAt,
    //     duration: req.body.duration
    // };

    // await db.InsertData('planning', insertData);

    // res.redirect('/planning');
    const result = await utils.PostController(req, res, 'planning');

    if (result)
        websocket.sendMessage(req, 'new', 'planning', { id: result.id }, result.data, null);
})

/**
 * @swagger
 * /api/planning:
 *   put:
 *     tags:
 *      - planning api
 *     summary: Change informations of an event
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: event ID of the event
 *        example: 2
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Consultation de Tao
 *               description:
 *                 type: string
 *                 example: Douleurs au ventre
 *               user_id:
 *                 type: integer
 *                 example: 7
 *               begin_at:
 *                 type: string
 *                 example: 2021-12-02 09:00:00
 *               end_at:
 *                 type: string
 *                 example: 2021-12-02 10:00:00
 *     responses:
 *       200:
 *         description: Event successfully modified
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

    if (req.body.begin_at && req.body.end_at) {
        const beginAt = new Date(req.body.begin_at);
        const endAt = new Date(req.body.end_at);

        req.body.duration = (endAt - beginAt) / 1000;
    }
    const result = await utils.PutController(req, res, 'planning');

    if (result)
        websocket.sendMessage(req, 'update', 'planning', { id: result.id }, result.data, null);
});

/**
 * @swagger
 * /api/planning:
 *   delete:
 *     tags:
 *      - planning api
 *     summary: Remove an event from the current events list
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: event ID of the event to delete
 *        example: 2
 *     responses:
 *       200:
 *         description: Event successfully modified
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
    const result = await utils.DeleteController(req, res, 'planning');

    if (result)
        websocket.sendMessage(req, 'delete', 'planning', { id: result.id }, null, null);
});

module.exports = router;

router.get('/:id', async function(req, res) {
    const param = req.params.id
    const result = await db.Select(`select * from planning where user_id = ${param}`)

    res.send(result.data)
});