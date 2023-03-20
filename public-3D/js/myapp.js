
// Namespace that includes the whole functionality of the chat
const MYAPP = {

    // Current private chat selected user name
    currentPrivateUserName: '',
    // Map to store private chats' user IDs and order of chat in left menu
    privateMsgsReceived: new Map(),
    // Map to store the correspondence between userName and userID
    mapNamewithIRev: new Map(),
    // Map to store chat html
    mapMsgs: new Map(),
    // user name 
    myUser: 'anon',
    // user ID
    myUserID: '',
    myAvatar: 'girl',
    target_room: "",
    my_language: "en",

    init: function()
    {
      // Join chat
      $('#send-button-join').click(MYAPP.logInChat);
      $('#on-join-input-userName').on('keypress', function(e) {
        if (e.which == 13) MYAPP.logInChat();
      });
      $('#on-join-input-password').on('keypress', function(e) {
        if (e.which == 13) MYAPP.logInChat();
      });

      // Sign up
      $('#signup-button-join').click(MYAPP.goSignUpPage);

      // Sign up chat
      $('#send-button-signup').click(MYAPP.signInChat);
      $('#on-signup-input-userName').on('keypress', function(e) {
        if (e.which == 13) MYAPP.signInChat();
      });
      $('#on-signup-input-password').on('keypress', function(e) {
        if (e.which == 13) MYAPP.signInChat();
      });

      // Choose avatar 
      this.chooseAvatar();

      // Send messages
      $('#send_button').click(MYAPP.sendMessage);
      $('#msg-input').on('keypress', function(e) {
        if (e.which == 13) MYAPP.sendMessage();
      });

      // Enter room
      $('#enter-room-button').click(MYAPP.enterRoom);
      // Music pop up
      $('#item-button').click(MYAPP.startItemAction);
      $('#btn-cancel').click(MYAPP.hideMusicPanel);
      // view buttons
      $('#first-person-view-button').click(MYAPP.changeView);
      $('#3rd-person-view-button').click(MYAPP.changeView);
      $('#far-view-button').click(MYAPP.changeView);
      // anim buttons
      $('#dance-button').click(MYAPP.changeAnim);
      $('#idle-button').click(MYAPP.changeAnim);
      $('#wave-button').click(MYAPP.changeAnim);

      // avatar button
      $('#avatar-button').click(MYAPP.changeAvatar);
    },

    logInChat: function()
    {
      const user_name = $('#on-join-input-userName').val();
      const password = $('#on-join-input-password').val();
      // If the input is empty, do not add
      if (user_name =='' || password == '') return;

      MYAPP.myUser = user_name;

      document.getElementById('login-page').style.display = 'none';
      document.getElementById('canvas-wrap').style.display = 'block';
      MYAPP.startAPP(password, false);
    },

    goSignUpPage: function()
    {
      document.getElementById('login-page').style.display = 'none';
      document.getElementById('signup-page').style.display = 'block';
    },

    signInChat: function()
    {
      const user_name = $('#on-signup-input-userName').val();
      const password = $('#on-signup-input-password').val();
      // If the input is empty, do not add
      if (user_name =='' || password == '') return;

       MYAPP.myUser = user_name;

      document.getElementById('signup-page').style.display = 'none';
      MYAPP.goSelectAvatar(password, true);
    },

    goSelectAvatar: function(passwd, is_start)
    {
      document.getElementById('choose-avatar-page').style.display = 'block';

      $('#avatar-select-button').click(function() {
        document.getElementById('choose-avatar-page').style.display = 'none';
        document.getElementById('canvas-wrap').style.display = 'block';
        if (is_start == true) MYAPP.startAPP(passwd, true);
      });
    },

    startAPP: function(password, is_sign_up) 
    {
      fetch("./js/world.json").then(function(resp) {
              return resp.json();
          }).then(function(json) {
              WORLD.fromJSON(json);
              var room_name = WORLD.default_room;
              WORLD_3D.current_room = WORLD.rooms[WORLD.default_room];
              //console.log("World JSON is: " +JSON.stringify(json));

              // Connect to the server
              MYAPP.connectServer(MYAPP.myUser, room_name, password, is_sign_up);
          }).catch( function(error) {
            console.log("Error fetching:" + error);
          });
    },

    connectServer: function(userName, roomName, password, is_sign_up)
    {
    
      // server.connect( 'localhost:1337', roomName, userName);
      //MYCLIENT.connect('ecv-etic.upf.edu/node/9018/ws', roomName, userName, password, this.myUserSprite);
      MYCLIENT.connect('localhost:9018', roomName, userName, password, this.myAvatar, is_sign_up);

      MYCLIENT.on_connect = function( server ) {
        $('#bar-status').html(`Connected`);
      };

      MYCLIENT.on_auth = function( data ) {
        console.log("INSIDE AUTH");
        if (data.ret == true) {
          //alert("Correct password");
        } else {
          alert(data.msg);
          location.reload(); // Reload page
        }
      }
      MYCLIENT.on_ready = function(id, data) { //TODO: send user avatar, previous room
        $('#bar-username').html(userName);
        $('#bar-roomname').html(data.previous_room);
        
        MYAPP.myUserID = id;
        MYAPP.mapNamewithIRev.set(userName, id);
        // Callbacks
        MYCLIENT.on_room_info = MYAPP.onRoomInfo;
        MYCLIENT.on_user_connected = MYAPP.onUserConnect;
        MYCLIENT.on_user_disconnected = MYAPP.onUserDisconnect;
        MYCLIENT.on_message = MYAPP.onNewMessageReceived;
        MYCLIENT.on_close = MYAPP.onClose;

        // my user object
        MYAPP.my_user_obj = new User(userName);
        MYAPP.my_user_obj.id = parseInt(id);
        MYAPP.my_user_obj.room = data.previous_room;
        MYAPP.my_user_obj.position = data.pos;
        MYAPP.my_user_obj.avatar = data.avatar; 
        MYAPP.myAvatar = data.avatar;
        WORLD_3D.current_room = WORLD.rooms[data.previous_room];
        WORLD.addUser(MYAPP.my_user_obj, WORLD_3D.current_room); // TODO: set WORLD_3D current room a room enviada servidor
        WORLD_3D.onWorldLoaded();
      };
    },

    onRoomInfo: function ( room_info )
    {
      for (var i = 0; i < room_info.clients.length; i++ ) {
        if (room_info.clients[i].user_id != MYAPP.myUserID) {

            if (room_info.clients[i].user_name == MYAPP.myUser) {
              alert("This user name is already logged in");
              location.reload(); // Reload page
            }

            // new user
            var new_user = new User(room_info.clients[i].user_name);
            new_user.id = parseInt(room_info.clients[i].user_id);
            new_user.avatar = room_info.clients[i].user_sprite;
            new_user.position = room_info.clients[i].user_position; // TODO: get this from server

            WORLD.addUser(new_user, WORLD_3D.current_room); // TODO: set WORLD_3D current room a room enviada servidor
            WORLD_3D.addUserNode(false, new_user);

            MYAPP.mapNamewithIRev.set(room_info.clients[i].user_name, room_info.clients[i].user_id); // TODO: DELETE 
          
          // var new_user = new User(room_info.clients[i].user_name);
          // new_user.id = room_info.clients[i].user_id;
          // new_user.avatar = room_info.clients[i].user_sprite;
          // new_user.position = room_info.clients[i].user_position;
          // new_user.target[0] = room_info.clients[i].user_position;
          // WORLD.addUser(new_user, MYAPP.current_room);
          // MYCHAT.mapNamewithIRev.set(room_info.clients[i].user_name, room_info.clients[i].user_id);
        }
      } 
    },
    onUserConnect: function(userID, data) // TODO: should receive position of user, and room where it is
    {
      var userName = data.username;
      MYAPP.mapNamewithIRev.set(userName, userID);
      MYAPP.sendSysMsg('User ' + userID + ' with user name: ' + userName + ',  connected!', userID, MYAPP.currentTime());

      // new user
      var new_user = new User(userName);
      new_user.id = userID;
      new_user.avatar = data.sprite;
      new_user.position = [-10,0,100]; // TODO: get this from server

      WORLD.addUser(new_user, WORLD_3D.current_room); // TODO: set WORLD_3D current room a room enviada servidor
      WORLD_3D.addUserNode(false, new_user);
    },

    onUserDisconnect: function(userID, userName)
    {
      MYAPP.mapNamewithIRev.delete(userName);
      MYAPP.sendSysMsg('User ' + userID + " with user name: " +  userName + " disconnected!", userID, MYAPP.currentTime());
      WORLD.removeUser(WORLD.getUserById(userID));
      WORLD_3D.removeUserNode(WORLD.getUserById(userID));
    },

    onNewMessageReceived: function(authorID, msgStr)
    {
      MYAPP.displayMessage(JSON.parse(msgStr), "left");
    },

    onClose: function()
    {
      alert("Server closed!");
      location.reload(); // Reload page
    },
  
    displayMessage: function  ( msg, side )
    {
      if ( msg.type.toLowerCase() == 'text' ) {
        if ( msg.content != '' ) {
          // Create HTML to display msg
          var contentDiv = document.createElement('div');
          var msgDiv = document.createElement('div');
          msgDiv.className = 'msg';
          contentDiv.className = `content ${side}`;
          var textP = document.createElement('p');
          textP.innerHTML = msg.content;
          var userP = document.createElement('p');
          userP.className = `user-name ${side}`;
          if (side === "left") userP.innerHTML = msg.userName;
          else userP.innerHTML = this.myUser;
          var timeP = document.createElement('p');
          timeP.className = `time ${side}`;
          timeP.innerHTML = msg.time;
          contentDiv.appendChild(textP);
          msgDiv.appendChild(userP);
          msgDiv.appendChild(contentDiv);
          msgDiv.appendChild(timeP);
          var chat = document.getElementById('chat_msg');
          chat.appendChild(msgDiv);
          chat.scrollTop = 100000;
        }
      } else if ( msg.type.toLowerCase() == 'sys' ) {
        if ( msg.content != '' ) {
          // Create HTML for a system msg
          var contentDiv = document.createElement('div');
          var msgDiv = document.createElement('div');
          msgDiv.className = 'msg';
          contentDiv.className ='content sys';
          var textP = document.createElement('p');
          textP.innerHTML = msg.content;
          var timeP = document.createElement('p');
          timeP.className ='time system';
          timeP.innerHTML = msg.time;
          contentDiv.appendChild(textP);
          msgDiv.appendChild(contentDiv);
          msgDiv.appendChild(timeP);
          var chat = document.getElementById('chat_msg');
          chat.appendChild(msgDiv);
          chat.scrollTop = 100000;
        }
      } 
    },
  
    sendSysMsg: function(msgText, userName, time)
    {
      const msgObj = this.createMsgObject('sys', msgText, userName, time);
      this.displayMessage(msgObj, "none");
    },
  
    sendMessage: function()
    {
      const input = $('#msg-input').val();
      if (input == '') return;      
      
      //var nearUsers = MYAPP.getNearbyUsers();
      var msgObj = MYAPP.createMsgObject('text', input, MYAPP.myUser, MYAPP.currentTime());
      MYAPP.displayMessage(msgObj, "right");
  
      //MYAPP.my_user.lastMsg = {content:input,timeStamp:Date.now()/1000};
      
    //   if(nearUsers.length>0){
    //     MYCLIENT.sendPrivateMessage(JSON.stringify(msgObj), nearUsers);
    //   }
      MYCLIENT.sendMessage(JSON.stringify(msgObj));
      $('#msg-input').val(''); // Reset the input value to empty text
    },
  
    currentTime: function() // Return current time in a string
    {
      const today = new Date();
      return today.getHours() + ':' + today.getMinutes();
    },
  
    createMsgObject: function(type, content, userName, time)
    {
      const msgObject = {
        type: type,
        content: content,
        userName: userName,
        time: time,
      };
      return msgObject;
    },

    chooseAvatar: function ()
    {
      //Select avatar
  
      var char1Button = document.getElementById("character-button1");
      var char2Button = document.getElementById("character-button2");
      var char3Button = document.getElementById("character-button3");
      var char4Button = document.getElementById("character-button4");

      char1Button.addEventListener("click",function (e) {
        char1Button.style = "border: 1px solid white; border-radius: 10px; background-color: transparent;";
        char2Button.style = "border: 0; background-color: transparent;";
        char3Button.style = "border: 0; background-color: transparent;";
        char4Button.style = "border: 0; background-color: transparent;";
        MYAPP.myAvatar = 'girl';
      });

      char2Button.addEventListener("click",function (e) {
        char1Button.style = "border: 0; background-color: transparent;";
        char2Button.style = "border: 1px solid white; border-radius: 10px; background-color: transparent;";
        char3Button.style = "border: 0; background-color: transparent;";
        char4Button.style = "border: 0; background-color: transparent;";
        MYAPP.myAvatar = 'bryce';
      });

      char3Button.addEventListener("click",function (e) {
        char1Button.style = "border: 0; background-color: transparent;";
        char2Button.style = "border: 0; background-color: transparent;";
        char3Button.style = "border: 1px solid white; border-radius: 10px; background-color: transparent;";
        char4Button.style = "border: 0; background-color: transparent;";
        MYAPP.myAvatar = 'yellow-girl';
      });

      char4Button.addEventListener("click",function (e) {
        char1Button.style = "border: 0; background-color: transparent;";
        char2Button.style = "border: 0; background-color: transparent;";
        char3Button.style = "border: 0; background-color: transparent;";
        char4Button.style = "border: 1px solid white; border-radius: 10px; background-color: transparent;";
        MYAPP.myAvatar = 'james';
      });
    },

    enterRoom: function()
    {
      document.getElementById('door-pop').style.display = 'none';
      var new_room = WORLD.rooms[target_room]
      if (new_room === undefined) {
        throw("Cannot change room as target room does not exist in WORLD");
      }
      MYCLIENT.changeRoom(new_room.name);
      WORLD.changeRoom(WORLD.getUserById(MYAPP.myUserID), new_room);
      WORLD_3D.changeRoom(WORLD_3D.current_room, new_room);
      $('#bar-roomname').html(new_room.name);
    },

    showEnterRoom: function(target_room_name)
    {
      document.getElementById('door-pop').style.display = 'block';
      target_room = target_room_name;
    },

    hideEnterRoom: function()
    {
      document.getElementById('door-pop').style.display = 'none';
    },

    showItemInteraction: function( name_item )
    {     
      
      var el = document.getElementById("item-button");
      if (name_item == "jukebox")
        el.firstChild.data = "Click to play music";
      else if (name_item == "tv")  
        el.firstChild.data = "Click to play TV";
      document.getElementById('item-pop').style.display = 'block';
    },

    hideItemInteraction: function()
    {
      document.getElementById('item-pop').style.display = 'none';
    },

    startItemAction: function()
    {
      if (document.getElementById("item-button").firstChild.data == "Click to play music")
        document.getElementById('music-panel').style.display = 'block';
      else if (document.getElementById("item-button").firstChild.data == "Click to play TV")
        document.getElementById('video').play();
    },
    hideMusicPanel: function()
    {
      document.getElementById('music-panel').style.display = 'none';
    },

    changeView: function() {
      
      if (this.id === "far-view-button") 
      {
        first_person_view = false
        far_view = true
      }
      else if (this.id === "first-person-view-button")
      {
        far_view = false
        first_person_view = true
      }
      else if (this.id === "3rd-person-view-button")
      {
        far_view = false
        first_person_view = false
      }
    },

    changeAnim: function()
    {
      if (this.id == "dance-button")
        WORLD_3D.current_anim = "dancing" + "_" + MYAPP.myAvatar;
      else if (this.id == "idle-button")
        WORLD_3D.current_anim = "idle" + "_" + MYAPP.myAvatar;
      else if (this.id == "wave-button")
        WORLD_3D.current_anim = "waving" + "_" + MYAPP.myAvatar;
    },

    changeAvatar: function()
    {
      document.querySelector('#avatar-select-button').onclick = () => {};

      document.getElementById('choose-avatar-page').style.display = 'block';
      document.getElementById('canvas-wrap').style.display = 'none';
      $('#avatar-select-button').click(function() {

        
        WORLD_3D.removeUserNode(MYAPP.my_user_obj);
        MYAPP.my_user_obj.avatar = MYAPP.myAvatar;
        MYAPP.my_user_obj.current_anim = "idle_" + MYAPP.myAvatar;
        WORLD_3D.addUserNode(true, MYAPP.my_user_obj);

        var msg = {new_avatar: MYAPP.myAvatar, type: "AVATAR_CHANGE"};
			  if (MYCLIENT.on_connect != null) MYCLIENT.sendMessage(JSON.stringify(msg));


        document.getElementById('choose-avatar-page').style.display = 'none';
        document.getElementById('canvas-wrap').style.display = 'block';
        console.log("[App] New avatar selected: " + MYAPP.myAvatar);
      });
    },

    interactUser: function(node)
    {
      var name_node = MYAPP.myUser + "_selector";
      if (name_node === node.name) return;
      document.getElementById('interact-pop').style.display = 'block';
      $('#click-user-button').click(function() {
        document.getElementById('interact-pop').style.display = 'none';
      });
      $('#click-user-close-button').click(function() {
        document.getElementById('interact-pop').style.display = 'none';
      });
    },

  };


// https://codepen.io/junior-abd-almaged/pen/gQEbRv  --> on message received pass it trhough translate, detect autoamtica language?
// https://libretranslate.com/?source=auto&target=es&q=hello%250A
  
  