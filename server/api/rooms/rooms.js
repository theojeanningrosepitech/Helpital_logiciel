var express = require('express');
var router = express.Router();
const db = require('../../database');
const utils = require('../../utils');
const axios = require("axios");
const websocket = require('../../websocket');
const middlewares = require('../../middlewares');

/*router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});*/


/**
 * @swagger
 * /api/rooms:
 *   get:
 *     tags:
 *       - rooms api
 *     summary: Get a list of rooms
 *     description: Query parameters are optional, they are used to filter the search.
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: string
 *        description: room ID
 *        example: 1
 *      - in: query
 *        name: floor
 *        schema:
 *          type: integer
 *        description: room floor
 *        example: 0
 *      - in: query
 *        name: service_id
 *        schema:
 *          type: integer
 *        description: service ID the room belongs to
 *        example: 1
 *      - in: query
 *        name: type
 *        schema:
 *          type: integer
 *        description: type of room
 *        example: 1
 *      - in: query
 *        name: unsized
 *        schema:
 *          type: boolean
 *        description: filter rooms with/without position and size (plan)
 *        example: false
 *      - in: query
 *        name: title
 *        schema:
 *          type: string
 *        description: search input
 *        example: room name
 *      - in: query
 *        name: patient_id
 *        schema:
 *          type: integer
 *        description: filter only rooms containing the patient specified
 *        example: 1
 *     responses:
 *       200:
 *         description: A JSON array containing a list of rooms.
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
    else {
        if (req.query.unsized)
            where.push(req.query.unsized == 'true' ? '(corners IS NULL OR corners = \'\')' : '(corners IS NOT NULL AND corners != \'\')');
        if (req.query.title)
            where.push('title LIKE \'%' + req.query.title + '%\'');
        if (req.query.service_id)
            where.push('service_id = ' + req.query.service_id);
        if (req.query.floor)
            where.push('floor = ' + req.query.floor);
        if (req.query.type)
            where.push('type = ' + req.query.type);
        if (req.query.patient_id)
            where.push('id IN(SELECT room_id FROM patients WHERE id = ' + req.query.patient_id + ')');
    }
    let query = 'SELECT * FROM rooms';

    if (where.length != 0)
        query += ' WHERE ' + where.join(' AND ');
    query += ' ORDER BY title';

    let response = await db.Select(query + ";");

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }
    let rooms = response.data;
    let corners, positions;

    // append additional information
    for (let i = rooms.length - 1; i !== -1; i--) {
        response = await db.Select('SELECT * FROM patients WHERE room_id = ' + rooms[i].id);

        if (response.err) {
            res.status(500).send(response.err);
            return;
        }
        rooms[i].patients = response.data;
        response = await db.Select('SELECT * FROM inventory WHERE room_id = ' + rooms[i].id);

        if (response.err) {
            res.status(500).send(response.err);
            return;
        }
        rooms[i].inventory = response.data;

        for (let j = rooms[i].inventory.length - 1; j !== -1; j--) {
            response = await db.Select('SELECT * FROM inventory_types WHERE id = ' + rooms[i].inventory[j].type);

            if (response.err) {
                res.status(500).send(response.err);
                return;
            }
            rooms[i].inventory[j].type = response.data[0];
        }
        response = await db.Select('SELECT * FROM services WHERE id = ' + rooms[i].service_id);

        if (response.err) {
            res.status(500).send(response.err);
            return;
        }
        rooms[i].service = response.data[0];
        response = await db.Select('SELECT * FROM rooms_types WHERE id = ' + rooms[i].type);

        if (response.err) {
            res.status(500).send(response.err);
            return;
        }
        rooms[i].type = response.data[0];

        if (rooms[i].supervisor && rooms[i].supervisor != 0) {
            response = await db.Select('SELECT * FROM users WHERE id = ' + rooms[i].supervisor);

            if (response.err) {
                res.status(500).send(response.err);
                return;
            }
            rooms[i].supervisor = response.data[0];
        }

        // convert corners to array of positions
        if (rooms[i].corners && rooms[i].corners !== '') {
            corners = rooms[i].corners.split(';');
            rooms[i].corners = Array(corners.length);

            for (let j = 0; j !== corners.length; j++) {
                positions = corners[j].split(',');

                if (positions.length !== 2) {
                    res.status(500).send('Corrupted corners data on roomID ' + rooms[i].id);
                    return;
                }
                rooms[i].corners[j] = {
                    x: parseInt(positions[0]),
                    y: parseInt(positions[1])
                };
            }
        } else {
            rooms[i].corners = [];
        }
    }
    res.send(rooms);
});

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     tags:
 *       - rooms api
 *     summary: Create a room
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: A101
 *               type:
 *                 type: integer
 *                 example: 1
 *               service_id:
 *                 type: integer
 *                 example: 1
 *               floor:
 *                 type: integer
 *                 example: 0
 *               capacity:
 *                 type: integer
 *                 example: 1
 *               supervisor:
 *                 type: integer
 *                 description: user ID
 *                 example: 1
 *     responses:
 *       200:
 *         description: Room successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   example: Row created
 *                 id:
 *                   type: integer
 *                   example: 2
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.post('/', async function (req, res) {
    const result = await utils.PostController(req, res, 'rooms');

    if (result)
        websocket.sendMessage(req, 'new', 'room', { id: result.id }, result.data, null);
});

/**
 * @swagger
 * /api/rooms:
 *   put:
 *     tags:
 *       - rooms api
 *     summary: Modify a room
 *     description: The request body can contain any field present in the rooms table of the database.
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: object ID to modify
 *        example: 1
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: A102
 *               type:
 *                 type: integer
 *                 example: 1
 *               service_id:
 *                 type: integer
 *                 example: 1
 *               floor:
 *                 type: integer
 *                 example: 0
 *               capacity:
 *                 type: integer
 *                 example: 1
 *               supervisor:
 *                 type: integer
 *                 description: user ID
 *                 example: 1
 *               building_id:
 *                 type: integer
 *                 example: 1
 *               position_x:
 *                 type: integer
 *                 example: 4
 *               position_y:
 *                 type: integer
 *                 example: -12
 *               corners:
 *                 type: string
 *                 description: user ID
 *                 example: -5,-8;5,-8;5,5;-5,5
 *     responses:
 *       200:
 *         description: Room successfully modified.
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
    const result = await utils.PutController(req, res, 'rooms');

    if (result)
        websocket.sendMessage(req, 'update', 'room', { id: result.id }, result.data, null);
});

/**
 * @swagger
 * /api/rooms:
 *   delete:
 *     tags:
 *       - rooms api
 *     summary: Delete a room
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: room ID to delete
 *        example: 1
 *     responses:
 *       200:
 *         description: Room successfully deleted.
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
    const result = await utils.DeleteController(req, res, 'rooms');

    if (result)
        websocket.sendMessage(req, 'delete', 'room', { id: result.id }, null, null);
});

module.exports = router;
