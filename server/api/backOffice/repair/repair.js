var express = require('express');
var router = express.Router();
const db = require('../../../database');
const axios = require('axios');
const middlewares = require('../../../middlewares');
const websocket = require('../../../websocket');
const utils = require('../../../utils');

/*
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 1, res, next);
});
*/

/**
 * @swagger
 * /api/back_office/repair:
 *   get:
 *     tags:
 *      - name : repair API
 *        description: Backoffice's
 *     summary: Get all reparation
 *     parameters:
 *      - in: query
 *        name: Cookie sessionID
 *        schema:
 *          type: string
 *        description: session ID
 *        example: BdKLj3RGiD67F4kOF4
 *     responses:
 *       200:
 *         description: A JSON array containing a list of all reports.
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
    let query = 'SELECT * from repair';

    if (req.query.id)
        query += ' WHERE id = ' + req.query.id;
    const response = await db.Select(query);

    if (response.err) {
        res.sendStatus(500);
        return;
    }

    for (let item of response.data) {
        const room = await db.Select(`select title from rooms where id = ${item.room}`);
        const service = await db.Select(`select title from services where id = ${item.service}`);
        item.room = room.data[0].title;
        item.service = service.data[0].title;
    }
    if (response.err)
        res.status(500).send(response.err);
    else
        res.send(response.data);
});


/**
 * @swagger
 * /api/back_office/repair:
 *   post:
 *       tags:
 *      - name : repair API
 *        description: Backoffice's
 *     summary: Ask for a repair.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               item:
 *                 type: string
 *                 example: Radiateur
 *               room:
 *                 type: int
 *                 example: 302
 *               service:
 *                 type: integer
 *                 example: 0
 *     responses:
 *       200:
 *         description: A JSON object containing either new row's id or error code.
 *         content:
 *           application/json:
 *              schema:
 *                  type: object
 properties:
 *                      id:
 *                          type: int
 *                          example: 1
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.post('/', async function (req, res, next) {
    let itemName = req.body.item;
    let roomId = req.body.room;
    let serviceId = req.body.service;
//    let check = await db.Select(`select exists(select item, room, service from repair where item = initcap('${itemName}') and room = ${roomId} and service = ${serviceId})`)
    const repair = await db.Select(`select id, reports from repair where item = initcap('${itemName}') and room = ${roomId} and service = ${serviceId}`)

    if (repair.err) {
        res.status(500).send(repair.err);
        return;
    }

    if (repair.data.length !== 0) {
//        response = await db.Update(`update repair set reports = (select reports where item = initcap('${itemName}') and room = ${roomId} and service = ${serviceId}) + 1 where item = initcap('${itemName}') and room = ${roomId} and service = ${serviceId} returning id`)
        const updateData = {reports: repair.data[0].reports + 1};
        const response = await db.UpdateData('repair', repair.data[0].id, updateData);

        if (response.err) {
            res.status(500).send(response.err);
            return;
        }
        res.send(repair.data[0]);
        websocket.sendMessage(req, 'update', 'repair', {id: repair.data[0].id}, updateData, null);
    } else {
        // response = await db.Insert(`insert into repair (item, room, service) values (initcap('${itemName}'), ${roomId}, ${serviceId}) returning id`)
        const insertData = {
            item: utils.initCap(itemName),
            room: roomId,
            service: serviceId
        }
        const response = await db.InsertData('repair', insertData);

        if (response.err) {
            res.status(500).send(response.err);
            return;
        }
        websocket.sendMessage(req, 'new', 'repair', {id: response.data}, insertData, null);
        res.send({id: response.data});
    }
});

/**
 * @swagger
 * /api/back_office/repair/reports/{report_id}:
 *   get:
 *     tags:
 *      - name : repair API
 *        description: Backoffice's repair API description
 *     summary: Get a report by its id
 *     parameters:
 *      - in: query
 *        name: Cookie sessionID
 *        schema:
 *          type: string
 *        description: session ID
 *        example: BdKLj3RGiD67F4kOF4
 *      - in: path
 *          name: repairId
 *          schema:
 *              type: integer
 *          required: true
 *          description: Numeric ID of the repair to get
 *     responses:
 *       200:
 *         description: A JSON object containing the specific report.
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
router.get('/reports/:id', async function (req, res, next) {
    const select = await db.Select(`select * from repair_reports where id = ${req.params.id}`);

    if (select.err) {
        res.status(500).send(select.err);
        return;
    } else {
        const response = await db.Select(`select reports from repair where id = ${req.params.id}`);

        if (response.err) {
            res.status(500).send(response.err);
            return;
        } else if (response.data.length === 0) {
            res.status(400).send('unkown repair id');
            return;
        }
        const updateData = {reports: response.data[0].reports + 1};
        const wait = await db.UpdateData('repair', req.params.id, updateData);
        websocket.sendMessage(req, 'update', 'repair', {id: req.params.id}, updateData, null);
//        db.Update(`update repair set reports = (select reports where id = ${req.params.id}) + 1 where id = ${req.params.id}`)
        res.send(select.data);
    }
});

/**
 * @swagger
 * /api/back_office/repair/reports:
 *   post:
 *       tags:
 *      - name : repair API
 *        description: Backoffice's
 *     summary: Repair message.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               item:
 *                 type: integer
 *                 example: 1
 *               message:
 *                 type: string
 *                 example: "Le radiateur est cassé"
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.post('/reports', async function (req, res, next) {
    let reportId = req.body.id;
    let message = req.body.message;

    const insertData = {
        id: reportId,
        message: message.toLocaleLowerCase()
    };
    const response = await db.InsertData('repair_reports', insertData);
    // let response = await db.Insert(`insert into repair_reports (id, message) values (${reportId}, lower('${message}'))`)
    if (response.err) {
        res.sendStatus(500);
        return;
    }
    res.sendStatus(200);
    websocket.sendMessage(req, 'new', 'repair_report', {id: response.data}, insertData, null);
})

module.exports = router;
