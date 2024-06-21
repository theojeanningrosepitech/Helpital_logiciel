const express = require('express');
const router = express.Router();
const axios = require('axios');
const middlewares = require('../middlewares');
const utils = require('../utils');

// router.use goal is for manage user access to route
/*router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 4, res, next);
});*/

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - auth route
 *     summary: Log a user by form
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               login:
 *                 type: string
 *                 example: arthur.petit
 *               password:
 *                 type: string
 *                 example: password
 *               device_type:
 *                 type: integer
 *                 example: 0
 *               machineId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       502:
 *         description: Redirected to an error message page.
 */
router.post('/login', async function (req, res, next) {

    try {
        // login user through API
        const response = await axios.post(`${process.env.SERVER_ADDRESS}/api/auth/login`, {
            device_type: 0,
            login: req.body.login,
            password: req.body.password,
            machineId: req.body.machineId
        }, {
            withCredentials: true,
            headers:{Cookie: utils.GetRawCookie(req.cookies)}
        });

        // Check if 2FA is required
        if (response.data.type === '2FA') {
            // set 2FA token cookie and continue the login flow
            res.cookie('token-2FA', response.data.token);
            res.redirect(`/auth/2fa/${response.data.prefered_sending_method}`);
        } else {
            // set cookies received from API /login request
            res.header('set-cookie', response.headers['set-cookie']);
            res.redirect('/dashboard');
        }

        // Save last connected user on the machine
        axios.get(`${process.env.SERVER_ADDRESS}/api/user/id?userLogin=${req.body.login}`).then(async function (response) {
            const userId = response.data.id;
            const resp = await axios.get(`${process.env.SERVER_ADDRESS}/api/machine/users?id=${req.body.machineId}`)

            for (const item of resp.data) {
             // console.log(item, response.data);
                if (item.user_id === response.data.id) {
                    await axios.put(`${process.env.SERVER_ADDRESS}/api/machine/users/id`, {
                        userId: response.data.id
                    })
                    return;
                }
            }
            // Store the machineId of the userId if it's the first connection (fast login history)
            await axios.post(`${process.env.SERVER_ADDRESS}/api/machine/users`, {
                machineId: req.body.machineId,
                userId: response.data.id
            })
        // console.log({cookies: res.cookies});
        // console.log("Oui il faut bien insert maintenant dans la table machines_users !!!!");
        });
    } catch (e) {
        res.redirect('/?err=login');
    }
});

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     tags:
 *       - auth route
 *     summary: Logout the current user session
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       502:
 *         description: Redirected to the main page (planning)
 */
router.get('/logout', async function (req, res, next) {

    try {
        response = await axios.get(`${process.env.SERVER_ADDRESS}/api/auth/logout`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
        // set cookies values to default
        res.cookie('sessionID', '');
        res.cookie('userId', '');
        res.redirect('/'); // login page
    } catch (e) {
        console.error(e);
        res.redirect('/dashboard');
    }
});

module.exports = router;
