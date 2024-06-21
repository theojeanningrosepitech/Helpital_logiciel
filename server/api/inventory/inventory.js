var express = require('express');
var router = express.Router();
const db = require('../../database');
const axios = require("axios");
const utils = require('../../utils');
const websocket = require('../../websocket');
const middlewares = require('../../middlewares');

/*router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});*/

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     tags:
 *       - inventory api
 *     summary: Get a list of objects from inventory
 *     description: Query parameters are optional, they are used to filter the search.
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: string
 *        description: inventory object ID
 *        example: 1
 *      - in: query
 *        name: room_id
 *        schema:
 *          type: integer
 *        description: room ID
 *        example: 1
 *      - in: query
 *        name: search
 *        schema:
 *          type: string
 *        description: search input
 *        example: inventory object name
 *      - in: query
 *        name: room_type
 *        schema:
 *          type: integer
 *        description: type of room
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
 *     responses:
 *       200:
 *         description: A JSON array containing a list of inventory objects.
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
        if (req.query.room_id)
            where.push('room_id = ' + req.query.room_id);
        if (req.query.type)
            where.push('type = ' + req.query.type);
        if (req.query.search)
            where.push('title LIKE E\'%' + db.EscapeQuote(req.query.search) + '%\'');
        if (req.query.room_type)
            where.push('room_id IN (SELECT id FROM rooms WHERE type = ' + req.query.room_type + ')');
        if (req.query.floor)
            where.push('room_id IN (SELECT id FROM rooms WHERE floor = ' + req.query.floor + ')');
        if (req.query.service_id)
            where.push('room_id IN (SELECT id FROM rooms WHERE service_id = ' + req.query.service_id + ')');
    }
    let query = 'SELECT * FROM inventory';

    if (where.length != 0)
        query += ' WHERE ' + where.join(' AND ');
    query += ' ORDER BY id DESC';

    let response = await db.Select(query);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }
    let inventory = response.data;
    let types = [];
    let rooms = [];

    for (const item of inventory) {
        if (!types.includes(item.type))
            types.push(item.type);
        if (!rooms.includes(item.room_id))
            rooms.push(item.room_id);
    }

    // get inventory types
    if (types.length) {
        response = await db.Select(`SELECT * FROM inventory_types WHERE id IN (${types})`)

        if (response.err) {
            res.status(500).send(response.err);
            return;
        }
        for (const item of inventory) {
            for (const type of response.data) {
                if (item.type === type.id) {
                    item.type = type;
            //        item.type_name = type.name;
            //        item.type_display_name = type.display_name;
                }
            }
        }
    }

    // get rooms
    if (rooms.length) {
        response = await db.Select(`SELECT * FROM rooms WHERE id IN (${rooms})`)

        if (response.err) {
            res.status(500).send(response.err);
            return;
        }

        for (const item of inventory)
            for (const room of response.data)
                if (item.room_id === room.id)
                    item.room = room;
    }

    // get rooms services, types
    let services = [];
    let roomTypes = [];

    for (const room of response.data) {
        if (!roomTypes.includes(room.type))
            roomTypes.push(room.type);
        if (!services.includes(room.service_id))
            services.push(room.service_id);
    }

    if (roomTypes.length) {
        response = await db.Select(`SELECT * FROM rooms_types WHERE id IN (${roomTypes})`)

        if (response.err) {
            res.status(500).send(response.err);
            return;
        }

        for (const item of inventory)
            if (item.room) {
                for (const roomType of response.data)
                    if (item.room.type === roomType.id) {
                        item.room.type = roomType;
                        break;
                    }
            }
    }

    if (services.length) {
        response = await db.Select(`SELECT * FROM services WHERE id IN (${services})`)

        if (response.err) {
            res.status(500).send(response.err);
            return;
        }

        for (const item of inventory)
            if (item.room) {
                for (const service of response.data)
                    if (item.room.service_id === service.id) {
                        item.room.service = service;
                        break;
                    }
            }
    }
    res.send(inventory);
    // let responseObj = [];
    //
    // inventory.map(function (item) {
    //     responseObj.push({
    //         id: item.id,
    //         name: item.title,
    //         quantity: item.quantity,
    //         update: item.update_date,
    //         type: item.type,
    //         room: item.room,
    //         /*type: {
    //             id: item.type,
    //             name : item.type_name,
    //             display_name: item.type_display_name
    //         },*/
    //     })
    // })
    // res.send(responseObj);
});


