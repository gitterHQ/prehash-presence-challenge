/* jshint node:true */
'use strict';

var util = require('util');
var EventEmitter = require('events').EventEmitter;

function Presence() {
}
util.inherits(Presence, EventEmitter);

Presence.prototype.connected = function(clientId, username, callback) {
  callback(new Error('Not implemented'));
};

Presence.prototype.disconnected = function(clientId, callback) {
  callback(new Error('Not implemented'));
};

Presence.prototype.query = function(usernames, callback) {
  callback(new Error('Not implemented'));
};


module.exports = Presence;