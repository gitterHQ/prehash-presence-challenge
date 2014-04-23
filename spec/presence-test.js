/*jslint node: true */
/*global describe:true, it: true, beforeEach:true, afterEach:true */
'use strict';

var Presence = require('..');
var assert = require('assert');
var async = require('async');

describe('presence engine', function() {
  describe('simple cases', function() {
    it('should handle a single connect', function(done) {

      var presence = new Presence();

      var clientId = '1';
      var username = 'moo';

      var transitionTriggered = 0;
      presence.on('transition', function(username) {
        assert.strictEqual(++transitionTriggered, 1);
        assert.strictEqual(username, 'moo');
      });

      presence.connected(clientId, username, function(err) {
        if(err) return done(err);
        assert.strictEqual(transitionTriggered, 1, 'Expected online event to be triggered');
        done();
      });

    });

    it('should emit two presence events for a connect-disconnect', function(done) {
      var presence = new Presence();

      var TEST_clientId = '2';
      var TEST_username = 'moocow';

      var transitionTriggered = 0;
      presence.on('transition', function(username, status) {
        assert.strictEqual(username, TEST_username);
        switch(transitionTriggered++) {
          case 0:
            assert.equal(status, true);
            break;
          case 1:
            assert.equal(status, false);
            break;
          default:
            assert(false);
        }

      });

      presence.connected(TEST_clientId, TEST_username, function(err) {
        if(err) return done(err);

        assert.strictEqual(transitionTriggered, 1, 'Expected event to be triggered');

        presence.disconnected(TEST_clientId, function() {
          if(err) return done(err);

          assert.strictEqual(transitionTriggered, 2, 'Expected event to be triggered');

          done();
        });

      });

    });

    it('should return the correct results for a query', function(done) {
      var presence = new Presence();

      var TEST_clientId = '3';
      var TEST_username = 'rover';

      presence.connected(TEST_clientId, TEST_username, function(err) {
        if(err) return done(err);

        presence.query(['rover', 'jimmy'], function(err, statii) {
          if(err) return done(err);

          assert.equal(statii['rover'], true);
          assert.equal(statii['jimmy'], false);

          presence.disconnected(TEST_clientId, function(err) {
            if(err) return done(err);

            presence.query(['rover', 'jimmy'], function(err, statii) {
              if(err) return done(err);

              assert(!statii['rover'], false);
              assert(!statii['jimmy'], false);

              done();
            });

          });

        });

      });

    });
  });

  describe('timing cases', function() {
    it('should handle a fast connect/disconnect', function(done) {
      var presence = new Presence();

      var TEST_clientId = '4';
      var TEST_username = 'moocow';

      var transitionTriggered = 0;
      presence.on('transition', function(username, status) {
        assert.strictEqual(username, TEST_username);
        switch(transitionTriggered++) {
          case 0:
            assert.equal(status, true);
            break;
          case 1:
            assert.equal(status, false);
            break;
          default:
            assert(false);
        }

      });

      async.parallel([
          function(cb) { presence.connected(TEST_clientId, TEST_username, cb); },
          function(cb) { presence.disconnected(TEST_clientId, cb); }
      ], function(err) {
        if(err) return done(err);

        assert.equal(transitionTriggered, 2);
        done();
      });

    });

    it('should handle clients connecting twice in quick succession', function(done) {
      var presence = new Presence();

      var TEST_clientId = '4';
      var TEST_username = 'moocow';

      var transitionTriggered = 0;
      presence.on('transition', function(username, status) {
        assert.strictEqual(username, TEST_username);
        switch(transitionTriggered++) {
          case 0:
            assert.equal(status, true);
            break;
          case 1:
            assert.equal(status, false);
            break;
          default:
            assert(false);
        }

      });

      async.parallel([
          function(cb) { presence.connected(TEST_clientId, TEST_username, cb); },
          function(cb) { presence.connected(TEST_clientId, TEST_username, cb); },
          function(cb) { presence.disconnected(TEST_clientId, cb); }
      ], function(err) {
        if(err) return done(err);

        assert.equal(transitionTriggered, 2);
        done();
      });

    });

    it('should handle clients disconnecting twice in quick succession', function(done) {
      var presence = new Presence();

      var TEST_clientId = '4';
      var TEST_username = 'moocow';

      var transitionTriggered = 0;
      presence.on('transition', function(username, status) {
        assert.strictEqual(username, TEST_username);
        switch(transitionTriggered++) {
          case 0:
            assert.equal(status, true);
            break;
          case 1:
            assert.equal(status, false);
            break;
          default:
            assert(false);
        }

      });

      async.parallel([
          function(cb) { presence.connected(TEST_clientId, TEST_username, cb); },
          function(cb) { presence.disconnected(TEST_clientId, cb); },
          function(cb) { presence.disconnected(TEST_clientId, cb); }
      ], function(err) {
        if(err) return done(err);

        assert.equal(transitionTriggered, 2);
        done();
      });

    });



  });

});