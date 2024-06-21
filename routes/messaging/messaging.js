const express = require('express');
const router = express.Router();
const axios = require('axios');
const navigation = require('../navigation');
const middlewares = require('../middlewares');

/*
// router.use goal is for manage user access to route
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});*/

/**
 * @swagger
 * /messaging:
 *   get:
 *     tags:
 *      - messaging route
 *     summary: Get all messages and all conversation of the user
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {
/*    try {
        const users = await axios.get(`${process.env.SERVER_ADDRESS}/api/users`, {header:{cookies:req.cookies}});
        const myUser = await axios.get(`${process.env.SERVER_ADDRESS}/api/users?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
        const messages = await axios.get(`${process.env.SERVER_ADDRESS}/api/messages`, {header:{cookies:req.cookies}});
        const conversations = await axios.get(`${process.env.SERVER_ADDRESS}/api/conversations?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
        const roles = await axios.get(`${process.env.SERVER_ADDRESS}/api/roles`, {header:{cookies:req.cookies}});

        if (users.err || myUser.err || messages.err || conversations.err || roles.err)
            res.sendStatus(500);

        res.locals.data = {
            myUser: myUser.data[0],
            users: users.data,
            messages: messages.data,
            conversations: conversations.data,
            roles: roles.data,
        };
        res.locals.navigation = navigation.Get(req, navigation.routes.messages);
        res.render('./messaging/messaging')
    } catch (e) {
        res.sendStatus(500);
    }
*/
    try {
        let conversation = null;
        let messages = null;
        const allUsers = await axios.get(`${process.env.SERVER_ADDRESS}/api/users`, {header:{cookies:req.cookies}});
        const conversations = await axios.get(`${process.env.SERVER_ADDRESS}/api/conversations/all_conv`, {header:{cookies:req.cookies}});
        for (let i = 0; conversations.data[i]; i++) {
            if (conversations.data[i].group_conv == 2) {
                conversation = await axios.get(`${process.env.SERVER_ADDRESS}/api/conversations?id_conv=${conversations.data[i].id}`, {header: {cookies: req.cookies}});
                messages = await axios.get(`${process.env.SERVER_ADDRESS}/api/messages?id_conv=${conversation.data[0].id}`, {header:{cookies:req.cookies}});
                if (conversation.err || messages.err) {
                    console.error(messages.err);
                    console.error(conversation.err);
                    res.sendStatus(500);
                    return;
                } else if (messages.length === 0) {
                    res.sendStatus(400);
                    return;
                }
                break;
            }
        }
        const myUser = await axios.get(`${process.env.SERVER_ADDRESS}/api/users?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
        const insult = await axios.get(`${process.env.SERVER_ADDRESS}/api/insult`, {header:{cookies:req.cookies}});
        const roles = await axios.get(`${process.env.SERVER_ADDRESS}/api/roles`, {header:{cookies:req.cookies}});
        const services = await axios.get(`${process.env.SERVER_ADDRESS}/api/services`, {header:{cookies:req.cookies}});

        if (allUsers.err) {
            console.error(allUsers.err);
            res.sendStatus(500);
            return;
        }
        if (conversation == null) {
            res.locals.data = {
                allUsers: allUsers.data,
                myUserID: req.cookies.userId,
                myUser: myUser.data[0],
                messages: null,
                conversations: conversations.data,
                conversation: null,
                nbrMessages: null,
                insult: insult.data,
                roles: roles.data,
                services: services.data,
                convId: req.query.convId,
            };
        } else {
            res.locals.data = {
                allUsers: allUsers.data,
                myUserID: req.cookies.userId,
                myUser: myUser.data[0],
                messages: messages.data,
                conversations: conversations.data,
                conversation: conversation.data[0],
                nbrMessages: messages.data.length,
                insult: insult.data,
                roles: roles.data,
                services: services.data,
                convId: req.query.convId,
            };
        }
        res.locals.navigation = navigation.Get(req, navigation.routes.messages);
        res.render('./messaging/messaging')
    } catch (e) {
        res.sendStatus(500);
    }
});

/**
 * @swagger
 * /messaging:
 *   get:
 *     summary: Get all messages and all conversation of the user
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/fragment', async function (req, res, next) {
    try {
        const users = await axios.get(`${process.env.SERVER_ADDRESS}/api/users`, {header:{cookies:req.cookies}});
        const myUser = await axios.get(`${process.env.SERVER_ADDRESS}/api/users?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
        const messages = await axios.get(`${process.env.SERVER_ADDRESS}/api/messages`, {header:{cookies:req.cookies}});
        const conversations = await axios.get(`${process.env.SERVER_ADDRESS}/api/conversations?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
        const roles = await axios.get(`${process.env.SERVER_ADDRESS}/api/roles`, {header:{cookies:req.cookies}});

        if (users.err || myUser.err || messages.err || conversations.err || roles.err) {
            res.sendStatus(500);
            return;
        }
        res.locals.data = {
            myUser: myUser.data[0],
            users: users.data,
            messages: messages.data.reverse(),
            conversations: conversations.data,
            roles: roles.data,
        };
        res.locals.navigation = navigation.Get(req, navigation.routes.messages);
        res.render('./messaging/messaging_fragment')
    } catch (e) {
        res.sendStatus(500);
    }
});

/**
 * @swagger
 * /messaging/dynam:
 *   get:
 *     tags:
 *      - messaging route
 *     summary: Get conversation in the widget
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/dynam', async function (req, res, next) {
    try {
        const allUsers = await axios.get(`${process.env.SERVER_ADDRESS}/api/users`, {header:{cookies:req.cookies}});
        const messages = await axios.get(`${process.env.SERVER_ADDRESS}/api/messages?id=${req.query.id}`, {header:{cookies:req.cookies}});
        const myUser = await axios.get(`${process.env.SERVER_ADDRESS}/api/users?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});

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
        };
        res.locals.message = messages.data[0];
        res.render('./messaging/messaging_dynam')
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
});

