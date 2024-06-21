const express = require('express');
const router = express.Router();
const axios = require('axios');
const env = require('../../env');
const navigation = require('../../navigation');
const middlewares = require('../../middlewares');

//middleware check
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 1, res, next);
});

/**
 * @swagger
 * /back_office/users:
 *   get:
 *     tags:
 *      - back_office/users route
 *     summary: Get the users list
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {
    let response = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice/user?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
    const roles = await axios.get(`${process.env.SERVER_ADDRESS}/api/roles`, {header:{cookies:req.cookies}});
    const myUser = await axios.get(`${process.env.SERVER_ADDRESS}/api/users?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
    const users = await axios.get(`${process.env.SERVER_ADDRESS}/api/users`, {header:{cookies:req.cookies}});
    const services = await axios.get(`${process.env.SERVER_ADDRESS}/api/services`, {header:{cookies:req.cookies}});
    //let users = await axios.get(`${process.env.SERVER_ADDRESS}/api/user`, {header:{cookies:req.cookies}});

    res.locals.data = {
        users: users.data,
        myUser: myUser.data[0],
        roles: roles.data,
        services: services.data,
    };

    /*let getName = function (id) {
        for (let item of roles.data) {
            if (item.id === id)
                return item.role_name;
        }
    }

    users.data.map(function (item) {
        console.log(item);
        data.push({
            id: item.id,
            firstname: item.firstname,
            lastname: item.lastname,
            login: item.login,
            role: {
                id: item.user_role,
                name: getName(item.user_role),
            },
            phone: item.phone,
            email: item.email
        })
    })*/

    res.locals.navigation = navigation.Get(req, navigation.routes.backOffice.sub.users);
    res.locals.favorites = response.data.favorite;
    res.locals.sections = response.data.section;

    res.render('./backOffice/users/users')
});

/*router.get('/', async function (req, res, next) {
    const users = await axios.get(`${process.env.SERVER_ADDRESS}/api/users`, {header:{cookies:req.cookies}});
    const myUser = await axios.get(`${process.env.SERVER_ADDRESS}/api/users?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
    //const roles = await axios.get(`${process.env.SERVER_ADDRESS}/api/roles`, {header:{cookies:req.cookies}});
    const services = await axios.get(`${process.env.SERVER_ADDRESS}/api/services`, {header:{cookies:req.cookies}});

    res.locals.data = {
        users: users.data,
        myUser: myUser.data[0],
        roles: roles.data,
        services: services.data,
    };
    res.locals.navigation = navigation.Get(req, navigation.routes.directory);
    res.render('./backOffice/users/users')
});*/

router.get('/fragment', async function (req, res, next) {

    if (!req.query.id || req.query.id == '') {
        res.sendStatus(400);
        return;
    }
    const users = await axios.get(`${process.env.SERVER_ADDRESS}/api/users?id=${req.query.id}`, {header:{cookies:req.cookies}});

    if (users.err) {
        res.sendStatus(500);
        console.error(users.err);
        return;
    } else if (users.data.length === 0) {
        res.sendStatus(400);
        return;
    }

    res.locals.user = users.data[0];
    res.render('./backOffice/users/users_fragment')
});



module.exports = router;
