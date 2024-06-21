const express = require('express');
const router = express.Router();
const axios = require('axios');
const navigation = require('../navigation');
const middlewares = require('../middlewares');


// router.use goal is for manage user access to route
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 1, res, next);
});

/**
 * @swagger
 * /back_office/inventory:
 *   get:
 *     tags:
 *       - inventory route
 *     summary: Get the backoffice's OR the main inventory page
 *     parameters:
 *      - in: query
 *        name: room_id
 *        schema:
 *          type: integer
 *        description: (optional)
 *        example: 14
 *     responses:
 *       200:
 *         description: Request successfully executed.
 */
router.get('/', async function (req, res, next) {

    // get a single inventory object
    if (req.query.room_id) {
        let response = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice/user?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
        const inventory = await axios.get(`${process.env.SERVER_ADDRESS}/api/inventory/gh?room_id=${req.query.room_id}`, {header:{cookies:req.cookies}});
        const rooms = await axios.get(`${process.env.SERVER_ADDRESS}/api/rooms?id=${req.query.room_id}`, {header:{cookies:req.cookies}});

        res.locals.navigation = navigation.Get(req, navigation.routes.backOffice.sub.inventory);
        res.locals.favorites = response.data.favorite;
        res.locals.sections = response.data.section;
        res.locals.data = {
            inventory: inventory.data.data,
            room: rooms.data[0],
        };

        res.render('./backOffice/inventory/roomInventory');
    } else { // get several inventory objects
        let response = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice/user?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
        let inventory = await axios.get(`${process.env.SERVER_ADDRESS}/api/inventory/gh`, {header:{cookies:req.cookies}});
        // let rooms = await axios.get('${process.env.SERVER_ADDRESS}/api/rooms', {header:{cookies:req.cookies}});
        // let room_types = await axios.get('${process.env.SERVER_ADDRESS}/api/rooms/types', {header:{cookies:req.cookies}});

        // console.log(rooms.data, room_types.data);
        res.locals.navigation = navigation.Get(req, navigation.routes.backOffice.sub.inventory);
        res.locals.favorites = response.data.favorite;
        res.locals.sections = response.data.section;
        res.locals.data = inventory.data;

        res.render('./backOffice/inventory/inventory')
    }
});

/**
 * @swagger
 * /back_office/inventory/fragment:
 *   get:
 *     tags:
 *       - inventory route
 *     summary: Get an inventory fragment/row (to insert in a list)
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        example: 1
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       400:
 *         description: Bad request.
 *       500:
 *         description: Internal server error.
 */
router.get('/fragment', async function (req, res, next) {

    if (!req.query.id || req.query.id == '') {
        res.sendStatus(400);
        return;
    }
    let inventory = await axios.get(`${process.env.SERVER_ADDRESS}/api/inventory/gh?id=${req.query.id}`, {header:{cookies:req.cookies}});

    if (inventory.err) {
        res.sendStatus(500);
        console.error(inventory.err);
        return;
    } else if (inventory.data.data.length === 0) {
        res.sendStatus(400);
        return;
    }
    res.locals.row = inventory.data.data[0];
    res.render('./backOffice/inventory/inventory_fragment')
});

/**
 * @swagger
 * /back_office/inventory/edit:
 *   get:
 *     tags:
 *       - inventory route
 *     summary: Get the inventory edit page
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: identifier of the inventory object to edit
 *        example: 14
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       400:
 *         description: Bad request.
 */
router.get('/edit', async function (req, res, next) {
    if (!req.query.id) {
        res.status(400);
        return;
    }
    const response = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice/user?id=${req.cookies.userId}&user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
    const inventory = await axios.get(`${process.env.SERVER_ADDRESS}/api/inventory?id=${req.query.id}&user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
    const inventoryTypes = await axios.get(`${process.env.SERVER_ADDRESS}/api/inventory/types?user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});

    if (inventory.data.length === 0) {
        res.status(400);
        return;
    }
    res.locals.navigation = navigation.Get(req, navigation.routes.backOffice.sub.inventory.sub.edit, inventory.data[0].title, req.query.id);
    res.locals.favorites = response.data.favorite;
    res.locals.sections = response.data.section;
    res.locals.data = {
        item: inventory.data[0],
        inventoryTypes: inventoryTypes.data
    };

    res.render('./backOffice/inventory/edit')
});

