"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.management = void 0;
const auth0_1 = require("auth0");
exports.management = new auth0_1.ManagementClient({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_M2M_CLIENT_ID,
    clientSecret: process.env.AUTH0_M2M_CLIENT_SECRET,
});
