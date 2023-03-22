var Room = require('../public-3D/js/world.js');
const crypto = require('crypto');
var DATABASE_MANAGER = require('./credentials.js').DATABASE_MANAGER;
var WORLD = Room.WORLD;
const fs = require('fs');

var queryString = require('querystring'),
            url	= require('url'),
            http = require('http');
			

var MYSERVER = {
    clients: {},
    rooms: {}, 
    DB: {msgs: []},
    last_id: 1, // ID to assing to new users
    MAX_BUFFER: 100,// Max number of messages that can be buffered
    // Map to store each username per userid
    clientIDtoUsername: new Map(),

    init: function()
    {
        console.log("Initializing server...");
		// TODO:
		// Tengo un world en servidor y un world en cliente y hay que manternerlos synchornized
		const data = fs.readFileSync('../public-3D/js/world.json');
		WORLD.fromJSON(JSON.parse(data));
		console.log("Number of rooms: " + Object.keys( WORLD.rooms ).length);
	},

    onReady: function() 
    {
        console.log("Server is ready!");
		this.interval = setInterval(MYSERVER.onTick.bind(MYSERVER), 1000 / 10 ); // 10 times per second
	},

    onUserConnect: async function( conn, req_url )
    {
        console.log("[server] NEW USER CONNECTED");

        // Assing callbacks to client connection
        conn.sendToClient = function( type, data ) {
            console.log("[server] Sending " + type + " to client, data is: " + data);
			if (type == "AUTH") {
				var msgT = { 
					user_id: "non",
					type: type,
					data: data
				};
				this.send(JSON.stringify(msgT));
			} else {
				var msgT = { 
					user_id: this.user_id.toString(),
					type: type,
					data: data
				};
				this.send(JSON.stringify(msgT));
			}
			
        };

		var room_name = "";
		var user_name = "";
		var password = "";
		var sprite = "";
		var is_sign_up = "";
		var ret_u = null;

		var token = req_url.query["my_token"];
		if (token != null) ret_u = await DATABASE_MANAGER.get_session_token_info(token);
		if (ret_u != null) {
			user_name = ret_u;
		} else {
			room_name = req_url.query.room_name;
			user_name = req_url.query.user_name;
			password = req_url.query.password;
			sprite = req_url.query.avatar;
			is_sign_up = req_url.query.is_sign_up;
		}

		 if (password != "") {
			// DEAL WITH PASSORD
			if (is_sign_up == "false") {
				var res = await DATABASE_MANAGER.check_user_in_db(user_name);
				if (res == false) {
					console.log("[Server] uknown user, has to sign up first");
					conn.sendToClient("AUTH", {ret: false, msg: "Username is not registered, you need to signup first"}); // Means the user has to signup first
					return;
				}
			}

			if (is_sign_up == "true") {
				var res = await DATABASE_MANAGER.check_user_in_db(user_name);
				if (res == true) {
					console.log("[Server] User is trying to sign up with already existing username");
					conn.sendToClient("AUTH", {ret: false, msg: "User with that username already exists"}); // Means the user has to signup with another user name
					return;
				}
				// Save the avatar of the user if the user is signing up for the first time
				await DATABASE_MANAGER.save_user_avatar(user_name, sprite);
			}
			
			var ret = await DATABASE_MANAGER.login(user_name, password);
			if (ret == false) {
				conn.sendToClient("AUTH", {ret: false, msg: "Incorrect password"});
				return;
			}
			conn.sendToClient("AUTH", {ret: true, msg: ""});

			token = crypto.randomBytes(16).toString('base64');
			console.log("[GENERATE AND STORE TOKEN] Token is: " + token);
			await DATABASE_MANAGER.save_session_token(user_name, token);
		 }
		

		// Get the user avatar and send it to user when the user logs in again
		var u_avatar = await DATABASE_MANAGER.get_user_avatar(user_name);
		if (u_avatar != null) sprite = u_avatar;


		// Get the last room the user was in when he/she logged out previously
		var room_name_stored = await DATABASE_MANAGER.get_user_room(user_name);
		if (room_name_stored != null) {
			conn.room_name = room_name_stored;
		} else conn.room_name = room_name;

        // Assing ID to client connection
        conn.user_id = this.last_id;
        this.last_id++;
        //Assing user_name to client connection
        conn.user_name = user_name;
		conn.sprite = sprite;

        this.clientIDtoUsername.set(conn.user_id.toString(), conn.user_name);

        // Add client to room (or create it)
        if(this.rooms[conn.room_name] == null) this.createRoom(conn.room_name);
		var room = this.rooms[conn.room_name];
		room.clients[conn.user_id] =  conn; // Add client to room
		this.clients[conn.user_id] =  conn; // Add client to server

		// TODO:
		// Create a user for the new client
		var user = new Room.User(conn.user_name);
		user.id = conn.user_id;	
		user.avatar = sprite;	// when user connects to server, draw him/store him in the default room (should be loaded from JSON represenytation of world)
		var room_s = WORLD.getRoom(WORLD.default_room); // TODO: why storing in the default room and not on the room you pass?
		//var room_s = WORLD.default_room
		//room_s.addUser(user); // WORLD.addUser is called in the client??
		conn.user = user; // Store the user class instace object in the connection websocket
		// //user._connection = conn;
		// Iterate through room.people and send the login to the people stored there.
		// Send the characteristics of the room to the clieny too --> check video
		// The client will call WORLD.createRoom when joining a new room with the data the server sends him

		WORLD.addUser( conn.user, room_s );

		var pos_recv = await DATABASE_MANAGER.get_user_position(conn.user_name);
		if (pos_recv != null) {
			// Send ID to client, position, avatar, room and token
			var previous_data = { user_name: user_name, pos: JSON.parse(pos_recv), avatar: sprite, previous_room: conn.room_name, session_token: token };
			conn.user.position = JSON.parse(pos_recv);
			conn.sendToClient("USER_ID", previous_data);
		}  else {
			var def_data = { user_name: user_name, pos: [-10, 0, 100], avatar: sprite, previous_room: conn.room_name, session_token: token };
			conn.user.position = [-10,0,100];
			conn.sendToClient("USER_ID", def_data); // default position
		}

		//console.log("[SERVER] Adding user to WORLD in room: " + room_s.name + ", on position: " + user.position);

        // send room info
		this.sendRoomInfo(conn);
		// send login info
		this.sendLoginInfo(conn);
	
        // Send all buffered messages in the room to client
		// for(var i = 0; i < room.buffer.length; ++i)
        //     conn.sendToClient("CHAT_MSG", room.buffer[i]);

    },

	sendRoomInfo: function( conn ) 
	{
		var clients = this.rooms[conn.room_name].clients;
		var room_info = { name: conn.room_name, clients: [] };
		for(const i in clients) {
			var user_pos = WORLD.users[clients[i].user_name].position;
			room_info.clients.push({ user_id: clients[i].user_id, user_name: clients[i].user_name, user_position: user_pos , user_sprite: clients[i].sprite});
		}
		conn.sendToClient( "ROOM_INFO", JSON.stringify( room_info ) );
	},

	sendLoginInfo: function( conn )
	{
		this.sendToRoom(conn.room_name, conn.user_id.toString(), true, "LOGIN", {username: conn.user_name, sprite: conn.sprite}, null);
	},

    createRoom: function( name ) 
    {
        console.log(" [server] Room created: " + name );
		this.rooms[name] = { clients: {}, buffer:[] };
    },

    onUserDisconnect: async function( conn )
    {
        console.log("[server] User disconnected");
        console.log('[server] Close socket of user_id: ' + conn.user_id);

		if (!conn.user_id) return;
		this.sendToRoom(conn.room_name, conn.user_id.toString(), true, "LOGOUT", conn.user_name, null);

		// Storing the user's last position
		await DATABASE_MANAGER.save_user_position(conn.user_name, JSON.stringify(conn.user.position)); 

		// Storing the user's last room
		await DATABASE_MANAGER.save_user_room(conn.user_name, conn.room_name); 
	
		var room = this.rooms[conn.room_name];
		if(room)
		{
			delete room.clients[conn.user_id];
			if(Object.keys(room.clients).length == 0)
				delete this.rooms[conn.room_name];
		}
		delete this.clients[conn.user_id];
		WORLD.removeUser(conn.user);

    },

    onUserMessage: async function( ws, msg )
    {
        const msgReceived = JSON.parse(msg);
		//console.log(" [server] (onUserMessage) MSG received: ", msgReceived);
        // MSGS received sent by client are like this:
			// newMsg = {
				// createNewRoom: true/false
			// 	isSentToAll: true/fañse,
			// 	target: null,
			// 	msgData: msg
			// }

		if (msgReceived.createNewRoom) 
		{
			this.changeRoom(msgReceived.msgData);
		} 
		else if(JSON.parse(msgReceived.msgData).type == "UPDATE_STATE") 
		{

			var dat = JSON.parse(msgReceived.msgData);
			ws.user.position =  dat.pos;
			ws.user.current_anim = dat.anim;
			ws.user.rotation = dat.rot;

			WORLD.users[ws.user_name].position = dat.pos;
			WORLD.users[ws.user_name].current_anim = dat.anim;
			WORLD.users[ws.user_name].rotation = dat.rot;

		} 
		else if(JSON.parse(msgReceived.msgData).type == "AVATAR_CHANGE")
		{
			var new_avatar = JSON.parse(msgReceived.msgData).new_avatar;
			ws.user.avatar = new_avatar;
			ws.user.current_anim = "idle_" + new_avatar;
			ws.sprite = new_avatar;
			WORLD.users[ws.user_name].avatar = new_avatar;
			await DATABASE_MANAGER.save_user_avatar(ws.user_name, new_avatar);
			console.log("Aout to save");
			this.sendToRoom(ws.room_name, ws.user_id.toString(), true, "UPDATE_AVATAR", msgReceived.msgData, null);
		}
		else 
		{
			this.sendToRoom(ws.room_name, ws.user_id.toString(), msgReceived.isSentToAll, "CHAT_MSG", msgReceived.msgData, msgReceived.target);
		}
    },
    sendToRoom: function( roomName, userID, sendAll, event, data, target_id )
    {
        console.log("[server] Sending " +  event + " to room " + roomName + " with data: " +  data);

		if(data === undefined)
			return;


		var room = this.rooms[roomName];
		if(!room)
			return;
	

		// Only buffering room messages sent to all	
		if( event == "CHAT_MSG" && sendAll ) {
			if(room.buffer.length > this.MAX_BUFFER)
				room.buffer.shift();
			room.buffer.push(data);
		}

		// Broadcast to all clients in the room
		for(const i in room.clients)
		{
			client = room.clients[i];

			if(!sendAll) {
				console.log("Sending private msg to: " + target_id);
				console.log("Client id is: " + client.user_id);
				// Can only send messages to users in the current room
				if( target_id == client.user_id ) {
					console.log("IN");
					if ( client.user_id != userID ) {
						var msgB = { 
							user_id: userID,
							type: "CHAT_MSG",
							data: data
						};
						client.send( JSON.stringify(msgB) );
					}
				}
				continue;
			}
			// Do not send to yourself	
			if ( client.user_id != userID ) {
				var msgS = {
					user_id: userID,
					type: event,
					data: data
				}

				client.send(JSON.stringify(msgS));
			}		
		}
    },
	changeRoom: function( data ) 
	{
		// msgData: { 
		// 	new_room_name: new_room_name,
		// 	user_id: this.user_id,
		// }
		var client_conn = this.clients[data.user_id];
		if(!client_conn)
			throw("Error client connection does not exist for user id in changeRoom");

		if(data.user_id != client_conn.user_id)
			throw("Error with Ids when changing room");
	

		// Remove client for current room 
		delete this.rooms[client_conn.room_name].clients[data.user_id];
		// Inform users in old room the user left
		this.sendToRoom(client_conn.room_name, client_conn.user_id.toString(), true, "LOGOUT", client_conn.user_id.toString(), null);

		 // Add client to room (or create it)
		 if(this.rooms[data.new_room_name] == null) this.createRoom(data.new_room_name);
		 var room = this.rooms[data.new_room_name];
		 room.clients[data.user_id] =  client_conn; // Add client to room

		client_conn.room_name = data.new_room_name;

		console.log("sending room info");
		// Inform all users in the new joined room a new user just joined
		this.sendRoomInfo(client_conn);
		console.log("sending login info");
		// Send client the info of the room he/she just joined
		this.sendLoginInfo(client_conn);

		 // Send all buffered messages in the room to client
		// for(var i = 0; i < room.buffer.length; ++i)
		// 	client_conn.sendToClient("CHAT_MSG", room.buffer[i]);

	},
	onTick: function() // send to client heatbearts of the current state of the server
	{
		for(const i in this.clients)
		{
			client_conn = this.clients[i];
			var user = client_conn.user;
			var room = WORLD.getRoom(user.room);
			if(!room) // user is not in any room
				continue;

			//console.log("Room: " + room.name + ", length: " + room.people.length);
			this.sendRoomState(room, client_conn);
		}
	},
	sendRoomState: function(room, connection)
	{
		// Sending the state to every user in the room
		var user = connection.user;

		// SEND positioN, rotation,animation_name

		var data = {
			user_id: "server",
			type: "UPDATE",
			data: user, 
			people: []
		};
		for(var i = 0; i < room.people.length; i ++ )
		{
			var user_id = room.people[i]; 
			var user = WORLD.getUserById(user_id);
			if(!user)
				continue;
			data.people.push(user);
		}
		connection.send(JSON.stringify(data));
	},
};

module.exports = { MYSERVER };