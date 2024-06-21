/**
 * @module middlewares
 * @requires axios
 */
const axios = require('axios');

/**
 * Check if a user has rights to access a ressource, check if his role-level is lower or equal to {neededRole}
 * @param {integer} userID - User identifier
 * @param {integer} neededRole - Role level to check
 * @param {Http.Response} res - If user is not allowed to access the ressource, the response will be filled with a 403 code and an error message
 * @param {function} nextCallback - Function called if the user is allowed to access the ressource
 * @param {function} forbiddenCallback - (optional) Function called if the user is not allowed to access the ressource
 */
async function RoleMiddleware(userID, neededRole, res, nextCallback, forbiddenCallback) {

    if (await CanAccess(userID, neededRole))
        nextCallback();
    else if (forbiddenCallback)
        forbiddenCallback();
    else {
        res.status(403).send("code d'erreur 403, l'utilisateur n'a pas les droits.")
    }
}

/**
 * Check if a user has rights to access a ressource, check if his role-level is lower or equal to {neededRole}
 * @param {integer} userID - User identifier
 * @param {integer} neededRole - Role level to check
 */
async function CanAccess(userID, neededRole) {

    if ( !userID)
        return false;
    const role = await db.Select(`SELECT user_role FROM users WHERE id = ${userID} LIMIT 1`);

    if (role.err) {
        console.error(err);
        return false;
    }

    if (role.data.length !== 1)
        return false;
    else
        return (role.data[0] <= neededRole);
}

module.exports = {
    RoleMiddleware: RoleMiddleware,
    CanAccess: CanAccess
}
