prehash-presence-challenge
==========================

Thank you for attempting Gitter's presence assessment!

One of the problems that online collaboration platforms have to solve is that of **presence**: that is, having a way of determining whether a user is online or offline at any given point in time.

1. A user may be online simultaneously in multiple browser windows, or across multiple devices. 

2. A user may be associated with multiple clients, but a client is only ever associated with a single user. 

3. Each distinct connection is identified by a __*clientId*__. A user is identified by a __*username*__.

4. When a client connects, the `connected(clientId, username)` method on is called.

5. When a client disconnects, the `disconnected(clientId)` method is called.

6. A client is considered to be __*connected*__ between the first call to `connected(clientId, userId)` and the first call to `disconnected(clientId)` for that clientId.

7. A user is considered to be __*online*__ when one of more connected clients are associated with the user. 

8. A user is considered to be __*offline*__ when no connected clients are associated with the user.
 
9. When a user transitions from *offline* to *online* or *offline* to *online*, the presence object should emit the `'transition'` event.
	
	```
	presence.on('transition', function(username, state) {
	  if(state) {
		  // User is now online....
	  } else {
		  // User is now offline....
	  }
	});
	```
	
10. The presence class should allow the status of users to be queried using the `query` method:

	```
	presence.query(['suprememoocow', 'mydigitalself'], function(err, statii) {
		if(err) { ... }
		
		if(statii['suprememoocow']) { .. online .. } 
	});
	```

--------------------------

##### Tips and suggestions

1. For scalability and failover, the presence engine operates in a clustered environment. For this reason, all shared state is kept in a Redis database store. 

2. Due to the highly concurrent nature of the cluster, we recommend using atomic operations to ensure consistency. We recommend using Redis Lua scripting, CAS or MULTI-EXEC blocks.

3. If you choose to use redis lua scripting, the [redis-scripto](https://www.npmjs.org/package/redis-scripto) node module has been included in the package.

4. Sometimes strange things happen: for example multiple connect or disconnect events for the same client can occassionally occur. Your implementation should handle these cases in a tidy manner.