const express = require('express');
const router = express.Router();
const axios = require('axios');

const middlewares = require('../middlewares');
const navigation = require('../navigation');

// router.use goal is for manage user access to route
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});

/**
 * @swagger
 * /rooms:
 *   get:
 *     tags:
 *       - rooms route
 *     summary: Get a room page
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: identifier of the room
 *        example: 14
 *     responses:
 *       200:
 *         description: Request successfully executed.
 */
router.get('/', async function (req, res, next) {

    if (!req.query.id) {
        res.status(400);
        return;
    }
    const response = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice/user?id=${req.cookies.userId}&user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
    const room = await axios.get(`${process.env.SERVER_ADDRESS}/api/rooms?id=${req.query.id}&user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});

    if (room.data.length === 0) {
        res.status(400);
        return;
    }
    res.locals.navigation = navigation.Get(req, navigation.routes.backOffice.sub.rooms.sub.room, room.data[0].title, room.data[0].id);
    res.locals.favorites = response.data.favorite;
    res.locals.sections = response.data.section;
    res.locals.data = room.data[0];

    res.render('./rooms/room')
});

/**
 * @swagger
 * /rooms/edit:
 *   get:
 *     tags:
 *       - rooms route
 *     summary: Get a room edit page
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: identifier of the room
 *        example: 14
 *     responses:
 *       200:
 *         description: Request successfully executed.
 */
router.get('/edit', async function (req, res, next) {

    if (!req.query.id) {
        res.status(400);
        return;
    }
    const response = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice/user?id=${req.cookies.userId}&user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
    const room = await axios.get(`${process.env.SERVER_ADDRESS}/api/rooms?id=${req.query.id}&user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
    const roomTypes = await axios.get(`${process.env.SERVER_ADDRESS}/api/rooms/types?user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
    const supervisors = await axios.get(`${process.env.SERVER_ADDRESS}/api/supervisors`, {header:{cookies:req.cookies}});

    if (room.data.length === 0) {
        res.status(400);
        return;
    }
    res.locals.navigation = navigation.Get(req, navigation.routes.backOffice.sub.rooms.sub.edit, room.data[0].title, room.data[0].id);
    res.locals.favorites = response.data.favorite;
    res.locals.sections = response.data.section;
    res.locals.data = {
        room: room.data[0],
        roomTypes: roomTypes.data,
        supervisors: supervisors.data
    };

    res.render('./rooms/edit')
});

/**
 * @swagger
 * /rooms/types:
 *   get:
 *     tags:
 *       - rooms route
 *     summary: Get a page listing all room's types
 *     responses:
 *       200:
 *         description: Request successfully executed.
 */
router.get('/types', async function (req, res, next) {
    const response = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice/user?id=${req.cookies.userId}&user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});

    res.locals.navigation = navigation.Get(req, navigation.routes.backOffice.sub.rooms.sub.types);
    res.locals.favorites = response.data.favorite;
    res.locals.sections = response.data.section;

    res.render('./rooms/types/types')
});

/**
 * @swagger
 * /rooms/types/type:
 *   get:
 *     tags:
 *       - rooms route
 *     summary: Get a room's type page
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: identifier of the room's type
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
    const type = await axios.get(`${process.env.SERVER_ADDRESS}/api/rooms/types?id=${req.query.id}&user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});

    if (type.data.length === 0) {
        res.status(400);
        return;
    }
    res.locals.navigation = navigation.Get(req, navigation.routes.backOffice.sub.rooms.sub.types.sub.type, type.data[0].display_name, type.data[0].id);
    res.locals.favorites = response.data.favorite;
    res.locals.sections = response.data.section;
    res.locals.data = type.data[0];

    res.render('./rooms/types/type')
});

/**
 * @swagger
 * /rooms/types/edit:
 *   get:
 *     tags:
 *       - rooms route
 *     summary: Get a room's type edit page
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: identifier of the room's type
 *        example: 14
 *     responses:
 *       200:
 *         description: Request successfully executed.
 */
router.get('/types/edit', async function (req, res, next) {

    if (!req.query.id) {
        res.status(400);
        return;
    }
    const response = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice/user?id=${req.cookies.userId}&user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
    const type = await axios.get(`${process.env.SERVER_ADDRESS}/api/rooms/types?id=${req.query.id}&user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});

    if (type.data.length === 0) {
        res.status(400);
        return;
    }
    res.locals.navigation = navigation.Get(req, navigation.routes.backOffice.sub.rooms.sub.types.sub.edit, type.data[0].display_name, type.data[0].id);
    res.locals.favorites = response.data.favorite;
    res.locals.sections = response.data.section;
    res.locals.data = type.data[0];

    res.render('./rooms/types/edit')
});

/**
 * @swagger
 * /rooms/types/new:
 *   get:
 *     tags:
 *       - rooms route
 *     summary: Get a room's type page to create a new type of room
 *     responses:
 *       200:
 *         description: Request successfully executed.
 */
router.get('/types/new', async function (req, res, next) {

    const response = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice/user?id=${req.cookies.userId}&user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});

    res.locals.navigation = navigation.Get(req, navigation.routes.backOffice.sub.rooms.sub.types.sub.new);
    res.locals.favorites = response.data.favorite;
    res.locals.sections = response.data.section;

    res.render('./rooms/types/new')
});

module.exports = router;
