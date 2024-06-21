const express = require('express');
const router = express.Router();
const axios = require('axios');
const env = require('../../env');
const navigation = require('../../navigation');
const middlewares = require('../../middlewares');

// router.use goal is for manage user access to route
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 1, res, next);
});

/**
 * @swagger
 * /back_office/repair:
 *   get:
 *     tags:
 *      - repair route
 *     summary: Get the backoffice's repair page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal server error.
 */
router.get('/', async function (req, res, next) {
    let response = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice/user?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
    let repair = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice/repair`, {header:{cookies:req.cookies}});
    // let rooms = await axios.get('${process.env.SERVER_ADDRESS}/api/rooms');
    // let room_types = await axios.get('${process.env.SERVER_ADDRESS}/api/rooms/types');

    // console.log(rooms.data, room_types.data);
    res.locals.navigation = navigation.Get(req, navigation.routes.backOffice.sub.repair);
    res.locals.favorites = response.data.favorite;
    res.locals.sections = response.data.section;
    res.locals.data = repair.data;
    res.render('./backOffice/repair/repair')
});

router.get('/fragment', async function (req, res, next) {

    if (!req.query.id || req.query.id == '') {
        res.sendStatus(400);
        return;
    }
    let repair = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice/repair?id=${req.query.id}`, {header:{cookies:req.cookies}});

    if (repair.err) {
        res.sendStatus(500);
        console.error(repair.err);
        return;
    } else if (repair.data.length === 0) {
        res.sendStatus(400);
        return;
    }
    res.locals.row = repair.data[0];
    res.render('./backOffice/repair/repair_fragment')
});

module.exports = router;
