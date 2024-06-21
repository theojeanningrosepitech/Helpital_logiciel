const express = require('express');
const router = express.Router();
const axios = require('axios');
const middlewares = require('../middlewares');
const navigation = require('../navigation');
const utils = require('../utils');

// router.use goal is for manage user access to route
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 3, res, next);
});

/**
 * @swagger
 * /prescription:
 *   get:
 *     tags:
 *      - prescription route
 *     summary: Get the prescription page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {
    let prescription = await axios.get(`${process.env.SERVER_ADDRESS}/api/prescription?user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
    const user = await axios.get(`${process.env.SERVER_ADDRESS}/api/auth/user`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});


    if (user.err || prescription.err) {
        console.error(user.err)
        console.error(prescription.err)
        res.sendStatus(500)
        return
    }

    res.locals.data = prescription.data;
    res.locals.data.my_user = user.data;
    res.locals.navigation = navigation.Get(req, navigation.routes.prescription);

    console.log(res.locals.data.my_user);

    res.render('./prescription/prescription')
});

router.get('/headerless', async function (req, res, next) {
    let prescription = await axios.get(`${process.env.SERVER_ADDRESS}/api/prescription?user_id=${req.cookies.userId}`);
    let user = await axios.get(`${process.env.SERVER_ADDRESS}/api/user/login?id=${req.cookies.userId}`);

    res.locals.user = user.data[0];
    res.locals.data = prescription.data;

    res.render('./prescription/prescriptionHeaderless')
});

module.exports = router;