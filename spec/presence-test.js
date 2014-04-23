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

      var TEST_clientId = '1';
      var TEST_username = 'moo';

      var transitionTriggered = 0;
      presence.on('transition', function(username) {
        assert.strictEqual(++transitionTriggered, 1);
        assert.strictEqual(username, TEST_username);
      });

      presence.connected(TEST_clientId, TEST_username, function(err) {
        if(err) return done(err);
        assert.strictEqual(transitionTriggered, 1);
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

  describe('one user connected on multiple devices', function() {
    it('should handle a single user connecting on multiple devices', function(done) {

      var presence = new Presence();

      var TEST_clientId1 = '4';
      var TEST_clientId2 = '5';
      var TEST_username = 'tinky';

      var transitionTriggered = 0;
      presence.on('transition', function(username) {
        assert.strictEqual(++transitionTriggered, 1);
        assert.strictEqual(username, TEST_username);
      });

      async.series([
        function(cb) {
          presence.query([TEST_username], function(err, statii) {
            if(err) return cb(err);

            assert(!statii[TEST_username]);

            cb();
          });
        },
        function(cb) {
          presence.connected(TEST_clientId1, TEST_username, function(err) {
            if(err) return cb(err);

            assert.strictEqual(transitionTriggered, 1);
            cb();
          });
        },
        function(cb) {
          presence.query([TEST_username], function(err, statii) {
            if(err) return cb(err);

            assert(statii[TEST_username]);

            cb();
          });
        },
        function(cb) {
          presence.connected(TEST_clientId2, TEST_username, function(err) {
            if(err) return cb(err);

            assert.strictEqual(transitionTriggered, 1);
            cb();
          });
        },
        function(cb) {
          presence.query([TEST_username], function(err, statii) {
            if(err) return cb(err);

            assert(statii[TEST_username]);

            cb();
          });
        }
      ], function(err) {
        if(err) return done(err);

        assert.equal(transitionTriggered, 1);
        done();
      });

    });

    it('should handle a single user connecting and disconnecting on multiple devices', function(done) {
      var presence = new Presence();

      var TEST_clientId1 = '6';
      var TEST_clientId2 = '7';
      var TEST_username = 'blinky';

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

      async.series([
        function(cb) {
          presence.query([TEST_username], function(err, statii) {
            if(err) return cb(err);

            assert(!statii[TEST_username]);

            cb();
          });
        },
        function(cb) {
          presence.connected(TEST_clientId1, TEST_username, function(err) {
            if(err) return cb(err);

            assert.strictEqual(transitionTriggered, 1);
            cb();
          });
        },
        function(cb) {
          presence.query([TEST_username], function(err, statii) {
            if(err) return cb(err);

            assert(statii[TEST_username]);

            cb();
          });
        },
        function(cb) {
          presence.connected(TEST_clientId2, TEST_username, function(err) {
            if(err) return cb(err);

            assert.strictEqual(transitionTriggered, 1);
            cb();
          });
        },
        function(cb) {
          presence.query([TEST_username], function(err, statii) {
            if(err) return cb(err);

            assert(statii[TEST_username]);

            cb();
          });
        },
        function(cb) {
          presence.disconnected(TEST_clientId1, function(err) {
            if(err) return cb(err);

            assert.strictEqual(transitionTriggered, 1);
            cb();
          });
        },
        function(cb) {
          presence.query([TEST_username], function(err, statii) {
            if(err) return cb(err);

            assert(statii[TEST_username]);

            cb();
          });
        },
        function(cb) {
          presence.disconnected(TEST_clientId2, function(err) {
            if(err) return cb(err);

            assert.strictEqual(transitionTriggered, 2, 'Expected second trigger event');
            cb();
          });
        },
        function(cb) {
          presence.query([TEST_username], function(err, statii) {
            if(err) return cb(err);

            assert(!statii[TEST_username]);

            cb();
          });
        }

      ], function(err) {
        if(err) return done(err);

        assert.equal(transitionTriggered, 2);
        done();
      });

    });

  });

  describe('timing cases', function() {
    it('should handle a fast connect/disconnect', function(done) {
      var presence = new Presence();

      var TEST_clientId = '8';
      var TEST_username = 'chicken';

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

      var TEST_clientId = '9';
      var TEST_username = 'sheep';

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

      var TEST_clientId = '10';
      var TEST_username = 'duck';

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


    it('should handle a single user connecting and disconnecting on multiple devices concurrently', function(done) {
      var presence = new Presence();

      var TEST_clientIds = ["11", "12", "13", "14", "15"];
      var TEST_username = 'parallelman';

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



      async.series([
        function(cb) {
          presence.query([TEST_username], function(err, statii) {
            if(err) return cb(err);

            assert(!statii[TEST_username]);

            cb();
          });
        },
        function(cb) {
          async.parallel(TEST_clientIds.map(function(clientId) {
            return function(cb) { presence.connected(clientId, TEST_username, cb); };
          }), function(err) {
            if(err) return done(err);

            assert.equal(transitionTriggered, 1);
            cb();
          });
        },
        function(cb) {
          presence.query([TEST_username], function(err, statii) {
            if(err) return cb(err);

            assert(statii[TEST_username]);

            cb();
          });
        },
        function(cb) {
          async.parallel(TEST_clientIds.map(function(clientId) {
            return function(cb) { presence.disconnected(clientId, cb); };
          }), function(err) {
            if(err) return done(err);

            assert.equal(transitionTriggered, 2);
            cb();
          });
        },
        function(cb) {
          presence.query([TEST_username], function(err, statii) {
            if(err) return cb(err);

            assert(!statii[TEST_username]);

            cb();
          });
        },
      ], done);

    });
  });

});