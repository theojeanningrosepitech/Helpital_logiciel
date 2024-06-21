const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * @swagger
 * /reset-password:
 *   get:
 *     tags:
 *       - auth route
 *     summary: Get the reset_password page
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: oEiZk4uR5kfjf394sk
 *     parameters:
 *      - in: query
 *        name: token
 *        schema:
 *          type: string
 *        description: Reset password token (received via email)
 *        example: oEiZk4uR5kfjf394sk
 *     responses:
 *       200:
 *         description: Request successfully executed OR send an error message
 */
router.get('/', async function (req, res, next) {

    if (!req.query.token || req.query.token === '') {
        res.sendStatus(404);
        return;
    }
    const errorMsg = 'Ce lien n\'est pas/plus valide.';

    try {
        const response = await axios.get(`${process.env.SERVER_ADDRESS}/api/users/check-temporary-token?token=${req.query.token}`);

        if ( !response.data) {
            res.send(errorMsg);
            return;
        }
        res.locals.title = 'Réinitialisation mot de passe';
        res.locals.data = {
            token: req.query.token
        };
        res.render('./login/reset_password');

    } catch (e) {
        res.send(errorMsg);
    }
});

module.exports = router;