/**
 * @swagger
 * /messaging/widget:
 *   get:
 *     tags:
 *      - messaging route
 *     summary: Get conversation in the widget
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/widget', async function (req, res, next) {
    try {
        const allUsers = await axios.get(`${process.env.SERVER_ADDRESS}/api/users`, {header:{cookies:req.cookies}});
        const conversations = await axios.get(`${process.env.SERVER_ADDRESS}/api/conversations/all_conv`, {header:{cookies:req.cookies}});
        const conversation = await axios.get(`${process.env.SERVER_ADDRESS}/api/conversations?id_conv=${req.query.id_conv}`, {header: {cookies: req.cookies}});
        const messages = await axios.get(`${process.env.SERVER_ADDRESS}/api/messages?id_conv=${conversation.data[0].id}`, {header:{cookies:req.cookies}});
        const myUser = await axios.get(`${process.env.SERVER_ADDRESS}/api/users?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
        const insult = await axios.get(`${process.env.SERVER_ADDRESS}/api/insult`, {header:{cookies:req.cookies}});
        const roles = await axios.get(`${process.env.SERVER_ADDRESS}/api/roles`, {header:{cookies:req.cookies}});
        const services = await axios.get(`${process.env.SERVER_ADDRESS}/api/services`, {header:{cookies:req.cookies}});

        if (allUsers.err || messages.err) {
            console.error(messages.err);
            console.error(allUsers.err);
            res.sendStatus(500);
            return;
        } else if (messages.length === 0) {
            res.sendStatus(400);
            return;
        }
        res.locals.data = {
            allUsers: allUsers.data,
            myUserID: req.cookies.userId,
            myUser: myUser.data[0],
            messages: messages.data,
            conversations: conversations.data,
            conversation: conversation.data[0],
            nbrMessages: messages.data.length,
            insult: insult.data,
            roles: roles.data,
            services: services.data,
            convId: req.query.convId,
        };
        res.render('./messaging/messaging_widget')
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
});

module.exports = router;