/**
 * @swagger
 * /api/inventory:
 *   post:
 *     tags:
 *       - inventory api
 *     summary: Create an inventory object
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Scalpel
 *               type:
 *                 type: integer
 *                 example: 1
 *               room_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Object successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   example: Row deleted
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
router.post('/', async function(req, res) {

    if (req.body.length === 0) {
        res.status(400).json({ error: "Empty statement" });
        return;
    }
    req.body.update_date = utils.FormatSqlDate(new Date());

    const response = await db.InsertData('inventory', req.body);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }
    res.status(200).json({ response: 'Row created', id: response.data });
    websocket.sendMessage(req, 'new', 'inventory', { id: response.data }, req.body, null);
});

/**
 * @swagger
 * /api/inventory:
 *   put:
 *     tags:
 *       - inventory api
 *     summary: Modify an inventory object
 *     description: The request body can contain any field present in the inventory table of the database.
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
 *                 example: Scalpel
 *               type:
 *                 type: integer
 *                 example: 1
 *               room_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Object successfully modified.
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
    req.body.update_date = utils.FormatSqlDate(new Date());

    const result = await utils.PutController(req, res, 'inventory');

    if (result)
        websocket.sendMessage(req, 'update', 'inventory', { id: result.id }, result.data, null);
});

/**
 * @swagger
 * /api/inventory:
 *   delete:
 *     tags:
 *       - inventory api
 *     summary: Delete an inventory object
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: object ID to delete
 *        example: 1
 *     responses:
 *       200:
 *         description: Object successfully deleted.
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
    const result = await utils.DeleteController(req, res, 'inventory');

    if (result)
        websocket.sendMessage(req, 'delete', 'inventory', { id: result.id }, null, null);
});


/**
 * @swagger
 * /api/inventory/gh:
 *   get:
 *     tags:
 *       - inventory api
 *     summary: Get a list of objects from inventory (similar to /inventory)
 *     description: Query parameters are optional, they are used to filter the search.
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: string
 *        description: inventory object ID
 *        example: 1
 *      - in: query
 *        name: room_id
 *        schema:
 *          type: integer
 *        description: room ID
 *        example: 1
 *      - in: query
 *        name: search
 *        schema:
 *          type: string
 *        description: search input
 *        example: inventory object name
 *      - in: query
 *        name: room_type
 *        schema:
 *          type: integer
 *        description: type of room
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
 *     responses:
 *       200:
 *         description: A JSON array containing a list of inventory objects.
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
router.get('/gh', async function (req, res, next) {
    let where = [];

    // add where clauses
    if (req.query.id)
        where.push('id = ' + req.query.id);
    else {
        if (req.query.room_id)
            where.push('room_id = ' + req.query.room_id);
        if (req.query.type)
            where.push('type = ' + req.query.type);
        if (req.query.search)
            where.push('title LIKE E\'%' + db.EscapeQuote(req.query.search) + '%\'');
        if (req.query.room_type)
            where.push('room_id IN (SELECT id FROM rooms WHERE type = ' + req.query.room_type + ')');
        if (req.query.floor)
            where.push('room_id IN (SELECT id FROM rooms WHERE floor = ' + req.query.floor + ')');
        if (req.query.service_id)
            where.push('room_id IN (SELECT id FROM rooms WHERE service_id = ' + req.query.service_id + ')');
    }
    let query = 'SELECT * FROM inventory';

    if (where.length != 0)
        query += ' WHERE ' + where.join(' AND ') + ";";

    let response = await db.Select(query);
    let typeTab = [];
    for (const data of response.data)
        if (!typeTab.includes(data.type))
            typeTab.push(data.type);
    const rooms = await db.Select(`select * from inventory_types where id in (${typeTab})`)

    let responseObj = {
        data: []
    }

    for (const data of response.data) {
        for (const data_type of rooms.data) {
            if (data.type === data_type.id) {
                data.type_name = data_type.name;
                data.type_display_name = data_type.display_name;
            }
        }
    }
    response.data.map(function (item) {
        responseObj.data.push({
            id: item.id,
            name: item.title,
            quantity: item.quantity,
            update: item.update_date,
            type: {
                id: item.type,
                name : item.type_name,
                display_name: item.type_display_name
            },
        })
    })

    if (response.err)
        res.status(500).send(response.err);
    res.send(responseObj);
})
module.exports = router;
