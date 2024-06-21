const express = require('express');
const router = express.Router();
const axios = require('axios');
const navigation = require('../navigation');
const middlewares = require('../middlewares');

// router.use goal is for manage user access to route
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 4, res, next);
});

/**
 * @swagger
 * /inventory:
 *   get:
 *     tags:
 *       - inventory api
 *     summary: Get inventory page (list OR single item)
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: (optional)
 *        example: 14
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {

    // get a single inventory object
    if (req.query.id) {
        const inventory = await axios.get(`${process.env.SERVER_ADDRESS}/api/inventory?id=${req.query.id}`, {header:{cookies:req.cookies}});
        console.log("inventory.data");

        if (inventory.data.length === 0) {
            res.status(400);
            return;
        }
        res.locals.navigation = navigation.Get(req, navigation.routes.inventory.sub.inventory, inventory.data[0].title, req.query.id);
        res.locals.data = inventory.data[0];

        res.render('./inventory/item')
    } else { // get several inventory objects
        const inventory = await axios.get(`${process.env.SERVER_ADDRESS}/api/inventory`, {header:{cookies:req.cookies}});
        console.log("inventory.datasdfghjk");
        console.log(inventory.data[0]);
        res.locals.navigation = navigation.Get(req, navigation.routes.inventory);
        res.locals.data = {
            inventory: inventory.data.sort((a, b) => (a.update_date < b.update_date) ? 1 : -1),
        };
        res.render('./inventory/inventory')
    }
});

module.exports = router;
