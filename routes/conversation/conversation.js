const express = require('express');
const router = express.Router();
const axios = require('axios');
const navigation = require('../navigation');
const middlewares = require('../middlewares');
const {JSONStream} = require("mocha/lib/reporters");

// router.use goal is for manage user access to route
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});

/**
 * @swagger
 * /conversation:
 *   get:
 *     tags:
 *      - conversation route
 *     summary: Get details of conversation
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {
    try {
        const allUsers = await axios.get(`${process.env.SERVER_ADDRESS}/api/users`, {header:{cookies:req.cookies}});
        const conversation = await axios.get(`${process.env.SERVER_ADDRESS}/api/conversations?id_conv=${req.query.id_conv}`, {header:{cookies:req.cookies}});
        const messages = await axios.get(`${process.env.SERVER_ADDRESS}/api/messages?id_conv=${conversation.data[0].id}`, {header:{cookies:req.cookies}});
        const myUser = await axios.get(`${process.env.SERVER_ADDRESS}/api/users?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
        const insult = await axios.get(`${process.env.SERVER_ADDRESS}/api/insult`, {header:{cookies:req.cookies}});
        const roles = await axios.get(`${process.env.SERVER_ADDRESS}/api/roles`, {header:{cookies:req.cookies}});
        const services = await axios.get(`${process.env.SERVER_ADDRESS}/api/services`, {header:{cookies:req.cookies}});
        const patients = await axios.get(`${process.env.SERVER_ADDRESS}/api/patients`, {header:{cookies:req.cookies}});

        if (conversation.err || messages.err) {
            res.sendStatus(500);
            return;
        }
        res.locals.data = {
            allUsers: allUsers.data,
            myUserID: req.cookies.userId,
            myUser: myUser.data[0],
            messages: messages.data,
            conversation: conversation.data[0],
            usersConv: conversation.data[0].user_id.split(','),
            nbrMessages: messages.data.length,
            insult: insult.data,
            roles: roles.data,
            services: services.data,
            patients: patients.data.patients
        };
        res.locals.navigation = navigation.Get(req, navigation.routes.messages);
        res.render('./conversation/conversation')
    } catch (e) {
        res.sendStatus(500);
    }
});

/**
 * @swagger
 * /conversation/fragment:
 *   get:
 *     tags:
 *      - conversation route
 *     summary: Get conversation in the fragment
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/fragment', async function (req, res, next) {
    try {
        const allUsers = await axios.get(`${process.env.SERVER_ADDRESS}/api/users`, {header:{cookies:req.cookies}});
        const messages = await axios.get(`${process.env.SERVER_ADDRESS}/api/messages?id=${req.query.id}`, {header:{cookies:req.cookies}});
        const myUser = await axios.get(`${process.env.SERVER_ADDRESS}/api/users?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
        const patients = await axios.get(`${process.env.SERVER_ADDRESS}/api/patients`, {header:{cookies:req.cookies}});

        if (allUsers.err || messages.err) {
            console.error(messages.err);
            console.error(allUsers.err);
            res.sendStatus(500);
            return;
        } else if (messages.length === 0) {
            res.sendStatus(400);
            return;
        }
        const conversation = await axios.get(`${process.env.SERVER_ADDRESS}/api/conversations?id_conv=${messages.data[0].conversation_id}`, {header:{cookies:req.cookies}});

        if (conversation.err) {
            console.error(conversation.err);
            res.sendStatus(500);
            return;
        }
        res.locals.data = {
            allUsers: allUsers.data,
            myUserID: req.cookies.userId,
            myUser: myUser.data[0],
            conversation: conversation.data[0],
            patients: patients.data.patients
        };
        res.locals.message = messages.data[0];
        res.render('./conversation/conversation_fragment')
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
});

module.exports = router;
