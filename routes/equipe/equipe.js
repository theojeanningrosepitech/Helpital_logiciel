const express = require('express');
const router = express.Router();
const axios = require('axios');
const navigation = require('../navigation');
const middlewares = require('../middlewares')

// router.use goal is for manage user access to route
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});

/**
 * @swagger
 * /equipe:
 *   get:
 *     tags:
 *      - team route
 *     summary: Get your team in page "Mon équipe"
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {
    const myUser = await axios.get(`${process.env.SERVER_ADDRESS}/api/users?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
    const allUserService = await axios.get(`${process.env.SERVER_ADDRESS}/api/users?service=${myUser.data[0].service}`, {header:{cookies:req.cookies}});
    const service = await axios.get(`${process.env.SERVER_ADDRESS}/api/services?id=${myUser.data[0].service}`, {header:{cookies:req.cookies}});
    const roles = await axios.get(`${process.env.SERVER_ADDRESS}/api/roles`, {header:{cookies:req.cookies}});
    const allGroups = await axios.get(`${process.env.SERVER_ADDRESS}/api/services/groups?service_id=${myUser.data[0].service}`, {header:{cookies:req.cookies}});
    let parsing_groups_user = [];

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
        myUser: myUser.data[0],
        allUser: allUserService.data,
        service: service.data[0].title,
        allGroups: parsing_groups_user,
        roles: roles.data,
        id_service: myUser.data[0].service,
    };
    res.locals.navigation = navigation.Get(req, navigation.routes.equipe);
    res.render('./equipe/equipe')
});

module.exports = router;