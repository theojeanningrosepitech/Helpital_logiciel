const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * @swagger
 * /restaurants:
 *   get:
 *     tags:
 *      - restaurants route
 *     summary: Get the restaurants page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {
    let restaurants = await axios.get('http://localhost:3000/api/restauration');
    let menu_relais_h = await axios.get('http://localhost:3000/api/restauration/relais_h');
    let menu_medirest = await axios.get('http://localhost:3000/api/restauration/medirest');
    let menu_helpifood = await axios.get('http://localhost:3000/api/restauration/helpifood');

    res.locals.restaurants = restaurants.data;
    res.locals.menu_relais_h = menu_relais_h.data;
    res.locals.menu_medirest = menu_medirest.data;
    res.locals.menu_helpifood = menu_helpifood.data;

    res.render('./restauration/restauration')
});

module.exports = router;