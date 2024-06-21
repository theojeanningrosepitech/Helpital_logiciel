const express = require('express');
const router = express.Router();
const axios = require('axios');
const navigation = require('../../navigation');

/**
 * @swagger
 * /backOffice/services:
 *   get:
 *     tags:
 *      - services route
 *     summary: Get the backoffice's admin page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {
    const allServices = await axios.get(`${process.env.SERVER_ADDRESS}/api/services`, {header:{cookies:req.cookies}});
    const myUser = await axios.get(`${process.env.SERVER_ADDRESS}/api/users?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});

    res.locals.data = {
        allServices: allServices.data,
        myUser: myUser.data[0],
    };
    res.locals.navigation = navigation.Get(req, navigation.routes.backOffice.sub.services);
    res.render('./backOffice/services/services')
});

/**
 * @swagger
 * /backOffice/services/fragment:
 *   get:
 *     tags:
 *      - service route
 *     summary: Get all services in back office
 *     parameters:
 *      - in: query
 *        id: id
 *        schema:
 *          type: integer
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/fragment', async function (req, res, next) {

    if (!req.query.id || req.query.id == '') {
        res.sendStatus(400);
        return;
    }
    let service = await axios.get(`${process.env.SERVER_ADDRESS}/api/services?id=${req.query.id}`, {header:{cookies:req.cookies}});

    if (service.err) {
        res.sendStatus(500);
        console.error(service.err);
        return;
    } else if (service.data.length === 0) {
        res.sendStatus(400);
        return;
    }

    res.locals.service = service.data[0];
    res.render('./backOffice/services/services_fragment')
});

module.exports = router;
