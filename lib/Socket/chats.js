"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeChatsSocket = void 0;
var boom_1 = require("@hapi/boom");
var WAProto_1 = require("../../WAProto");
var Defaults_1 = require("../Defaults");
var Types_1 = require("../Types");
var Utils_1 = require("../Utils");
var make_mutex_1 = require("../Utils/make-mutex");
var process_message_1 = require("../Utils/process-message");
var WABinary_1 = require("../WABinary");
var socket_1 = require("./socket");
var MAX_SYNC_ATTEMPTS = 2;
var makeChatsSocket = function (config) {
    var logger = config.logger, markOnlineOnConnect = config.markOnlineOnConnect, fireInitQueries = config.fireInitQueries, appStateMacVerification = config.appStateMacVerification, shouldIgnoreJid = config.shouldIgnoreJid, shouldSyncHistoryMessage = config.shouldSyncHistoryMessage;
    var sock = (0, socket_1.makeSocket)(config);
    var ev = sock.ev, ws = sock.ws, authState = sock.authState, generateMessageTag = sock.generateMessageTag, sendNode = sock.sendNode, query = sock.query, onUnexpectedError = sock.onUnexpectedError;
    var privacySettings;
    var needToFlushWithAppStateSync = false;
    var pendingAppStateSync = false;
    /** this mutex ensures that the notifications (receipts, messages etc.) are processed in order */
    var processingMutex = (0, make_mutex_1.makeMutex)();
    /** helper function to fetch the given app state sync key */
    var getAppStateSyncKey = function (keyId) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, _b, key;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, authState.keys.get('app-state-sync-key', [keyId])];
                case 1:
                    _a = _c.sent(), _b = keyId, key = _a[_b];
                    return [2 /*return*/, key];
            }
        });
    }); };
    var fetchPrivacySettings = function () {
        var args_1 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args_1[_i] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (force) {
            var content;
            if (force === void 0) { force = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(!privacySettings || force)) return [3 /*break*/, 2];
                        return [4 /*yield*/, query({
                                tag: 'iq',
                                attrs: {
                                    xmlns: 'privacy',
                                    to: WABinary_1.S_WHATSAPP_NET,
                                    type: 'get'
                                },
                                content: [
                                    { tag: 'privacy', attrs: {} }
                                ]
                            })];
                    case 1:
                        content = (_a.sent()).content;
                        privacySettings = (0, WABinary_1.reduceBinaryNodeToDictionary)(content === null || content === void 0 ? void 0 : content[0], 'category');
                        _a.label = 2;
                    case 2: return [2 /*return*/, privacySettings];
                }
            });
        });
    };
    /** helper function to run a privacy IQ query */
    var privacyQuery = function (name, value) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, query({
                        tag: 'iq',
                        attrs: {
                            xmlns: 'privacy',
                            to: WABinary_1.S_WHATSAPP_NET,
                            type: 'set'
                        },
                        content: [{
                                tag: 'privacy',
                                attrs: {},
                                content: [
                                    {
                                        tag: 'category',
                                        attrs: { name: name, value: value }
                                    }
                                ]
                            }]
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var updateCallPrivacy = function (value) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, privacyQuery('calladd', value)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var updateLastSeenPrivacy = function (value) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, privacyQuery('last', value)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var updateOnlinePrivacy = function (value) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, privacyQuery('online', value)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var updateProfilePicturePrivacy = function (value) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, privacyQuery('profile', value)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var updateStatusPrivacy = function (value) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, privacyQuery('status', value)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var updateReadReceiptsPrivacy = function (value) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, privacyQuery('readreceipts', value)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var updateGroupsAddPrivacy = function (value) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, privacyQuery('groupadd', value)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var updateDefaultDisappearingMode = function (duration) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, query({
                        tag: 'iq',
                        attrs: {
                            xmlns: 'disappearing_mode',
                            to: WABinary_1.S_WHATSAPP_NET,
                            type: 'set'
                        },
                        content: [{
                                tag: 'disappearing_mode',
                                attrs: {
                                    duration: duration.toString()
                                }
                            }]
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    /** helper function to run a generic IQ query */
    var interactiveQuery = function (userNodes, queryNode) { return __awaiter(void 0, void 0, void 0, function () {
        var result, usyncNode, listNode, users;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, query({
                        tag: 'iq',
                        attrs: {
                            to: WABinary_1.S_WHATSAPP_NET,
                            type: 'get',
                            xmlns: 'usync',
                        },
                        content: [
                            {
                                tag: 'usync',
                                attrs: {
                                    sid: generateMessageTag(),
                                    mode: 'query',
                                    last: 'true',
                                    index: '0',
                                    context: 'interactive',
                                },
                                content: [
                                    {
                                        tag: 'query',
                                        attrs: {},
                                        content: [queryNode]
                                    },
                                    {
                                        tag: 'list',
                                        attrs: {},
                                        content: userNodes
                                    }
                                ]
                            }
                        ],
                    })];
                case 1:
                    result = _a.sent();
                    usyncNode = (0, WABinary_1.getBinaryNodeChild)(result, 'usync');
                    listNode = (0, WABinary_1.getBinaryNodeChild)(usyncNode, 'list');
                    users = (0, WABinary_1.getBinaryNodeChildren)(listNode, 'user');
                    return [2 /*return*/, users];
            }
        });
    }); };
    var onWhatsApp = function () {
        var jids = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            jids[_i] = arguments[_i];
        }
        return __awaiter(void 0, void 0, void 0, function () {
            var query, list, results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = { tag: 'contact', attrs: {} };
                        list = jids.map(function (jid) {
                            // insures only 1 + is there
                            var content = "+".concat(jid.replace('+', ''));
                            return {
                                tag: 'user',
                                attrs: {},
                                content: [{
                                        tag: 'contact',
                                        attrs: {},
                                        content: content,
                                    }],
                            };
                        });
                        return [4 /*yield*/, interactiveQuery(list, query)];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results.map(function (user) {
                                var contact = (0, WABinary_1.getBinaryNodeChild)(user, 'contact');
                                return { exists: (contact === null || contact === void 0 ? void 0 : contact.attrs.type) === 'in', jid: user.attrs.jid };
                            }).filter(function (item) { return item.exists; })];
                }
            });
        });
    };
    var fetchStatus = function (jid) { return __awaiter(void 0, void 0, void 0, function () {
        var result, status_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, interactiveQuery([{ tag: 'user', attrs: { jid: jid } }], { tag: 'status', attrs: {} })];
                case 1:
                    result = (_a.sent())[0];
                    if (result) {
                        status_1 = (0, WABinary_1.getBinaryNodeChild)(result, 'status');
                        return [2 /*return*/, {
                                status: status_1 === null || status_1 === void 0 ? void 0 : status_1.content.toString(),
                                setAt: new Date(+((status_1 === null || status_1 === void 0 ? void 0 : status_1.attrs.t) || 0) * 1000)
                            }];
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    /** update the profile picture for yourself or a group */
    var updateProfilePicture = function (jid, content) { return __awaiter(void 0, void 0, void 0, function () {
        var img;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, Utils_1.generateProfilePicture)(content)];
                case 1:
                    img = (_a.sent()).img;
                    return [4 /*yield*/, query({
                            tag: 'iq',
                            attrs: {
                                to: (0, WABinary_1.jidNormalizedUser)(jid),
                                type: 'set',
                                xmlns: 'w:profile:picture'
                            },
                            content: [
                                {
                                    tag: 'picture',
                                    attrs: { type: 'image' },
                                    content: img
                                }
                            ]
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    /** remove the profile picture for yourself or a group */
    var removeProfilePicture = function (jid) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, query({
                        tag: 'iq',
                        attrs: {
                            to: (0, WABinary_1.jidNormalizedUser)(jid),
                            type: 'set',
                            xmlns: 'w:profile:picture'
                        }
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    /** update the profile status for yourself */
    var updateProfileStatus = function (status) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, query({
                        tag: 'iq',
                        attrs: {
                            to: WABinary_1.S_WHATSAPP_NET,
                            type: 'set',
                            xmlns: 'status'
                        },
                        content: [
                            {
                                tag: 'status',
                                attrs: {},
                                content: Buffer.from(status, 'utf-8')
                            }
                        ]
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var updateProfileName = function (name) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, chatModify({ pushNameSetting: name }, '')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var fetchBlocklist = function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, listNode;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, query({
                        tag: 'iq',
                        attrs: {
                            xmlns: 'blocklist',
                            to: WABinary_1.S_WHATSAPP_NET,
                            type: 'get'
                        }
                    })];
                case 1:
                    result = _a.sent();
                    listNode = (0, WABinary_1.getBinaryNodeChild)(result, 'list');
                    return [2 /*return*/, (0, WABinary_1.getBinaryNodeChildren)(listNode, 'item')
                            .map(function (n) { return n.attrs.jid; })];
            }
        });
    }); };
    var updateBlockStatus = function (jid, action) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, query({
                        tag: 'iq',
                        attrs: {
                            xmlns: 'blocklist',
                            to: WABinary_1.S_WHATSAPP_NET,
                            type: 'set'
                        },
                        content: [
                            {
                                tag: 'item',
                                attrs: {
                                    action: action,
                                    jid: jid
                                }
                            }
                        ]
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var getBusinessProfile = function (jid) { return __awaiter(void 0, void 0, void 0, function () {
        var results, profileNode, profiles, address, description, website, email, category, businessHours, businessHoursConfig, websiteStr;
        var _a, _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0: return [4 /*yield*/, query({
                        tag: 'iq',
                        attrs: {
                            to: 's.whatsapp.net',
                            xmlns: 'w:biz',
                            type: 'get'
                        },
                        content: [{
                                tag: 'business_profile',
                                attrs: { v: '244' },
                                content: [{
                                        tag: 'profile',
                                        attrs: { jid: jid }
                                    }]
                            }]
                    })];
                case 1:
                    results = _h.sent();
                    profileNode = (0, WABinary_1.getBinaryNodeChild)(results, 'business_profile');
                    profiles = (0, WABinary_1.getBinaryNodeChild)(profileNode, 'profile');
                    if (profiles) {
                        address = (0, WABinary_1.getBinaryNodeChild)(profiles, 'address');
                        description = (0, WABinary_1.getBinaryNodeChild)(profiles, 'description');
                        website = (0, WABinary_1.getBinaryNodeChild)(profiles, 'website');
                        email = (0, WABinary_1.getBinaryNodeChild)(profiles, 'email');
                        category = (0, WABinary_1.getBinaryNodeChild)((0, WABinary_1.getBinaryNodeChild)(profiles, 'categories'), 'category');
                        businessHours = (0, WABinary_1.getBinaryNodeChild)(profiles, 'business_hours');
                        businessHoursConfig = businessHours
                            ? (0, WABinary_1.getBinaryNodeChildren)(businessHours, 'business_hours_config')
                            : undefined;
                        websiteStr = (_a = website === null || website === void 0 ? void 0 : website.content) === null || _a === void 0 ? void 0 : _a.toString();
                        return [2 /*return*/, {
                                wid: (_b = profiles.attrs) === null || _b === void 0 ? void 0 : _b.jid,
                                address: (_c = address === null || address === void 0 ? void 0 : address.content) === null || _c === void 0 ? void 0 : _c.toString(),
                                description: ((_d = description === null || description === void 0 ? void 0 : description.content) === null || _d === void 0 ? void 0 : _d.toString()) || '',
                                website: websiteStr ? [websiteStr] : [],
                                email: (_e = email === null || email === void 0 ? void 0 : email.content) === null || _e === void 0 ? void 0 : _e.toString(),
                                category: (_f = category === null || category === void 0 ? void 0 : category.content) === null || _f === void 0 ? void 0 : _f.toString(),
                                'business_hours': {
                                    timezone: (_g = businessHours === null || businessHours === void 0 ? void 0 : businessHours.attrs) === null || _g === void 0 ? void 0 : _g.timezone,
                                    'business_config': businessHoursConfig === null || businessHoursConfig === void 0 ? void 0 : businessHoursConfig.map(function (_a) {
                                        var attrs = _a.attrs;
                                        return attrs;
                                    })
                                }
                            }];
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    var cleanDirtyBits = function (type, fromTimestamp) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger.info({ fromTimestamp: fromTimestamp }, 'clean dirty bits ' + type);
                    return [4 /*yield*/, sendNode({
                            tag: 'iq',
                            attrs: {
                                to: WABinary_1.S_WHATSAPP_NET,
                                type: 'set',
                                xmlns: 'urn:xmpp:whatsapp:dirty',
                                id: generateMessageTag(),
                            },
                            content: [
                                {
                                    tag: 'clean',
                                    attrs: __assign({ type: type }, (fromTimestamp ? { timestamp: fromTimestamp.toString() } : null))
                                }
                            ]
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var newAppStateChunkHandler = function (isInitialSync) {
        return {
            onMutation: function (mutation) {
                (0, Utils_1.processSyncAction)(mutation, ev, authState.creds.me, isInitialSync ? { accountSettings: authState.creds.accountSettings } : undefined, logger);
            }
        };
    };
    var resyncAppState = ev.createBufferedFunction(function (collections, isInitialSync) { return __awaiter(void 0, void 0, void 0, function () {
        var initialVersionMap, globalMutationMap, onMutation, key;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    initialVersionMap = {};
                    globalMutationMap = {};
                    return [4 /*yield*/, authState.keys.transaction(function () { return __awaiter(void 0, void 0, void 0, function () {
                            var collectionsToHandle, attemptsMap, states, nodes, _i, collectionsToHandle_1, name_1, result_1, state, result, decoded, _a, _b, _c, _d, key, name_2, _e, patches, hasMorePatches, snapshot, _f, newState, mutationMap, _g, newState, mutationMap, error_1, isIrrecoverableError;
                            var _h, _j, _k;
                            var _l;
                            return __generator(this, function (_m) {
                                switch (_m.label) {
                                    case 0:
                                        collectionsToHandle = new Set(collections);
                                        attemptsMap = {};
                                        _m.label = 1;
                                    case 1:
                                        if (!collectionsToHandle.size) return [3 /*break*/, 20];
                                        states = {};
                                        nodes = [];
                                        _i = 0, collectionsToHandle_1 = collectionsToHandle;
                                        _m.label = 2;
                                    case 2:
                                        if (!(_i < collectionsToHandle_1.length)) return [3 /*break*/, 5];
                                        name_1 = collectionsToHandle_1[_i];
                                        return [4 /*yield*/, authState.keys.get('app-state-sync-version', [name_1])];
                                    case 3:
                                        result_1 = _m.sent();
                                        state = result_1[name_1];
                                        if (state) {
                                            if (typeof initialVersionMap[name_1] === 'undefined') {
                                                initialVersionMap[name_1] = state.version;
                                            }
                                        }
                                        else {
                                            state = (0, Utils_1.newLTHashState)();
                                        }
                                        states[name_1] = state;
                                        logger.info("resyncing ".concat(name_1, " from v").concat(state.version));
                                        nodes.push({
                                            tag: 'collection',
                                            attrs: {
                                                name: name_1,
                                                version: state.version.toString(),
                                                // return snapshot if being synced from scratch
                                                'return_snapshot': (!state.version).toString()
                                            }
                                        });
                                        _m.label = 4;
                                    case 4:
                                        _i++;
                                        return [3 /*break*/, 2];
                                    case 5: return [4 /*yield*/, query({
                                            tag: 'iq',
                                            attrs: {
                                                to: WABinary_1.S_WHATSAPP_NET,
                                                xmlns: 'w:sync:app:state',
                                                type: 'set'
                                            },
                                            content: [
                                                {
                                                    tag: 'sync',
                                                    attrs: {},
                                                    content: nodes
                                                }
                                            ]
                                        })
                                        // extract from binary node
                                    ];
                                    case 6:
                                        result = _m.sent();
                                        return [4 /*yield*/, (0, Utils_1.extractSyncdPatches)(result, config === null || config === void 0 ? void 0 : config.options)];
                                    case 7:
                                        decoded = _m.sent();
                                        _a = decoded;
                                        _b = [];
                                        for (_c in _a)
                                            _b.push(_c);
                                        _d = 0;
                                        _m.label = 8;
                                    case 8:
                                        if (!(_d < _b.length)) return [3 /*break*/, 19];
                                        _c = _b[_d];
                                        if (!(_c in _a)) return [3 /*break*/, 18];
                                        key = _c;
                                        name_2 = key;
                                        _e = decoded[name_2], patches = _e.patches, hasMorePatches = _e.hasMorePatches, snapshot = _e.snapshot;
                                        _m.label = 9;
                                    case 9:
                                        _m.trys.push([9, 16, , 18]);
                                        if (!snapshot) return [3 /*break*/, 12];
                                        return [4 /*yield*/, (0, Utils_1.decodeSyncdSnapshot)(name_2, snapshot, getAppStateSyncKey, initialVersionMap[name_2], appStateMacVerification.snapshot)];
                                    case 10:
                                        _f = _m.sent(), newState = _f.state, mutationMap = _f.mutationMap;
                                        states[name_2] = newState;
                                        Object.assign(globalMutationMap, mutationMap);
                                        logger.info("restored state of ".concat(name_2, " from snapshot to v").concat(newState.version, " with mutations"));
                                        return [4 /*yield*/, authState.keys.set({ 'app-state-sync-version': (_h = {}, _h[name_2] = newState, _h) })];
                                    case 11:
                                        _m.sent();
                                        _m.label = 12;
                                    case 12:
                                        if (!patches.length) return [3 /*break*/, 15];
                                        return [4 /*yield*/, (0, Utils_1.decodePatches)(name_2, patches, states[name_2], getAppStateSyncKey, config.options, initialVersionMap[name_2], logger, appStateMacVerification.patch)];
                                    case 13:
                                        _g = _m.sent(), newState = _g.state, mutationMap = _g.mutationMap;
                                        return [4 /*yield*/, authState.keys.set({ 'app-state-sync-version': (_j = {}, _j[name_2] = newState, _j) })];
                                    case 14:
                                        _m.sent();
                                        logger.info("synced ".concat(name_2, " to v").concat(newState.version));
                                        initialVersionMap[name_2] = newState.version;
                                        Object.assign(globalMutationMap, mutationMap);
                                        _m.label = 15;
                                    case 15:
                                        if (hasMorePatches) {
                                            logger.info("".concat(name_2, " has more patches..."));
                                        }
                                        else { // collection is done with sync
                                            collectionsToHandle.delete(name_2);
                                        }
                                        return [3 /*break*/, 18];
                                    case 16:
                                        error_1 = _m.sent();
                                        isIrrecoverableError = attemptsMap[name_2] >= MAX_SYNC_ATTEMPTS
                                            || ((_l = error_1.output) === null || _l === void 0 ? void 0 : _l.statusCode) === 404
                                            || error_1.name === 'TypeError';
                                        logger.info({ name: name_2, error: error_1.stack }, "failed to sync state from version".concat(isIrrecoverableError ? '' : ', removing and trying from scratch'));
                                        return [4 /*yield*/, authState.keys.set({ 'app-state-sync-version': (_k = {}, _k[name_2] = null, _k) })
                                            // increment number of retries
                                        ];
                                    case 17:
                                        _m.sent();
                                        // increment number of retries
                                        attemptsMap[name_2] = (attemptsMap[name_2] || 0) + 1;
                                        if (isIrrecoverableError) {
                                            // stop retrying
                                            collectionsToHandle.delete(name_2);
                                        }
                                        return [3 /*break*/, 18];
                                    case 18:
                                        _d++;
                                        return [3 /*break*/, 8];
                                    case 19: return [3 /*break*/, 1];
                                    case 20: return [2 /*return*/];
                                }
                            });
                        }); })];
                case 1:
                    _a.sent();
                    onMutation = newAppStateChunkHandler(isInitialSync).onMutation;
                    for (key in globalMutationMap) {
                        onMutation(globalMutationMap[key]);
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    /**
     * fetch the profile picture of a user/group
     * type = "preview" for a low res picture
     * type = "image for the high res picture"
     */
    var profilePictureUrl = function (jid_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([jid_1], args_1, true), void 0, function (jid, type, timeoutMs) {
            var result, child;
            var _a;
            if (type === void 0) { type = 'preview'; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        jid = (0, WABinary_1.jidNormalizedUser)(jid);
                        return [4 /*yield*/, query({
                                tag: 'iq',
                                attrs: {
                                    target: jid,
                                    to: WABinary_1.S_WHATSAPP_NET,
                                    type: 'get',
                                    xmlns: 'w:profile:picture'
                                },
                                content: [
                                    { tag: 'picture', attrs: { type: type, query: 'url' } }
                                ]
                            }, timeoutMs)];
                    case 1:
                        result = _b.sent();
                        child = (0, WABinary_1.getBinaryNodeChild)(result, 'picture');
                        return [2 /*return*/, (_a = child === null || child === void 0 ? void 0 : child.attrs) === null || _a === void 0 ? void 0 : _a.url];
                }
            });
        });
    };
    var sendPresenceUpdate = function (type, toJid) { return __awaiter(void 0, void 0, void 0, function () {
        var me;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    me = authState.creds.me;
                    if (!(type === 'available' || type === 'unavailable')) return [3 /*break*/, 2];
                    if (!me.name) {
                        logger.warn('no name present, ignoring presence update request...');
                        return [2 /*return*/];
                    }
                    ev.emit('connection.update', { isOnline: type === 'available' });
                    return [4 /*yield*/, sendNode({
                            tag: 'presence',
                            attrs: {
                                name: me.name,
                                type: type
                            }
                        })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, sendNode({
                        tag: 'chatstate',
                        attrs: {
                            from: me.id,
                            to: toJid,
                        },
                        content: [
                            {
                                tag: type === 'recording' ? 'composing' : type,
                                attrs: type === 'recording' ? { media: 'audio' } : {}
                            }
                        ]
                    })];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * @param toJid the jid to subscribe to
     * @param tcToken token for subscription, use if present
     */
    var presenceSubscribe = function (toJid, tcToken) { return (sendNode({
        tag: 'presence',
        attrs: {
            to: toJid,
            id: generateMessageTag(),
            type: 'subscribe'
        },
        content: tcToken
            ? [
                {
                    tag: 'tctoken',
                    attrs: {},
                    content: tcToken
                }
            ]
            : undefined
    })); };
    var handlePresenceUpdate = function (_a) {
        var _b;
        var _c;
        var tag = _a.tag, attrs = _a.attrs, content = _a.content;
        var presence;
        var jid = attrs.from;
        var participant = attrs.participant || attrs.from;
        if (shouldIgnoreJid(jid) && jid !== '@s.whatsapp.net') {
            return;
        }
        if (tag === 'presence') {
            presence = {
                lastKnownPresence: attrs.type === 'unavailable' ? 'unavailable' : 'available',
                lastSeen: attrs.last && attrs.last !== 'deny' ? +attrs.last : undefined
            };
        }
        else if (Array.isArray(content)) {
            var firstChild = content[0];
            var type = firstChild.tag;
            if (type === 'paused') {
                type = 'available';
            }
            if (((_c = firstChild.attrs) === null || _c === void 0 ? void 0 : _c.media) === 'audio') {
                type = 'recording';
            }
            presence = { lastKnownPresence: type };
        }
        else {
            logger.error({ tag: tag, attrs: attrs, content: content }, 'recv invalid presence node');
        }
        if (presence) {
            ev.emit('presence.update', { id: jid, presences: (_b = {}, _b[participant] = presence, _b) });
        }
    };
    var appPatch = function (patchCreate) { return __awaiter(void 0, void 0, void 0, function () {
        var name, myAppStateKeyId, initial, encodeResult, onMutation, mutationMap, key;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    name = patchCreate.type;
                    myAppStateKeyId = authState.creds.myAppStateKeyId;
                    if (!myAppStateKeyId) {
                        throw new boom_1.Boom('App state key not present!', { statusCode: 400 });
                    }
                    return [4 /*yield*/, processingMutex.mutex(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, authState.keys.transaction(function () { return __awaiter(void 0, void 0, void 0, function () {
                                            var _a, _b, currentSyncVersion, patch, state, node;
                                            var _c;
                                            return __generator(this, function (_d) {
                                                switch (_d.label) {
                                                    case 0:
                                                        logger.debug({ patch: patchCreate }, 'applying app patch');
                                                        return [4 /*yield*/, resyncAppState([name], false)];
                                                    case 1:
                                                        _d.sent();
                                                        return [4 /*yield*/, authState.keys.get('app-state-sync-version', [name])];
                                                    case 2:
                                                        _a = _d.sent(), _b = name, currentSyncVersion = _a[_b];
                                                        initial = currentSyncVersion || (0, Utils_1.newLTHashState)();
                                                        return [4 /*yield*/, (0, Utils_1.encodeSyncdPatch)(patchCreate, myAppStateKeyId, initial, getAppStateSyncKey)];
                                                    case 3:
                                                        encodeResult = _d.sent();
                                                        patch = encodeResult.patch, state = encodeResult.state;
                                                        node = {
                                                            tag: 'iq',
                                                            attrs: {
                                                                to: WABinary_1.S_WHATSAPP_NET,
                                                                type: 'set',
                                                                xmlns: 'w:sync:app:state'
                                                            },
                                                            content: [
                                                                {
                                                                    tag: 'sync',
                                                                    attrs: {},
                                                                    content: [
                                                                        {
                                                                            tag: 'collection',
                                                                            attrs: {
                                                                                name: name,
                                                                                version: (state.version - 1).toString(),
                                                                                'return_snapshot': 'false'
                                                                            },
                                                                            content: [
                                                                                {
                                                                                    tag: 'patch',
                                                                                    attrs: {},
                                                                                    content: WAProto_1.proto.SyncdPatch.encode(patch).finish()
                                                                                }
                                                                            ]
                                                                        }
                                                                    ]
                                                                }
                                                            ]
                                                        };
                                                        return [4 /*yield*/, query(node)];
                                                    case 4:
                                                        _d.sent();
                                                        return [4 /*yield*/, authState.keys.set({ 'app-state-sync-version': (_c = {}, _c[name] = state, _c) })];
                                                    case 5:
                                                        _d.sent();
                                                        return [2 /*return*/];
                                                }
                                            });
                                        }); })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 1:
                    _a.sent();
                    if (!config.emitOwnEvents) return [3 /*break*/, 3];
                    onMutation = newAppStateChunkHandler(false).onMutation;
                    return [4 /*yield*/, (0, Utils_1.decodePatches)(name, [__assign(__assign({}, encodeResult.patch), { version: { version: encodeResult.state.version } })], initial, getAppStateSyncKey, config.options, undefined, logger)];
                case 2:
                    mutationMap = (_a.sent()).mutationMap;
                    for (key in mutationMap) {
                        onMutation(mutationMap[key]);
                    }
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    }); };
    /** sending non-abt props may fix QR scan fail if server expects */
    var fetchProps = function () { return __awaiter(void 0, void 0, void 0, function () {
        var resultNode, propsNode, props;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, query({
                        tag: 'iq',
                        attrs: {
                            to: WABinary_1.S_WHATSAPP_NET,
                            xmlns: 'w',
                            type: 'get',
                        },
                        content: [
                            { tag: 'props', attrs: {
                                    protocol: '2',
                                    hash: ((_a = authState === null || authState === void 0 ? void 0 : authState.creds) === null || _a === void 0 ? void 0 : _a.lastPropHash) || ''
                                } }
                        ]
                    })];
                case 1:
                    resultNode = _c.sent();
                    propsNode = (0, WABinary_1.getBinaryNodeChild)(resultNode, 'props');
                    props = {};
                    if (propsNode) {
                        authState.creds.lastPropHash = (_b = propsNode === null || propsNode === void 0 ? void 0 : propsNode.attrs) === null || _b === void 0 ? void 0 : _b.hash;
                        ev.emit('creds.update', authState.creds);
                        props = (0, WABinary_1.reduceBinaryNodeToDictionary)(propsNode, 'prop');
                    }
                    logger.debug('fetched props');
                    return [2 /*return*/, props];
            }
        });
    }); };
    /**
     * modify a chat -- mark unread, read etc.
     * lastMessages must be sorted in reverse chronologically
     * requires the last messages till the last message received; required for archive & unread
    */
    var chatModify = function (mod, jid) {
        var patch = (0, Utils_1.chatModificationToAppPatch)(mod, jid);
        return appPatch(patch);
    };
    /**
     * Star or Unstar a message
     */
    var star = function (jid, messages, star) {
        return chatModify({
            star: {
                messages: messages,
                star: star
            }
        }, jid);
    };
    /**
     * Adds label for the chats
     */
    var addChatLabel = function (jid, labelId) {
        return chatModify({
            addChatLabel: {
                labelId: labelId
            }
        }, jid);
    };
    /**
     * Removes label for the chat
     */
    var removeChatLabel = function (jid, labelId) {
        return chatModify({
            removeChatLabel: {
                labelId: labelId
            }
        }, jid);
    };
    /**
     * Adds label for the message
     */
    var addMessageLabel = function (jid, messageId, labelId) {
        return chatModify({
            addMessageLabel: {
                messageId: messageId,
                labelId: labelId
            }
        }, jid);
    };
    /**
     * Removes label for the message
     */
    var removeMessageLabel = function (jid, messageId, labelId) {
        return chatModify({
            removeMessageLabel: {
                messageId: messageId,
                labelId: labelId
            }
        }, jid);
    };
    /**
     * queries need to be fired on connection open
     * help ensure parity with WA Web
     * */
    var executeInitQueries = function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        fetchProps(),
                        fetchBlocklist(),
                        fetchPrivacySettings(),
                    ])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var upsertMessage = ev.createBufferedFunction(function (msg, type) { return __awaiter(void 0, void 0, void 0, function () {
        function doAppStateSync() {
            return __awaiter(this, void 0, void 0, function () {
                var accountSyncCounter;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!!authState.creds.accountSyncCounter) return [3 /*break*/, 2];
                            logger.info('doing initial app state sync');
                            return [4 /*yield*/, resyncAppState(Types_1.ALL_WA_PATCH_NAMES, true)];
                        case 1:
                            _a.sent();
                            accountSyncCounter = (authState.creds.accountSyncCounter || 0) + 1;
                            ev.emit('creds.update', { accountSyncCounter: accountSyncCounter });
                            if (needToFlushWithAppStateSync) {
                                logger.debug('flushing with app state sync');
                                ev.flush();
                            }
                            _a.label = 2;
                        case 2: return [2 /*return*/];
                    }
                });
            });
        }
        var jid, historyMsg, shouldProcessHistoryMsg;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    ev.emit('messages.upsert', { messages: [msg], type: type });
                    if (!!msg.pushName) {
                        jid = msg.key.fromMe ? authState.creds.me.id : (msg.key.participant || msg.key.remoteJid);
                        jid = (0, WABinary_1.jidNormalizedUser)(jid);
                        if (!msg.key.fromMe) {
                            ev.emit('contacts.update', [{ id: jid, notify: msg.pushName, verifiedName: msg.verifiedBizName }]);
                        }
                        // update our pushname too
                        if (msg.key.fromMe && msg.pushName && ((_a = authState.creds.me) === null || _a === void 0 ? void 0 : _a.name) !== msg.pushName) {
                            ev.emit('creds.update', { me: __assign(__assign({}, authState.creds.me), { name: msg.pushName }) });
                        }
                    }
                    historyMsg = (0, Utils_1.getHistoryMsg)(msg.message);
                    shouldProcessHistoryMsg = historyMsg
                        ? (shouldSyncHistoryMessage(historyMsg)
                            && Defaults_1.PROCESSABLE_HISTORY_TYPES.includes(historyMsg.syncType))
                        : false;
                    if (historyMsg && !authState.creds.myAppStateKeyId) {
                        logger.warn('skipping app state sync, as myAppStateKeyId is not set');
                        pendingAppStateSync = true;
                    }
                    return [4 /*yield*/, Promise.all([
                            (function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!(historyMsg
                                                && authState.creds.myAppStateKeyId)) return [3 /*break*/, 2];
                                            pendingAppStateSync = false;
                                            return [4 /*yield*/, doAppStateSync()];
                                        case 1:
                                            _a.sent();
                                            _a.label = 2;
                                        case 2: return [2 /*return*/];
                                    }
                                });
                            }); })(),
                            (0, process_message_1.default)(msg, {
                                shouldProcessHistoryMsg: shouldProcessHistoryMsg,
                                ev: ev,
                                creds: authState.creds,
                                keyStore: authState.keys,
                                logger: logger,
                                options: config.options,
                                getMessage: config.getMessage,
                            })
                        ])];
                case 1:
                    _d.sent();
                    if (!(((_c = (_b = msg.message) === null || _b === void 0 ? void 0 : _b.protocolMessage) === null || _c === void 0 ? void 0 : _c.appStateSyncKeyShare)
                        && pendingAppStateSync)) return [3 /*break*/, 3];
                    return [4 /*yield*/, doAppStateSync()];
                case 2:
                    _d.sent();
                    pendingAppStateSync = false;
                    _d.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    }); });
    ws.on('CB:presence', handlePresenceUpdate);
    ws.on('CB:chatstate', handlePresenceUpdate);
    ws.on('CB:ib,,dirty', function (node) { return __awaiter(void 0, void 0, void 0, function () {
        var attrs, type, _a, lastAccountSyncTimestamp;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    attrs = (0, WABinary_1.getBinaryNodeChild)(node, 'dirty').attrs;
                    type = attrs.type;
                    _a = type;
                    switch (_a) {
                        case 'account_sync': return [3 /*break*/, 1];
                        case 'groups': return [3 /*break*/, 5];
                    }
                    return [3 /*break*/, 6];
                case 1:
                    if (!attrs.timestamp) return [3 /*break*/, 4];
                    lastAccountSyncTimestamp = authState.creds.lastAccountSyncTimestamp;
                    if (!lastAccountSyncTimestamp) return [3 /*break*/, 3];
                    return [4 /*yield*/, cleanDirtyBits('account_sync', lastAccountSyncTimestamp)];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    lastAccountSyncTimestamp = +attrs.timestamp;
                    ev.emit('creds.update', { lastAccountSyncTimestamp: lastAccountSyncTimestamp });
                    _b.label = 4;
                case 4: return [3 /*break*/, 7];
                case 5: 
                // handled in groups.ts
                return [3 /*break*/, 7];
                case 6:
                    logger.info({ node: node }, 'received unknown sync');
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); });
    ev.on('connection.update', function (_a) {
        var _b;
        var connection = _a.connection, receivedPendingNotifications = _a.receivedPendingNotifications;
        if (connection === 'open') {
            if (fireInitQueries) {
                executeInitQueries()
                    .catch(function (error) { return onUnexpectedError(error, 'init queries'); });
            }
            sendPresenceUpdate(markOnlineOnConnect ? 'available' : 'unavailable')
                .catch(function (error) { return onUnexpectedError(error, 'presence update requests'); });
        }
        if (receivedPendingNotifications) {
            // if we don't have the app state key
            // we keep buffering events until we finally have
            // the key and can sync the messages
            if (!((_b = authState.creds) === null || _b === void 0 ? void 0 : _b.myAppStateKeyId) && !config.mobile) {
                ev.buffer();
                needToFlushWithAppStateSync = true;
            }
        }
    });
    return __assign(__assign({}, sock), { processingMutex: processingMutex, fetchPrivacySettings: fetchPrivacySettings, upsertMessage: upsertMessage, appPatch: appPatch, sendPresenceUpdate: sendPresenceUpdate, presenceSubscribe: presenceSubscribe, profilePictureUrl: profilePictureUrl, onWhatsApp: onWhatsApp, fetchBlocklist: fetchBlocklist, fetchStatus: fetchStatus, updateProfilePicture: updateProfilePicture, removeProfilePicture: removeProfilePicture, updateProfileStatus: updateProfileStatus, updateProfileName: updateProfileName, updateBlockStatus: updateBlockStatus, updateCallPrivacy: updateCallPrivacy, updateLastSeenPrivacy: updateLastSeenPrivacy, updateOnlinePrivacy: updateOnlinePrivacy, updateProfilePicturePrivacy: updateProfilePicturePrivacy, updateStatusPrivacy: updateStatusPrivacy, updateReadReceiptsPrivacy: updateReadReceiptsPrivacy, updateGroupsAddPrivacy: updateGroupsAddPrivacy, updateDefaultDisappearingMode: updateDefaultDisappearingMode, getBusinessProfile: getBusinessProfile, resyncAppState: resyncAppState, chatModify: chatModify, cleanDirtyBits: cleanDirtyBits, addChatLabel: addChatLabel, removeChatLabel: removeChatLabel, addMessageLabel: addMessageLabel, removeMessageLabel: removeMessageLabel, star: star });
};
exports.makeChatsSocket = makeChatsSocket;
