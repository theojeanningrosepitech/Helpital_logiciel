const axios = require('axios');
// const env = require('./env');

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
        res.status(403).render('./forbidden/forbidden.pug');
        //res.send("403 Access forbidden");
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
    const role = await axios.get(`${process.env.SERVER_ADDRESS}/api/users/role?user_id=${userID}`);

    return (role.data.user_role <= neededRole);
}

module.exports = {
    RoleMiddleware: RoleMiddleware,
    CanAccess: CanAccess
}
