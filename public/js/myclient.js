var MYCLIENT = {
    socket: null,
    user_name: null,
    user_id: null,
    room_name: null,
    clients: {},
    client_room: { name: "", clients: [] },
    // Callbacks
    on_connect: null,
    on_close: null,
    on_error: null,
    on_ready: null,
    on_message: null,
    on_user_connected: null,
    on_user_disconnected: null,
    on_auth: null,

    connect: function( url, room_name, user_name, password, spriteURL, is_sign_up ) 
    {
        if(!url)
            throw("You must specify the server URL of the server");
        if(!room_name)
            throw("You must specify a room name to connect to the Virtual Server");
        if(!user_name)
            throw("You must specify a user name to connect to the Virtual Server");
        if(!password)
            throw("You must specify a password to connect to the Virtual Server");
    
        this.user_name = user_name;
        this.room_name = room_name;

        // If socket not null, close it and set everything to null    
        if(this.socket)
        {
            this.socket.onmessage = null;
            this.socket.onclose = null;
            this.socket.onopen = null;
            this.socket.close();
        }

        this.clients = {};

        if(typeof(WebSocket) == "undefined")
            WebSocket = window.MozWebSocket;
        if(typeof(WebSocket) == "undefined")
        {
            alert("Websockets not supported by your browser, consider switching to the latest version of Firefox, Chrome or Safari.");
            return;
        }

        var protocol = "wss://";
        var final_url = protocol + url + "/?room_name=" + room_name + "&user_name=" + user_name + "&password=" + password + "&avatar=" + spriteURL + "&is_sign_up=" + is_sign_up;
        this.socket = new WebSocket(final_url);
        this.socket.onopen = this.onOpen.bind(this); 
        this.socket.onclose = this.onClose.bind(this);
        this.socket.onmessage = this.onMessage.bind(this);
        this.socket.onerror = this.onError.bind(this);
    },

    connect_with_token: function( url )
    {

        if (!localStorage.token) return false;
        if (!url) throw("You must specify the server URL of the server");

        // If socket not null, close it and set everything to null    
        if (this.socket)
        {
            this.socket.onmessage = null;
            this.socket.onclose = null;
            this.socket.onopen = null;
            this.socket.close();
        }

        this.clients = {};

        if(typeof(WebSocket) == "undefined")
            WebSocket = window.MozWebSocket;
        if(typeof(WebSocket) == "undefined")
        {
            alert("Websockets not supported by your browser, consider switching to the latest version of Firefox, Chrome or Safari.");
            return;
        }
        console.log("Local storage token is: " + localStorage.token);

        var protocol = "wss://";
        var final_url = protocol + url + "/?my_token=" + localStorage.token;
        this.socket = new WebSocket(final_url);
        this.socket.onopen = this.onOpen.bind(this); 
        this.socket.onclose = this.onClose.bind(this);
        this.socket.onmessage = this.onMessage.bind(this);
        this.socket.onerror = this.onError.bind(this);
        return true;
    },

    onOpen: function() 
    {
        console.log("Client socket opened!");

        this.client_room = {
            name: this.room_name, 
            clients: []
        };
        if(this.on_connect) // Calling callback
            this.on_connect(this);
    },

    onClose: function( event ) 
    {
        console.log("Client socket closed!");
        if(this.on_close)
            this.on_close(event);
        this.socket = null;
        this.client_room = null;
    },
    
    onMessage: function( msg ) 
    {
        // When receiving a message from the server, server sends this type of data 
            // var msg= { 
            //         user_id: this.user_id.toString(),
            //         type: type,
            //         data: data
            // };

        if( msg.data.constructor === String ) {
			const parsedMsg = JSON.parse(msg.data);
			this.processServerEvent( parsedMsg.user_id, parsedMsg.type,  parsedMsg.data, parsedMsg );
		}
		else
			console.warn("Unknown message type");
    },

    onError: function( err )
    {
        console.log("Client socket error: " + err);
        if(this.on_error)
            this.on_error;
    },

    close: function()
    {
        if(!this.socket)
            return;
        this.socket.close();
        this.socket = null;
        this.clients = {};
    },

    processServerEvent: function ( author_id, type, data, parsedMsg )
    {
        if(type != "UPDATE")console.log("Processing server event, type: " + type + " , data: " + data);
        if (type == "CHAT_MSG") // user message received
        {
            //MYAPP.receiveMSG(data); usado para mandar a los usuarios que estan cerca-- TODO:
            if(this.on_message)
                this.on_message( author_id, data );
        }
        else if (type == "LOGIN") // new user entering
        {

            if(!this.clients[ author_id ])
            {
                this.clients[ author_id ] = { id: author_id, name: data.username };
            }
            if(author_id != this.user_id)
            {
                if(this.on_user_connected) 
                    this.on_user_connected( author_id, data );
            }
        }
        else if (type == "LOGOUT") // user leaving
        {
            if(this.clients[ author_id ])
            {
                console.log("User disconnected: " + this.clients[ author_id ].name );
                delete this.clients[ author_id ];
            }

            if(this.on_user_disconnected) 
                this.on_user_disconnected( author_id, data );

            // Removing client 
            var pos = this.client_room.clients.indexOf( author_id );
            if(pos != -1)
                this.client_room.clients.splice( pos, 1 );
        }
        else if (type == "USER_ID") // Get user id and user previous position if applicable
        {
            this.user_id = author_id;
            this.user_name = data.user_name;
            this.room_name = data.previous_room;
            this.clients[ author_id ] = { id: author_id, name: this.user_name };
            if(this.on_ready)
                this.on_ready( author_id, data );
        }
        else if (type == "ROOM_INFO") // Get room info
        {
            var room_info = JSON.parse( data );
            this.client_room = room_info;
            this.num_clients = room_info.clients.length;
            for(var i = 0; i < room_info.clients.length; ++i)
            {
                var client_ins = room_info.clients[i];
                this.clients[ client_ins.user_id ] = { id: client_ins.user_id, name: client_ins.user_name };
            }

            if(this.on_room_info)
                this.on_room_info( room_info );

        } else if (type == "UPDATE") // data is user
        {
            var user = data;

            if (user.id === this.user_id) return;
            var room = WORLD.getRoom(user.room);
            if (room) {
               //WORLD_3D.current_room = room; //TODO: do this?
            }
            for (var i = 0; i < parsedMsg.people.length; i++) 
            {
                var other = parsedMsg.people[i];
                var user = WORLD.getUserById(other.id);
                if (user) { // user is in the world already
                    //console.log("[Client] Updating user json");
                    user.fromJSON(other); // update user with info just received

                    var user_node = WORLD_3D.scene.root.findNodeByName(user.name);
                    if (user_node == null) continue;
                    user_node.rotation = user.rotation;
                    user_node.position = user.position;

                } else { // user is not in the world
                    // TODO: do this
                    // user = new User(other.name); // TODO: other.name or user.name here ?
                    // user.fromJSON(other);
                    // WORLD.addUser( user, room);
                    //room.addUser(user);
                }
            }
        } else if(type == "UPDATE_AVATAR") // Indicates a user changed its avatar
        {
            var msg = JSON.parse(data); 
            var user = WORLD.getUserById(author_id);
            WORLD_3D.removeUserNode(user);
            user.avatar = msg.new_avatar;
            user.current_anim = "idle_" + msg.new_avatar;
            WORLD_3D.addUserNode(false, user);

        } else if (type == "AUTH") {

            if(this.on_auth)
                this.on_auth(data);
        } else if (type == "PLAY_TV") {
            document.getElementById("item-button").firstChild.data = "Click to play TV";
            MYAPP.startItemAction(false);

        }
    },

    sendMessage: function( msg ) // Sends a message to all clients in the room
    {
        if(!msg)
            return;
        if(msg.constructor === Object)
            msg = JSON.stringify(msg);
        if(!msg.constructor === String){
            console.error("targeted not supported in binary messages [msg to be sent is not String]");
		    return;
        }

        if(!this.socket)
        {
            console.error("Not connected, cannot send info");
            return;
        }

        var newMsg = {
            isSentToAll: true,
            target: null,
            msgData: msg,
        }
        
        this.socket.send(JSON.stringify(newMsg));
    },
    sendPrivateMessage: function( msg, target_user_ids ) 
    {
        if(msg === null)
		return;

        if(msg.constructor === Object)
            msg = JSON.stringify(msg);

        if(!msg.constructor === String) {
            console.error("targeted not supported in binary messages [msg to be sent is not String]");
            return;
        }
        if(!this.socket)
        {
            console.error("Not connected, cannot send info");
            return;
        }
        if(!target_user_ids) {
            console.error("Need to specified a list of target ids to send private message");
            return;
        }	
        if(!target_user_ids.constructor === Array) {
            console.error("Target ids to send private message should be a array");
            return;
        }
        var newMsg = {
            isSentToAll: false,
            target: target_user_ids,
            msgData: msg
        }
        this.socket.send(JSON.stringify(newMsg));
    },
    
    changeRoom: function( new_room_name ) 
    {
        if(!new_room_name)
            throw("You must indicate a new room name to switch rooms");

        if(!this.socket)
            return;

        var new_req = {
            createNewRoom: true,
            isSentToAll: false,
            target: null,
            msgData: { 
                new_room_name: new_room_name,
                user_id: this.user_id,
            }
        }

        this.room_name = new_room_name;
        this.socket.send(JSON.stringify(new_req));
    },
};