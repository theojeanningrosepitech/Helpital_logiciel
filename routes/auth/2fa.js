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
 * /auth/2fa/method:
 *   get:
 *     tags:
 *       - auth route
 *     summary: Get enabled 2FA connexion methods
 *     responses:
 *       200:
 *         description: Request successfully executed.
 */
router.get('/method', async function (req, res, next) {
    res.locals.title = 'Connexion 2FA';
    const totp = await axios.get(`${process.env.SERVER_ADDRESS}/api/auth/totp-2fa`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});

    res.locals.data = {
        enableSMS: (process.env.TWILIO_AUTH_TOKEN != ''),
        totpEnabled: totp.data
    };
    res.render('./2fa/method');
});

/**
 * @swagger
 * /auth/2fa/email:
 *   get:
 *     tags:
 *       - auth route
 *     summary: Get email address to be used in the current 2FA login session
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       502:
 *         description: Redirected to an error message page.
 */
router.get('/email', async function (req, res, next) {
    try {
        const response = await axios.get(`${process.env.SERVER_ADDRESS}/api/auth/2fa/send?method=email`, {
            withCredentials: true,
            headers:{Cookie: utils.GetRawCookie(req.cookies)}
        });

        res.locals.title = 'Connexion 2FA email';
        res.locals.data = {
            receiver: response.data.receiver,
        };
        res.render('./2fa/email');
    } catch (e) {
        console.error(e);
        res.redirect('/?err=2FA');
    }
});

/**
 * @swagger
 * /auth/2fa/sms:
 *   get:
 *     tags:
 *       - auth route
 *     summary: Get phone number to be used in the current 2FA login session
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       502:
 *         description: Redirected to an error message page.
 */
router.get('/sms', async function (req, res, next) {
    try {
        const response = await axios.get(`${process.env.SERVER_ADDRESS}/api/auth/2fa/send?method=sms`, {
            withCredentials: true,
            headers:{Cookie: utils.GetRawCookie(req.cookies)}
        });

        res.locals.title = 'Connexion 2FA SMS';
        res.locals.data = {
            receiver: response.data.receiver,
        };
        res.render('./2fa/sms');
    } catch (e) {
        console.error(e);
        res.redirect('/?err=2FA');
    }
});

/**
 * @swagger
 * /auth/2fa/totp:
 *   get:
 *     tags:
 *       - auth route
 *     summary: Get a login page asking to input the 2FA TOTP code
 *     responses:
 *       200:
 *         description: Request successfully executed.
 */
router.get('/totp', async function (req, res, next) {
    res.locals.title = 'Connexion 2FA TOTP';
    res.render('./2fa/totp');
});

/**
 * @swagger
 * /auth/2fa/login:
 *   post:
 *     tags:
 *       - auth route
 *     summary: Log a user by form from a 2FA session
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: oEiZk4uR5kfjf394sk
 *               method:
 *                 type: string
 *                 example: sms
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       502:
 *         description: Redirected to an error message page.
 */
router.post('/login', async function (req, res, next) {
    try {
        // Log the user using the API
        const response = await axios.post(`${process.env.SERVER_ADDRESS}/api/auth/2fa/login`, {
            code: req.body.code,
            method: req.body.method
        }, {
            withCredentials: true,
            headers:{Cookie: utils.GetRawCookie(req.cookies)}
        });
        // set the cookies received from the successful /login request
        res.header('set-cookie', response.headers['set-cookie']);
        res.redirect('/dashboard');
    } catch (e) {
        console.error(e);
        // display an error
        res.redirect('/?err=login');
    }
});

module.exports = router;
