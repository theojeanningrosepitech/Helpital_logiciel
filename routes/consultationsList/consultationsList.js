const express = require('express');
const router = express.Router();
const axios = require('axios');
const middlewares = require('../middlewares');
const navigation = require('../navigation');
const utils = require('../utils');

// router.use goal is for manage user access to route
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});

/**
 * @swagger
 * /consultationsList:
 *   get:
 *     tags:
 *      - consultationsList route
 *     summary: Get the consultations list page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {
    const planning = await axios.get(`${process.env.SERVER_ADDRESS}/api/planning?from=0001-01-01&to=9999-01-01`, {header:{cookies:req.cookies}});
    const user = await axios.get(`${process.env.SERVER_ADDRESS}/api/auth/user`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
    const patients = await axios.get(`${process.env.SERVER_ADDRESS}/api/patients`, {headers:{Cookie: utils.GetRawCookie(req.cookies)}});

    if (user.status < 200 || user.status >= 300) {
        res.status(user.status).send(user.data);
        return;
    }

    res.locals.data = patients.data;
    res.locals.data.planning = planning.data;

    res.render('./consultationsList/consultationsList')
});

module.exports = router;
