const express = require('express');
const router = express.Router();
const axios = require('axios');
const middlewares = require('../middlewares');
const navigation = require('../navigation');

// !! a mettre dans rooms

// router.use goal is for manage user access to route
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});

/**
 * @swagger
 * /roomManagement:
 *   get:
 *     tags:
 *      - roomManagement route
 *     summary: Get the room list page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {
    let rooms;

    if (req.query.floor) {
        rooms = await axios.get(`${process.env.SERVER_ADDRESS}/api/rooms?user_id=${req.cookies.userId}&floor=${req.query.floor}`, {header:{cookies:req.cookies}});
    } else if (req.query.service_id) {
        rooms = await axios.get(`${process.env.SERVER_ADDRESS}/api/rooms?user_id=${req.cookies.userId}&service_id=${req.query.service_id}`, {header:{cookies:req.cookies}});
    } else if (req.query.service_id && req.query.floor) {
        rooms = await axios.get(`${process.env.SERVER_ADDRESS}/api/rooms?user_id=${req.cookies.userId}&service_id=${req.query.service_id}&floor=${req.query.floor}`, {header:{cookies:req.cookies}});
    } else {
        rooms = await axios.get(`${process.env.SERVER_ADDRESS}/api/rooms?user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
    }

    res.locals.data = rooms.data;
    res.locals.navigation = navigation.Get(req, navigation.routes.roomManagement);

    res.render('./roomManagement/roomManagement')
});

router.get('/fragment', async function (req, res, next) {
    const rooms = await axios.get(`${process.env.SERVER_ADDRESS}/api/rooms?id=${req.query.id}`, {header:{cookies:req.cookies}});

    if (rooms.data.length !== 1) {
        res.status(500);
        return;
    }

    res.locals.room = rooms.data[0];

    res.render('./roomManagement/room_fragment')
});

module.exports = router;
