var express = require('express');
var router = express.Router();
const db = require('../../database');
const axios = require("axios");
const middlewares = require('../../middlewares');
const websocket = require('../../websocket');
const utils = require('../../utils');

// router.use goal is for manage user access to route
/*router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});*/

/**
 * @swagger
 * /api/user:
 *   get:
 *     tags:
 *      - user api
 *     summary: Get a list of users
 *     parameters:
 *      - in: query
 *        name: Cookie sessionID
 *        schema:
 *          type: string
 *        description: session ID
 *        example: BdKLj3RGiD67F4kOF4
 *     responses:
 *       200:
 *         description: A JSON array containing a list of all users.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/', async function (req, res, next) {
    const response = await db.Select(`SELECT * from users`);

    if (response.err)
        res.sendStatus(500).send(response.err);
    else
        res.send(response.data);
})


/**
 * @swagger
 * /api/user:
 *   get:
 *     tags:
 *      - user api
 *     summary: Get a login of user
 *     parameters:
 *      - in: query
 *        name: Cookie sessionID
 *        schema:
 *          type: string
 *        description: session ID
 *        example: BdKLj3RGiD67F4kOF4
 *     responses:
 *       200:
 *         description: A JSON array containing a list of information about one user login, id, firstname, lastname.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/login', async function (req, res, next) {
    const id = req.query.id;
    const response = await db.Select(`SELECT login, id, firstname, lastname from users where id = '${id}'`);

    if (response.err)
        res.status(500).send(response.err);
    else
        res.send(response.data);
});

/**
 * @swagger
 * /api/user:
 *   get:
 *     tags:
 *      - user api
 *     summary: Get password for a user
 *     responses:
 *       200:
 *         description: A JSON array containing a password.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/password', async function (req, res, next) {
    const userLogin = req.query.userLogin;
    const response = await db.Select(`SELECT password from users where login like '${userLogin}'`);

    if (response.err)
        res.sendStatus(500).send(response.err);
    res.send(response.data[0].password);
});

/**
 * @swagger
 * /api/user:
 *   get:
 *     tags:
 *      - user api
 *     summary: Get an ID for a user
 *     responses:
 *       200:
 *         description: A JSON array containing an ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/id', async function (req, res, next) {
    const userLogin = req.query.userLogin;
    const response = await db.Select(`SELECT id from users where login like '${userLogin}'`);

    if (response.err)
        res.status(500).send(response.err);
    res.send({id: response.data[0].id});
});

// /api/user/backoffice
router.get('/backoffice', async function (req, res, next) {
    const userId = req.query.id;
    const response = await db.Select(`select section_id, is_favorited from users_back_office where user_id = ${userId}`);

    if (response.err)
        res.status(500).send(response.err);
    res.send(response.data);
});

/**
 * @swagger
 * /api/user:
 *   get:
 *     tags:
 *      - user apiPUT
 *     summary: Get role for a user
 *     responses:
 *       200:
 *         description: A JSON array containing a role.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.put('/role', async function (req, res, next) {
    let newRole = req.body.role_id;
    let userId = req.body.user_id;

    const wait = await db.UpdateData('users', userId, { role: newRole });
    websocket.sendMessage(req, 'update', 'user', { id: userId }, newRole, null);
})

router.put('/avatar', async function (req, res, next) {
    let newAvatar = req.body.avatar;
    let userId = req.body.userId;

    const wait = await utils.PutController(req, res, "users");
    websocket.sendMessage(req, 'update', 'user', { id: userId }, newAvatar, null);
    return res;
})

router.put('/banner', async function (req, res, next) {
    let newBanner = req.body.banner;
    let userId = req.body.userId;

    const wait = await utils.PutController(req, res, "users");
    websocket.sendMessage(req, 'update', 'user', { id: userId }, newBanner, null);
    return res;
})

module.exports = router;
