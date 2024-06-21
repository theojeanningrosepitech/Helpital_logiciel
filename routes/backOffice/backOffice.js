const express = require('express');
const router = express.Router();
const axios = require('axios');
const navigation = require('../navigation');

const repairRouter = require('./repair/repair');
const usersRouter = require('./users/users');
const servicesRouter = require('./services/services');
const serviceRouter = require('./services/service');
const ordersRouter = require('./orders/orders');
const contract_inavailabilityRouter = require('./contract_inavailability/contract_inavailability');
const insultRouter = require('./insult/insult');

router.use('/repairs', repairRouter);
router.use('/users', usersRouter);
router.use('/services', servicesRouter);
router.use('/service', serviceRouter);
router.use('/orders', ordersRouter);
router.use('/contract_inavailability', contract_inavailabilityRouter);
router.use('/insult', insultRouter);

const middlewares = require('../middlewares');

// router.use goal is for manage user access to route
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 2, res, next);
});

/**
 * @swagger
 * /back_office:
 *   get:
 *     tags:
 *      - back_office route
 *     summary: Get backoffice page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal server error.
 */
router.get('/', async function (req, res, next) {
    const response = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice/user?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});

    res.locals.navigation = navigation.Get(req, navigation.routes.backOffice);
    res.locals.favorites = response.data.favorite;
    res.locals.sections = response.data.section;
    const allSections = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice`, {header:{cookies:req.cookies}});

    res.locals.all_sections = allSections.data;
    res.render('./backOffice/backOffice')
});

router.get('/repair', async function (req, res, next) {
    const response = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice/user?id=${req.cookies.userId}&user_id=${req.cookies.userId}`, {header:{cookies:req.cookies}});

    res.locals.navigation = navigation.Get(req, navigation.routes.backOffice.sub.repair);
    res.locals.favorites = response.data.favorite;
    res.locals.sections = response.data.section;

    res.render('./backOffice/repair/repair')
});

router.get('/users', async function (req, res, next) {
    const users = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice/users`, {header:{cookies:req.cookies}});
    const myUser = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice/users?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
    const roles = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice/roles`, {header:{cookies:req.cookies}});
    const services = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice/services`, {header:{cookies:req.cookies}});

    res.locals.data = {
        users: users.data,
        myUser: myUser.data[0],
        roles: roles.data,
        services: services.data,
    };
    res.locals.navigation = navigation.Get(req, navigation.routes.directory);
    res.render('./backOffice/users/users')
});

module.exports = router;
