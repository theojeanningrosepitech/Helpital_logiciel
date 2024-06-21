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
 * /directory:
 *   get:
 *     tags:
 *       - directory route
 *     summary: Get the directory page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {
    try {
        const contacts = await axios.get(`${process.env.SERVER_ADDRESS}/api/contacts`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
        const myUser = await axios.get(`${process.env.SERVER_ADDRESS}/api/users?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
        const allUsers = await axios.get(`${process.env.SERVER_ADDRESS}/api/users`, {header:{cookies:req.cookies}});
        const roles = await axios.get(`${process.env.SERVER_ADDRESS}/api/roles`, {header:{cookies:req.cookies}});
        const services = await axios.get(`${process.env.SERVER_ADDRESS}/api/services`, {header:{cookies:req.cookies}});

        // append services titles
        for (let i = 0; i !== contacts.data.length; i++) {
            for (let j = 0; j !== services.data.length; j++) {
                if (contacts.data[i].service === services.data[j].id) {
                    contacts.data[i].service = services.data[j].title;
                    break;
                }
            }
        }

        console.log(myUser.data[0]);
        contacts.data.sort((a, b) => (a.fav < b.fav) ? 1 : -1);
        res.locals.data = {
            contacts: contacts.data,
            myUser: myUser.data[0],
            allUsers: allUsers.data,
            roles: roles.data,
        };
        res.locals.navigation = navigation.Get(req, navigation.routes.directory);
        res.render('./directory/directory')
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
});

/**
 * @swagger
 * /directory/fragment:
 *   get:
 *     tags:
 *       - directory route
 *     summary: Get a fragment of the directory page (only a contact/line/row)
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/fragment', async function (req, res, next) {
    try {
        const contacts = await axios.get(`${process.env.SERVER_ADDRESS}/api/contacts?id=${req.query.id}`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
        const myUser = await axios.get(`${process.env.SERVER_ADDRESS}/api/users?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});

        if (contacts.err || myUser.err) {
            console.error(contacts.err);
            console.error(myUser.err);
            res.sendStatus(500);
            return;
        }

        if (contacts.data.length === 0) {
            res.sendStatus(400);
            return;
        }

        if (contacts.data[0].service != 0) {
            const services = await axios.get(`${process.env.SERVER_ADDRESS}/api/services?id=${contacts.data[0].service}`, {header:{cookies:req.cookies}});

            if (services.err) {
                console.error(services.err);
                res.sendStatus(500);
                return;
            }

            if (contacts.data.length === 0) {
                res.sendStatus(500);
                return;
            }
            contacts.data[0].service = services.data[0].title;
        }

        res.locals.data = {
            myUser: myUser.data[0],
        };
        res.locals.contact = contacts.data[0];
        res.render('./directory/directory_fragment')
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
});

module.exports = router;
