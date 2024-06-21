/** This module contains 'global' variables extracted from environment configuration file.
 * @module env
 * @requires dotenv
 */

require('dotenv').config();

/**
 * Boolean value to enable/disable the two factor authentication during login.
 */
const TwoFactorAuth = (process.env.TWO_FACTOR_AUTH === 'enabled');
/**
 * Server address to use in external/API links.
 */
const ServerAddr = process.env.SERVER_ADDRESS;

module.exports = {
    ServerAddr: ServerAddr,
    TwoFactorAuth: TwoFactorAuth
}
