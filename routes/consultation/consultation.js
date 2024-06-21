const express = require('express');
const router = express.Router();
const axios = require('axios');
const middlewares = require('../middlewares');

// router.use goal is for manage user access to route
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});

/**
 * @swagger
 * /consultation:
 *   get:
 *     tags:
 *      - consultation route
 *     summary: Get the consultation page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal server error.
 */
router.get('/', async function (req, res, next) {
    res.locals.capsuleURL = `${process.env.SERVER_ADDRESS}/patients/headerless?ssNumber=${req.query.ssNumber}`
    res.locals.consultationURL = `${process.env.SERVER_ADDRESS}/consultation/content?ssNumber=${req.query.ssNumber}&eventTitle=${req.query.eventTitle}&eventDescription=${req.query.eventDescription}`

    res.render('./consultation/consultation')
});

/**
 * @swagger
 * /consultation/content:
 *   get:
 *     tags:
 *      - consultation route
 *     summary: Get the consultation page
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

    res.locals.user = user.data[0];
    res.locals.data = patients.data;
    res.locals.data.notes.data = res.locals.data.notes.data.filter(function (value, index, arr) {
        return value.n_attached_to === req.query.ssNumber
    })
    res.locals.rdv = {
        title: req.query.eventTitle,
        description: req.query.eventDescription
    }

    res.render('./consultation/content_test')
});

module.exports = router;
