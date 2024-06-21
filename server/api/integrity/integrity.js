var express = require('express');
var router = express.Router();
const middlewares = require('../../middlewares');
const integrity = require('../../integrity');

/*router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});*/

/**
 * @swagger
 * /api/integrity:
 *   get:
 *     tags:
 *       - integrity api
 *     summary: Check if database data integrity is valid
 *     responses:
 *       200:
 *         description: A JSON object containing the result of the request, and optionally an error message.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 exception:
 *                   type: string
 *                   example: Exception error message...
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/is-valid', async function (req, res, next) {
    let data = {
        valid: integrity.IsValid(),
        exception: ''
    };

    if ( !data.valid)
        data.exception = integrity.GetException();

    res.send(data);
});

/**
 * @swagger
 * /api/integrity/check-all-integrity:
 *   get:
 *     tags:
 *       - integrity api
 *     summary: Launch a database integrity check
 *     responses:
 *       200:
 *         description: Integrity successfully checked.
 *         content:
 *           plain/text:
 *             example: Request processed.
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/check-all-integrity', async function (req, res, next) {
    integrity.CheckAllIntegrity()

    res.send('Request processed.');
});

/**
 * @swagger
 * /api/integrity/recompute-all-integrity:
 *   get:
 *     tags:
 *       - integrity api
 *     summary: Reset all database data integrity
 *     responses:
 *       200:
 *         description: Reset successful.
 *         content:
 *           plain/text:
 *             example: Request processed.
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/recompute-all-integrity', async function (req, res, next) {
    integrity.RecomputeAllIntegrity()

    res.send('Request processed.');
});

module.exports = router;
