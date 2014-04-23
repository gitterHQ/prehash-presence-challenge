/*jslint node: true */
/*global describe:true, it: true, beforeEach:true, afterEach:true */
'use strict';

var Presence = require('..');
var assert = require('assert');
var async = require('async');

describe('presence engine', function() {
  describe('simple cases', function() {

    /**
     * Using a single connection, check that the correct event is triggered when
     * a user comes online
     */
    it('should handle a single connect', function(done) {

      var presence = new Presence();

      var TEST_clientId = '1';
      var TEST_username = 'moo';

      var transitionTriggered = 0;
      presence.on('transition', function(username, status) {
        /** Check that only one transition happens */
        assert.strictEqual(++transitionTriggered, 1, 'Too many transition events');
        assert.strictEqual(username, TEST_username, 'Incorrect user');
        assert(status, 'User should be online');
      });

      presence.connected(TEST_clientId, TEST_username, function(err) {
        if(err) return done(err);
        assert.strictEqual(transitionTriggered, 1, 'Incorrect number of transition events');
        done();
      });

    });

    /**
     * Using a single connection, check that the transition event occurs when
     * the user goes online and offline
     */
    it('should emit two presence events for a connect-disconnect', function(done) {
      var presence = new Presence();

      var TEST_clientId = '2';
      var TEST_username = 'moocow';

      var transitionTriggered = 0;
      presence.on('transition', function(username, status) {
        assert.strictEqual(username, TEST_username, 'Incorrect user');
        switch(transitionTriggered++) {
          case 0:
            assert(status, 'Expect user to be going online');
            break;
          case 1:
            assert(!status, 'Expect user to be going offline');
            break;
          default:
            assert(false, 'Too many transition events');
        }

      });

      presence.connected(TEST_clientId, TEST_username, function(err) {
        if(err) return done(err);

        assert.strictEqual(transitionTriggered, 1, 'Incorrect number of transition events');

        presence.disconnected(TEST_clientId, function() {
          if(err) return done(err);

          assert.strictEqual(transitionTriggered, 2, 'Incorrect number of transition events');

          done();
        });

      });

    });

    /**
     * Test that the query method works correctly
     */
    it('should return the correct results for a query', function(done) {
      var presence = new Presence();

      var TEST_clientId = '3';
      var TEST_username = 'rover';

      presence.connected(TEST_clientId, TEST_username, function(err) {
        if(err) return done(err);

        presence.query(['rover', 'jimmy'], function(err, statii) {
          if(err) return done(err);

          assert(statii['rover'], 'User should be online');
          assert(!statii['jimmy'], 'User should be offline');

          presence.disconnected(TEST_clientId, function(err) {
            if(err) return done(err);

            presence.query(['rover', 'jimmy'], function(err, statii) {
              if(err) return done(err);

              assert(!statii['rover'], 'User should be offline');
              assert(!statii['jimmy'], 'User should be offline');

              done();
            });

          });

        });

      });

    });
  });

  /**
   * These tests are for a single user with multiple devices
   */
  describe('one user connected on multiple devices', function() {

    /**
     * Check that we only get one online event when a user
     * connects using multiple devices
     */
    it('should handle a single user connecting on multiple devices', function(done) {

      var presence = new Presence();

      var TEST_clientId1 = '4';
      var TEST_clientId2 = '5';
      var TEST_username = 'tinky';

      var transitionTriggered = 0;
      presence.on('transition', function(username) {
        assert.strictEqual(++transitionTriggered, 1, 'Too many transition events');
        assert.strictEqual(username, TEST_username, 'Incorrect user');
      });

      async.series([
        function(cb) {
          presence.query([TEST_username], function(err, statii) {
            if(err) return cb(err);

            assert(!statii[TEST_username], 'User should be offline');

            cb();
          });
        },
        function(cb) {
          presence.connected(TEST_clientId1, TEST_username, function(err) {
            if(err) return cb(err);

            assert.strictEqual(transitionTriggered, 1, 'Incorrect number of transition events');
            cb();
          });
        },
        function(cb) {
          presence.query([TEST_username], function(err, statii) {
            if(err) return cb(err);

            assert(statii[TEST_username], 'User should be online');

            cb();
          });
        },
        function(cb) {
          presence.connected(TEST_clientId2, TEST_username, function(err) {
            if(err) return cb(err);

            assert.strictEqual(transitionTriggered, 1, 'Incorrect number of transition events');
            cb();
          });
        },
        function(cb) {
          presence.query([TEST_username], function(err, statii) {
            if(err) return cb(err);

            assert(statii[TEST_username], 'User should be online');

            cb();
          });
        }
      ], function(err) {
        if(err) return done(err);

        assert.equal(transitionTriggered, 1, 'Incorrect number of transition events');
        done();
      });

    });

    /**
     * User connects with two devices, then disconnects both devices.
     * Check that we get one online event, one offline event.
     */
    it('should handle a single user connecting and disconnecting on multiple devices', function(done) {
      var presence = new Presence();

      var TEST_clientId1 = '6';
      var TEST_clientId2 = '7';
      var TEST_username = 'blinky';

      var transitionTriggered = 0;
      presence.on('transition', function(username, status) {
        assert.strictEqual(username, TEST_username, 'Incorrect user');
        switch(transitionTriggered++) {
          case 0:
            assert(status, 'Expected user to be going online');
            break;
          case 1:
            assert(!status, 'Expected user to be going offline');
            break;
          default:
            assert(false, 'Incorrect number of transition events');
        }
      });

      async.series([
        function(cb) {
          presence.query([TEST_username], function(err, statii) {
            if(err) return cb(err);

            assert(!statii[TEST_username], 'User should be offline');

            cb();
          });
        },
        function(cb) {
          presence.connected(TEST_clientId1, TEST_username, function(err) {
            if(err) return cb(err);

            assert.strictEqual(transitionTriggered, 1, 'Incorrect number of transition events');
            cb();
          });
        },
        function(cb) {
          presence.query([TEST_username], function(err, statii) {
            if(err) return cb(err);

            assert(statii[TEST_username], 'User should be online');

            cb();
          });
        },
        function(cb) {
          presence.connected(TEST_clientId2, TEST_username, function(err) {
            if(err) return cb(err);

            assert.strictEqual(transitionTriggered, 1, 'Incorrect number of transition events');
            cb();
          });
        },
        function(cb) {
          presence.query([TEST_username], function(err, statii) {
            if(err) return cb(err);

            assert(statii[TEST_username], 'User should be online');

            cb();
          });
        },
        function(cb) {
          presence.disconnected(TEST_clientId1, function(err) {
            if(err) return cb(err);

            assert.strictEqual(transitionTriggered, 1, 'Incorrect number of transition events');
            cb();
          });
        },
        function(cb) {
          presence.query([TEST_username], function(err, statii) {
            if(err) return cb(err);

            assert(statii[TEST_username], 'User should be online');

            cb();
          });
        },
        function(cb) {
          presence.disconnected(TEST_clientId2, function(err) {
            if(err) return cb(err);

            assert.strictEqual(transitionTriggered, 2, 'Incorrect number of transition events');
            cb();
          });
        },
        function(cb) {
          presence.query([TEST_username], function(err, statii) {
            if(err) return cb(err);

            assert(!statii[TEST_username], 'User should be offline');

            cb();
          });
        }

      ], function(err) {
        if(err) return done(err);

        assert.equal(transitionTriggered, 2, 'Incorrect number of transition events');
        done();
      });

    });

  });

  /**
   * These tests attempt to find timing issues. They do things in parallel and check that
   * the results are consistent.
   */
  describe('timing cases', function() {

    /* User connects and disconnects before the first call returns */
    it('should handle a fast connect/disconnect', function(done) {
      var presence = new Presence();

      var TEST_clientId = '8';
      var TEST_username = 'chicken';

      var transitionTriggered = 0;
      presence.on('transition', function(username, status) {
        assert.strictEqual(username, TEST_username, 'Incorrect user');
        switch(transitionTriggered++) {
          case 0:
            assert(status, 'User should be online');
            break;
          case 1:
            assert(!status, 'User should be offline');
            break;
          default:
            assert(false, 'Too many transition events');
        }

      });

      async.parallel([
          function(cb) { presence.connected(TEST_clientId, TEST_username, cb); },
          function(cb) { presence.disconnected(TEST_clientId, cb); }
      ], function(err) {
        if(err) return done(err);

        assert.equal(transitionTriggered, 2, 'Incorrect number of transition events');
        done();
      });

    });

    /**
     * Check that double-connect events don't mess things up
     */
    it('should handle clients connecting twice in quick succession', function(done) {
      var presence = new Presence();

      var TEST_clientId = '9';
      var TEST_username = 'sheep';

      var transitionTriggered = 0;
      presence.on('transition', function(username, status) {
        assert.strictEqual(username, TEST_username, 'Incorrect user');
        switch(transitionTriggered++) {
          case 0:
            assert(status, 'User should be online');
            break;
          case 1:
            assert(!status, 'User should be offline');
            break;
          default:
            assert(false, 'Too many transition events');
        }

      });

      async.parallel([
          function(cb) { presence.connected(TEST_clientId, TEST_username, cb); },
          function(cb) { presence.connected(TEST_clientId, TEST_username, cb); },
          function(cb) { presence.disconnected(TEST_clientId, cb); }
      ], function(err) {
        if(err) return done(err);

        assert.equal(transitionTriggered, 2, 'Incorrect number of transition events');
        done();
      });

    });

    /**
     * Check that double-disconnect events don't mess things up
     */
    it('should handle clients disconnecting twice in quick succession', function(done) {
      var presence = new Presence();

      var TEST_clientId = '10';
      var TEST_username = 'duck';

      var transitionTriggered = 0;
      presence.on('transition', function(username, status) {
        assert.strictEqual(username, TEST_username, 'Incorrect user');
        switch(transitionTriggered++) {
          case 0:
            assert(status, 'User should be online');
            break;
          case 1:
            assert(!status, 'User should be offline');
            break;
          default:
            assert(false, 'Too many transition events');
        }

      });

      async.parallel([
          function(cb) { presence.connected(TEST_clientId, TEST_username, cb); },
          function(cb) { presence.disconnected(TEST_clientId, cb); },
          function(cb) { presence.disconnected(TEST_clientId, cb); }
      ], function(err) {
        if(err) return done(err);

        assert.equal(transitionTriggered, 2, 'Incorrect number of transition events');
        done();
      });

    });

    /**
     * User connects with 5 devices, almost concurrently. Then disconnects 5 devices.
     * Make sure that everything is consistent.
     */
    it('should handle a single user connecting and disconnecting on multiple devices concurrently', function(done) {
      var presence = new Presence();

      var TEST_clientIds = ["11", "12", "13", "14", "15"];
      var TEST_username = 'parallelman';

      var transitionTriggered = 0;
      presence.on('transition', function(username, status) {
        assert.strictEqual(username, TEST_username, 'Incorrect user');
        switch(transitionTriggered++) {
          case 0:
            assert(status, 'User should be online');
            break;
          case 1:
            assert(!status, 'User should be offline');
            break;
          default:
            assert(false, 'Too many transition events');
        }
      });



      async.series([
        function(cb) {
          presence.query([TEST_username], function(err, statii) {
            if(err) return cb(err);

            assert(!statii[TEST_username], 'User should be offline');

            cb();
          });
        },
        function(cb) {
          async.parallel(TEST_clientIds.map(function(clientId) {
            return function(cb) { presence.connected(clientId, TEST_username, cb); };
          }), function(err) {
            if(err) return done(err);

            assert.equal(transitionTriggered, 1, 'Incorrect number of transition events');
            cb();
          });
        },
        function(cb) {
          presence.query([TEST_username], function(err, statii) {
            if(err) return cb(err);

            assert(statii[TEST_username], 'User should be online');

            cb();
          });
        },
        function(cb) {
          async.parallel(TEST_clientIds.map(function(clientId) {
            return function(cb) { presence.disconnected(clientId, cb); };
          }), function(err) {
            if(err) return done(err);

            assert.equal(transitionTriggered, 2, 'Incorrect number of transition events');
            cb();
          });
        },
        function(cb) {
          presence.query([TEST_username], function(err, statii) {
            if(err) return cb(err);

            assert(!statii[TEST_username], 'User should be offline');

            cb();
          });
        },
      ], done);

    });
  });

});