/**
 * @swagger
 * /back_office/inventory/new:
 *   get:
 *     tags:
 *       - inventory route
 *     summary: Get the new_inventory page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 */
router.get('/new', async function (req, res, next) {
    const response = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice/user?id=${req.cookies.userId}&user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
    const inventoryTypes = await axios.get(`${process.env.SERVER_ADDRESS}/api/inventory/types?user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});

    res.locals.navigation = navigation.Get(req, navigation.routes.backOffice.sub.inventory.sub.new);
    res.locals.favorites = response.data.favorite;
    res.locals.sections = response.data.section;
    res.locals.data = {
        inventoryTypes: inventoryTypes.data
    };

    res.render('./backOffice/inventory/new')
});

/**
 * @swagger
 * /back_office/inventory/types:
 *   get:
 *     tags:
 *       - inventory route
 *     summary: Get the inventory types page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 */
router.get('/types', async function (req, res, next) {
    const response = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice/user?id=${req.cookies.userId}&user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});

    res.locals.navigation = navigation.Get(req, navigation.routes.backOffice.sub.inventory.sub.types);
    res.locals.favorites = response.data.favorite;
    res.locals.sections = response.data.section;

    res.render('./backOffice/inventory/types/types')
});

/**
 * @swagger
 * /back_office/inventory/types/type:
 *   get:
 *     tags:
 *       - inventory route
 *     summary: Get an inventory type page
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: identifier of the inventory object's type
 *        example: 14
 *     responses:
 *       200:
 *         description: Request successfully executed.
 */
router.get('/types/type', async function (req, res, next) {

    if (!req.query.id) {
        res.status(400);
        return;
    }
    const response = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice/user?id=${req.cookies.userId}&user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
    const type = await axios.get(`${process.env.SERVER_ADDRESS}/api/inventory/types?id=${req.query.id}&user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});

    if (type.data.length === 0) {
        res.status(400);
        return;
    }
    res.locals.navigation = navigation.Get(req, navigation.routes.backOffice.sub.inventory.sub.types.sub.type, type.data[0].display_name, req.query.id);
    res.locals.favorites = response.data.favorite;
    res.locals.sections = response.data.section;
    res.locals.data = type.data[0];

    res.render('./backOffice/inventory/types/type')
});

/**
 * @swagger
 * /back_office/inventory/types/edit:
 *   get:
 *     tags:
 *       - inventory route
 *     summary: Get the inventory_type_edit page
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: identifier of the inventory object's type to edit
 *        example: 14
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       400:
 *         description: Bad request.
 */
router.get('/types/edit', async function (req, res, next) {

    if (!req.query.id) {
        res.status(400);
        return;
    }
    const response = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice/user?id=${req.cookies.userId}&user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
    const type = await axios.get(`${process.env.SERVER_ADDRESS}/api/inventory/types?id=${req.query.id}&user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});

    if (type.data.length === 0) {
        res.status(400);
        return;
    }
    res.locals.navigation = navigation.Get(req, navigation.routes.backOffice.sub.inventory.sub.types.sub.edit, type.data[0].display_name, req.query.id);
    res.locals.favorites = response.data.favorite;
    res.locals.sections = response.data.section;
    res.locals.data = type.data[0];

    res.render('./backOffice/inventory/types/edit')
});

/**
 * @swagger
 * /back_office/inventory/types/new:
 *   get:
 *     tags:
 *       - inventory route
 *     summary: Get the new_inventory_type page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 */
router.get('/types/new', async function (req, res, next) {
    const response = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice/user?id=${req.cookies.userId}&user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});

    res.locals.navigation = navigation.Get(req, navigation.routes.backOffice.sub.inventory.sub.types.sub.new);
    res.locals.favorites = response.data.favorite;
    res.locals.sections = response.data.section;

    res.render('./backOffice/inventory/types/new')
});

module.exports = router;
