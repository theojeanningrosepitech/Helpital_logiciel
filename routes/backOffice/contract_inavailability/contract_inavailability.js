const express = require('express');
const router = express.Router();
const axios = require('axios');
const navigation = require('../../navigation');

/**
 * @swagger
 * /backOffice/contract_inavailability:
 *   post:
 *     tags:
 *      - contract inavailability route
 *     summary: Get availability in back office
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       502:
 *         description: Redirected to an error message page.
 */
router.get('/', async function (req, res, next) {
    const myUser = await axios.get(`${process.env.SERVER_ADDRESS}/api/users?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
    const allUsers = await axios.get(`${process.env.SERVER_ADDRESS}/api/users`, {header:{cookies:req.cookies}});
    const availabilities = await axios.get(`${process.env.SERVER_ADDRESS}/api/availability`, {header:{cookies:req.cookies}});
    const allLog = await axios.get(`${process.env.SERVER_ADDRESS}/api/log/service`, {header:{cookies:req.cookies}});
    const allServices = await axios.get(`${process.env.SERVER_ADDRESS}/api/services`, {header:{cookies:req.cookies}});
    const allRoles = await axios.get(`${process.env.SERVER_ADDRESS}/api/roles`, {header:{cookies:req.cookies}});
    const allContract = await axios.get(`${process.env.SERVER_ADDRESS}/api/contract`, {header:{cookies:req.cookies}});
    const avatars = await axios.get(`${process.env.SERVER_ADDRESS}/api/avatars`, {header:{cookies:req.cookies}});

    res.locals.data = {
        myUser: myUser.data[0],
        allUsers: allUsers.data,
        avatars: avatars.data,
        availabilities: availabilities.data,
        allLog: allLog.data,
        allServices: allServices.data,
        allRoles: allRoles.data,
        allContract: allContract.data,
    };
    res.locals.navigation = navigation.Get(req, navigation.routes.backOffice.sub.contract_inavailability);
    res.render('./backOffice/contract_inavailability/contract_inavailability')
});

module.exports = router;