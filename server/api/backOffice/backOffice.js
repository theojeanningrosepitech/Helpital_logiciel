var express = require('express');
var router = express.Router();
const db = require('../../database');
const axios = require("axios");
const middlewares = require('../../middlewares');

const repairRouter = require('./repair/repair');

router.use('/repair', repairRouter);
/*
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 1, res, next);
});
*/

/**
 * @swagger
 * /api/back_office:
 *   get:
 *     tags:
 *      - name : backoffice API
 *        description: Backoffice's
 *     summary: Get all backoffice's sections
 *     parameters:
 *      - in: query
 *        name: Cookie sessionID
 *        schema:
 *          type: string
 *        description: session ID
 *        example: BdKLj3RGiD67F4kOF4
 *     responses:
 *       200:
 *         description: A JSON array containing a list of all backoffice sections.
 *         example: [{
 *              "id": 1,
 *              "section_name": "section1",
 *              "section_path": "/back_office/section1",
 *              "section_display_name": "Section 1"
 *         },{
 *              "id": 2,
 *              "section_name": "section2",
 *              "section_path": "/back_office/section2",
 *              "section_display_name": "Section 2"
 *         }]
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
    const response = await db.Select(`select * from back_office`);

    if (response.err)
        res.status(500).send(response.err);
    res.send(response.data);
})

/**
 * @swagger
 * /api/back_office/user:
 *   get:
 *     tags:
 *      - name : backoffice API
 *        description: Backoffice's
 *     summary: Get all backoffice user's sections
 *     parameters:
 *      - in: query
 *        name: Cookie sessionID
 *        schema:
 *          type: string
 *        description: session ID
 *        example: BdKLj3RGiD67F4kOF4
 *     responses:
 *       200:
 *         description: A JSON array containing a list of all backoffice sections.
 *         example: {
 *              "favorite": [
 *                  {
 *                      "id": 1,
 *                      "section_name": "orders",
 *                      "section_path": "/back_office/orders",
 *                      "section_display_name": "Commandes"
 *                  },
 *                  {
 *                      "id": 2,
 *                      "section_name": "availability",
 *                      "section_path": "/back_office/availability",
 *                      "section_display_name": "Disponibilités"
 *                  }
 *              ],
 *              "section": [{
 *                  "id": 3,
 *                  "section_name": "inventory",
 *                  "section_path": "/back_office/inventory",
 *                  "section_display_name": "Inventaire"
 *                },
 *                {
 *                  "id": 4,
 *                  "section_name": "interim",
 *                  "section_path": "/back_office/interim",
 *                  "section_display_name": "Intérimaires"
 *                }]}
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/user', async function (req, res, next) {
    const userOffice = await axios.get(`${process.env.SERVER_ADDRESS}/api/user/backoffice?id=${req.query.id}`, {withCredentials: true, headers:{Cookie: 'userId=' + req.cookies.userId + ';'}});
    const backOfficeTable = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice`, {withCredentials: true, headers:{Cookie: 'userId=' + req.cookies.userId + ';'}});
    let favorite = []
    let sections = []

/*    console.log(userOffice.data)
    console.log(backOfficeTable.data)
    console.log({favorite})
    console.log({sections})*/
    if (userOffice.data.length > 0) {
        for (const section of userOffice.data) {
            if (section.is_favorited) {
                for (const sec of backOfficeTable.data)
                    if (section.section_id === sec.id)
                        favorite.push(sec);
            } else {
                for (const sec of backOfficeTable.data)
                    if (section.section_id === sec.id)
                        sections.push(sec);
            }
        }
    } else {
        sections = backOfficeTable.data;
    }
    // userOffice.data.forEach(function (section) {
    //     console.log(section.is_favorited);
    //     if (section.is_favorited) {
    //         backOfficeTable.data.forEach(function (sec) {
    //             if (section.section_id === sec.id)
    //                 favorite.push(sec);
    //         })
    //     } else {
    //         backOfficeTable.data.forEach(function (sec) {
    //             if (section.section_id === sec.id)
    //                 sections.push(sec);
    //         })
    //     }
    // })
    // const my_user = await db.Select(`select * from users WHERE id = ` + req.query.user_id);
    // const all_users = await db.Select(`select * from users`);
    // const all_messages = await db.Select(`select * from msg`);
    // const all_conversations = await db.Select(`select * from conversation`);
    // const all_roles = await db.Select(`select * from software_role`);
    //
    // if (all_users.err || all_messages.err || all_conversations.err || all_roles.err || my_user.err)
    //     res.status(500).send("Erreur Serveur /api/Rooms/Romms.js");
    //
    // const all_data = {
    //     all_users: all_users,
    //     all_messages: all_messages,
    //     all_conversations: all_conversations,
    //     all_roles: all_roles,
    //     my_user: my_user,
    //     favorite: favorite,
    //     section: sections,
    // }
    // res.send(all_data);
    res.send({favorite: favorite, section: sections});
})
module.exports = router;
