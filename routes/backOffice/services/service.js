const express = require('express');
const router = express.Router();
const axios = require('axios');
const navigation = require('../../navigation');

/**
 * @swagger
 * /backOffice/service:
 *   get:
 *     tags:
 *      - service route
 *     summary: Get service details in back office
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {
    const allUser = await axios.get(`${process.env.SERVER_ADDRESS}/api/users`, {header:{cookies:req.cookies}});
    const allUserService = await axios.get(`${process.env.SERVER_ADDRESS}/api/users?service=${req.query.id_service}`, {header:{cookies:req.cookies}});
    const roles = await axios.get(`${process.env.SERVER_ADDRESS}/api/roles`, {header:{cookies:req.cookies}});
    const service = await axios.get(`${process.env.SERVER_ADDRESS}/api/services?id=${req.query.id_service}`, {header:{cookies:req.cookies}});
    const log = await axios.get(`${process.env.SERVER_ADDRESS}/api/log/service?id=${req.query.id_service}`, {header:{cookies:req.cookies}});
    const myUser = await axios.get(`${process.env.SERVER_ADDRESS}/api/users?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
    const allGroups = await axios.get(`${process.env.SERVER_ADDRESS}/api/services/groups?service_id=${req.query.id_service}`, {header:{cookies:req.cookies}});
    const allServices = await axios.get(`${process.env.SERVER_ADDRESS}/api/services`, {header:{cookies:req.cookies}});
    const avatars = await axios.get(`${process.env.SERVER_ADDRESS}/api/avatars`, {header:{cookies:req.cookies}});
    const availabilities = await axios.get(`${process.env.SERVER_ADDRESS}/api/availability`, {header:{cookies:req.cookies}});
    const contract = await axios.get(`${process.env.SERVER_ADDRESS}/api/contract`, {header:{cookies:req.cookies}});
    let parsing_groups_user = [];
    let nbrUserNoGroup = 0;

    for (let i = 0; allUserService.data[i]; i++) {
        if (allUserService.data[i].group_service == 0)
            nbrUserNoGroup += 1;
    }
    for (let i = 0; allGroups.data[i]; i++) {
        parsing_groups_user[i] = {
            id: allGroups.data[i].id,
            service: allGroups.data[i].service,
            chief: allGroups.data[i].chief,
            users_id: allGroups.data[i].users_id.split(','),
            name: allGroups.data[i].name,
        };
    }
    allUserService.data.sort(function compare(a, b) {
        if (a.id < b.id)
            return -1;
        if (a.id > b.id)
            return 1;
        return 0;
    });
    parsing_groups_user.sort(function compare(a, b) {
        if (a.id < b.id)
            return -1;
        if (a.id > b.id)
            return 1;
        return 0;
    });
    res.locals.data = {
        allUser: allUser.data,
        allUserService: allUserService.data,
        roles: roles.data,
        service: service.data[0].title,
        log: log.data.reverse(),
        myUser: myUser.data[0],
        allGroups: parsing_groups_user,
        usersNoGroup: nbrUserNoGroup,
        id_service: req.query.id_service,
        allServices: allServices.data,
        avatars: avatars.data,
        availabilities: availabilities.data,
        contract: contract.data,
    };
    res.locals.navigation = navigation.Get(req, navigation.routes.backOffice.sub.services.sub.service, service.data[0].title, service.data[0].id);
    res.render('./backOffice/services/service')
});

module.exports = router;