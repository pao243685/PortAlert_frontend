"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installerUrl = exports.createEnrollToken = exports.listHosts = exports.totpEnable = exports.totpSetup = exports.me = exports.login = exports.register = void 0;
var client_1 = require("./client");
var register = function (email, password) {
    return (0, client_1.request)("/auth/register", { method: "POST", json: { email: email, password: password } });
};
exports.register = register;
var login = function (email, password) {
    return (0, client_1.request)("/auth/login", { method: "POST", form: { username: email, password: password } });
};
exports.login = login;
var me = function () { return (0, client_1.request)("/auth/me", { auth: true }); };
exports.me = me;
var totpSetup = function () { return (0, client_1.request)("/auth/totp/setup", { method: "POST", auth: true }); };
exports.totpSetup = totpSetup;
var totpEnable = function (code) {
    return (0, client_1.request)("/auth/totp/enable", { method: "POST", json: { code: code }, auth: true });
};
exports.totpEnable = totpEnable;
var listHosts = function () { return (0, client_1.request)("/hosts", { auth: true }); };
exports.listHosts = listHosts;
var createEnrollToken = function () {
    return (0, client_1.request)("/hosts/enroll-token", { method: "POST", auth: true });
};
exports.createEnrollToken = createEnrollToken;
var installerUrl = function (token, os, base) {
    return "".concat(base, "/installers/instalar-").concat(token, ".").concat(os === "linux" ? "sh" : "ps1");
};
exports.installerUrl = installerUrl;
