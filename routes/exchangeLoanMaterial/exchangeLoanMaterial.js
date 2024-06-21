const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * @swagger
 * /exchange_loan_material:
 *   get:
 *     tags:
 *      - exchange/loan material route
 *     summary: Get the exchange/loan page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {
    let exchangeLoanMaterials = await axios.get('http://localhost:3000/api/inventory');
    let inventory_other_hospitals = await axios.get('http://localhost:3000/api/inventory_other_hospital');

    res.locals.exchangeLoanMaterials = exchangeLoanMaterials.data;
    res.locals.inventory_other_hospitals = inventory_other_hospitals.data;

    res.render('./exchangeLoanMaterial/exchangeLoanMaterial')
});

module.exports = router;