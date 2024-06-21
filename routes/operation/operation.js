const express = require('express');
const router = express.Router();
const axios = require('axios');
const middlewares = require('../middlewares');
var sizeOf = require('image-size');

// router.use goal is for manage user access to route
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});

/**
 * @swagger
 * /operation:
 *   get:
 *     tags:
 *      - operation route
 *     summary: Get the operation page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal server error.
 */
router.get('/', async function (req, res, next) {
    res.locals.capsuleURL = `${process.env.SERVER_ADDRESS}/patients/headerless?ssNumber=${req.query.ssNumber}`
    res.locals.operationURL = `${process.env.SERVER_ADDRESS}/operation/content?ssNumber=${req.query.ssNumber}&eventTitle=${req.query.eventTitle}&eventDescription=${req.query.eventDescription}`

    // res.cookies = req.cookies;
    // res.cookie('SameSite', 'None');
    // res.cookie('Secure', 'True')
    // console.log(req.cookies, res.cookies)

    res.render('./operation/operation')
});

/**
 * @swagger
 * /operation/content:
 *   get:
 *     tags:
 *      - operation content route
 *     summary: Get the operation page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal server error.
 */
router.get('/content', async function (req, res, next) {
    let patient = await axios.get(`${process.env.SERVER_ADDRESS}/api/patients/ss/${req.query.ssNumber}`);
    let patients = await axios.get(`${process.env.SERVER_ADDRESS}/api/patients?id=${patient.data[0].id}`);
    let user = await axios.get(`${process.env.SERVER_ADDRESS}/api/user/login?id=${req.cookies.userId}`);


    let f = function (path) {
        var dimensions = sizeOf(__dirname + '../../../public/'+path);
        return dimensions.height + 20
    }

    res.locals.data = patients.data;
    res.locals.user = user.data[0];
    res.locals.data.notes.data = res.locals.data.notes.data.filter(function (value, index, arr) {
        return value.n_attached_to === req.query.ssNumber
    })
    res.locals.data = patients.data;
    res.locals.rdv = {
        title: req.query.eventTitle,
        description: req.query.eventDescription,
        files: [
            {name: "Radio du thorax face", path: "/files/img.png", height: f("files/img.png")},
            {name: "Radio du thorax dos", path: "/files/radiographie-osseuse.jpg", height: f("files/radiographie-osseuse.jpg")}
        ]
    }
    res.render('./operation/content_test')
});

module.exports = router;
