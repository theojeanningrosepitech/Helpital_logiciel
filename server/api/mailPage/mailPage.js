var express = require('express');
var router = express.Router();
const db = require('../../database');
const utils = require('../../utils');
const axios = require("axios");
const mails = require("../../mails");

/**
 * @swagger
 * /api/mailPage:
 *   get:
 *     tags:
 *      - mailPage api
 *     summary: Get a list of inventory
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: string
 *        description: inventory object ID
 *        example: 1
 *      - in: query
 *        name: room_id
 *        schema:
 *          type: integer
 *        description: room ID
 *        example: 1
 *      - in: query
 *        name: search
 *        schema:
 *          type: string
 *        description: search input
 *        example: inventory object name
 *      - in: query
 *        name: room_type
 *        schema:
 *          type: integer
 *        description: type of room
 *        example: 1
 *      - in: query
 *        name: floor
 *        schema:
 *          type: integer
 *        description: room floor
 *        example: 0
 *      - in: query
 *        name: service_id
 *        schema:
 *          type: integer
 *        description: service ID the room belongs to
 *        example: 1
 *     responses:
 *       200:
 *         description: A JSON array containing a list of inventory objects.
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
    const response = await db.Select(`select * from inventory`);

    if (response.err)
        res.status(500).send(response.err);
    res.send(response);
});

/**
 * @swagger
 * /api/mailPage/send_email:
 *   get:
 *     tags:
 *      - mailPage/send_email api
 *     summary: Get the informations of the email sender
 *     parameters:
 *      - in: query
 *        name: subject
 *        schema:
 *          type: string
 *        description: subject of the mail
 *        example: Contact
 *      - in: query
 *        name: dest
 *        schema:
 *          type: string
 *        description: mail of the recipient
 *        example: example@gmail.com
 *      - in: query
 *        name: message
 *        schema:
 *          type: string
 *        description: message of the mail
 *        example: Bonjour, je souahite établir un contact 
 *     responses:
 *       200:
 *         description: A JSON array containing the informations of the email sendeer.
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
router.get('/send_email', async function (req, res, next) {
    const dest = req.query.dest;
    const subject = req.query.subject
    const message = req.query.message;
    const response = mails.Send([dest], subject, message);
    if (response) {
        res.status(200).send({
            status: 'good'
        });
        return;
    } else {
        res.status(401).send();
        return;
    }

});

/**
 * @swagger
 * /api/mailPage:
 *   delete:
 *     tags:
 *      - mailPage api
 *     summary: Remove an object in the inventory
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: ID of the object to delete 
 *        example: 2
 *     responses:
 *       200:
 *         description: Event successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   example: Row deleted
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.delete('/', async function(req, res) {
    return utils.DeleteRow(req, res, 'inventory');
});

module.exports = router;
