var Presence = require('..');
var assert = require('assert');

describe('presence engine', function() {
  describe('simple cases', function() {
    it('should handle a single connect', function(done) {
      'use strict';

      var presence = new Presence();

      var clientId = '1';
      var username = 'moo';

      var onlineTriggered = 0;
      presence.on('transition', function(username) {
        assert.strictEqual(++onlineTriggered, 1);
        assert.strictEqual(username, 'moo');
      });

      presence.connected(clientId, username, function(err) {
        if(err) return done(err);
        assert.strictEqual(onlineTriggered, 1, 'Expected online event to be triggered');
      });

    });

    it('should emit two presence events for a connect-disconnect', function(done) {
      'use strict';

      var presence = new Presence();

      var clientId = '2';
      var username = 'moocow';

      var transitionTriggered = 0;
      presence.on('transition', function(username) {
        assert.strictEqual(username, 'moocow');
      });

      presence.connected(clientId, username, function(err) {
        if(err) return done(err);

        assert.strictEqual(transitionTriggered, 1, 'Expected event to be triggered');

        presence.disconnected(clientId, function() {
          if(err) return done(err);

          assert.strictEqual(transitionTriggered, 2, 'Expected event to be triggered');

          done();
        });

      });

    });
  });
});