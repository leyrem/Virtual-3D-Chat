

// Namespace that includes the whole functionality of the chat
const MYCHAT = {
  // Total number of chats on the side menu
  numChats: 0,
  // Current selected chat on the side menu
  selected: 0,
  // Previous selected chat on the side menu
  previousSelected: 0,
  // Current private chat selected user name
  currentPrivateUserName: '',
  // Map to store private chats' user IDs and order of chat in left menu
  privateMsgsReceived: new Map(),
  // Map to store the correspondence between userName and userID
  mapNamewithIRev: new Map(),
  // Map to store chat html
  mapMsgs: new Map(),
  // user name 
  myUser: '',
  // user ID
  myUserID: '',
  myUserSprite: 'images/spritesheet1.png',
  init: function()
  {

    //Select avatar
    
    var char1Button = document.getElementById("character-button1");
    var char2Button = document.getElementById("character-button2");
    var char3Button = document.getElementById("character-button3");
    var char4Button = document.getElementById("character-button4");

    char1Button.addEventListener("click",function (e){
      char1Button.style = "background-color: white;";
      char2Button.style = "background-color: transparent;";
      char3Button.style = "background-color: transparent;";
      char4Button.style = "background-color: transparent;";
      MYCHAT.myUserSprite = 'images/spritesheet1.png';
    });

    char2Button.addEventListener("click",function (e){
      char1Button.style = "background-color: transparent;"
      char2Button.style = "background-color: white;"
      char3Button.style = "background-color: transparent;"
      char4Button.style = "background-color: transparent;"
      MYCHAT.myUserSprite = 'images/spritesheet2.png';
    });

    char3Button.addEventListener("click",function (e){
      char1Button.style = "background-color: transparent;"
      char2Button.style = "background-color: transparent;"
      char3Button.style = "background-color: white;"
      char4Button.style = "background-color: transparent;"
      MYCHAT.myUserSprite = 'images/spritesheet3.png';
    });

    char4Button.addEventListener("click",function (e){
      char1Button.style = "background-color: transparent;"
      char2Button.style = "background-color: transparent;"
      char3Button.style = "background-color: transparent;"
      char4Button.style = "background-color: white;"
      MYCHAT.myUserSprite = 'images/spritesheet4.png';
    });


    // Join chat
    $('#send-button-join').click(MYCHAT.addChatroom);
    $('#on-join-input-userName').on('keypress', function(e) {
      if (e.which == 13) MYCHAT.addChatroom();
    });
    $('#on-join-input-password').on('keypress', function(e) {
      if (e.which == 13) MYCHAT.addChatroom();
    });
    // Send messages
    $('#send_button').click(MYCHAT.sendMessage);
    $('#msg-input').on('keypress', function(e) {
      if (e.which == 13) MYCHAT.sendMessage(false);
    });

  },

  addChatroom: function()
  {
    const userName = $('#on-join-input-userName').val();
    const password = $('#on-join-input-password').val();
    // If the input is empty, do not add
    if (userName =='' || password == '') return;

    MYCHAT.myUser = userName;
  
    fetch("./world.json")
    .then(function(resp) {
            return resp.json();
        }).then(function(json) {
            WORLD.fromJSON(json);
            MYAPP.onWorldLoaded();

            var roomName = WORLD.default_room;
            console.log("woldd; " +JSON.stringify(json));

            // Hide the init screen
            document.getElementById('login-page').style.display = 'none';
            MYCHAT.selected = 1;
            // Connect to the server
            MYCHAT.connectServer(userName, roomName, password);
        }).catch( function(error){
          console.log("Error fetching:" + error);
        });
  },

  connectServer: function(userName, roomName, password)
  {
  
    $('#chat-connected-msg-status').html(`NOT CONNECTED :(`);
    // server.connect( 'localhost:1337', roomName, userName);
    //MYCLIENT.connect('ecv-etic.upf.edu/node/9018/ws', roomName, userName, password, this.myUserSprite);
    MYCLIENT.connect('localhost:9018', roomName, userName, password, this.myUserSprite);

    MYCLIENT.on_connect = function( server ) {
      $('#chat-connected-msg').html(`You are connected to room: ${roomName}`);
      $('#chat-connected-msg-status').html(`CONNECTED :)`);
      $('#add-chat-div').css('display', 'flex');
    };

    MYCLIENT.on_auth = function( is_valid ) {
      if(is_valid == true) {
        alert("Correct password");
      } else {
        alert("Incorrect password, try again!");
        location.reload(); // Reload page
      }
    }
    MYCLIENT.on_ready = function(id, pos_server) {
      $('#chat-connected-msg-userName').html(`Your userName is: ${userName}`);
      $('#chat-connected-msg-userID').html(`Your userID is: ${id}`);
      MYCHAT.myUserID = id;
      MYCHAT.mapNamewithIRev.set(userName, id);
      MYCLIENT.on_room_info = MYCHAT.onRoomInfo;
      MYCLIENT.on_user_connected = MYCHAT.onUserConnect;
      MYCLIENT.on_user_disconnected = MYCHAT.onUserDisconnect;
      MYCLIENT.on_message = MYCHAT.onNewMessageReceived;
      MYCLIENT.on_close = MYCHAT.onClose;
      MYAPP.my_user = new User(userName);
      MYAPP.my_user.id = id;
      pos_server = parseInt(pos_server);
      MYAPP.my_user.position = pos_server;
      MYAPP.my_user.target[0] = pos_server;
      MYAPP.my_user.avatar = MYCHAT.myUserSprite;
      WORLD.addUser(MYAPP.my_user, MYAPP.current_room);
    };
  },

  onRoomInfo: function ( room_info )
  {
    for (var i = 0; i < room_info.clients.length; i++ ) {
      if(room_info.clients[i].user_id != MYCHAT.myUserID) {


          if(room_info.clients[i].user_name == MYCHAT.myUser) {
            alert("This user name is already logged in");
            location.reload(); // Reload page
          }
        

        var new_user = new User(room_info.clients[i].user_name);
        new_user.id = room_info.clients[i].user_id;
        new_user.avatar = room_info.clients[i].user_sprite;
        new_user.position = room_info.clients[i].user_position;
        new_user.target[0] = room_info.clients[i].user_position;
        WORLD.addUser(new_user, MYAPP.current_room);
        MYCHAT.mapNamewithIRev.set(room_info.clients[i].user_name, room_info.clients[i].user_id);
      }
    } 
  },

  onUserConnect: function(userID, data)
  {
    var userName = data.username;
    MYCHAT.mapNamewithIRev.set(userName, userID);
    MYCHAT.sendSysMsg('User ' + userID + ' with user name: ' + userName + ',  connected!', userID, MYCHAT.currentTime());

    //var new_user = new User(userName);
    new_user.id = userID;
    new_user.avatar = data.sprite;
    WORLD.addUser(new_user, MYAPP.current_room);
  },

  onUserDisconnect: function(userID, userName)
  {
    MYCHAT.mapNamewithIRev.delete(userName);
    MYCHAT.sendSysMsg('User ' + userID + " with user name: " +  userName + " disconnected!", userID, MYCHAT.currentTime());
    WORLD.removeUser(WORLD.getUserById(userID));
  },

  onNewMessageReceived: function(authorID, msgStr)
  {
    MYCHAT.displayMessage(JSON.parse(msgStr));
  },

  onClose: function()
  {
    alert("Server closed!");
    location.reload(); // Reload page
  },

  displayMessage: function(msg)
  {
    if ( msg.type.toLowerCase() == 'text' ) {
      if ( msg.content != '' ) {
        MYCHAT.selectedChange(1);
        // Create HTML to display msg
        var contentDiv = document.createElement('div');
        var msgDiv = document.createElement('div');
        msgDiv.className = 'msg';
        contentDiv.className ='content left';
        var textP = document.createElement('p');
        textP.innerHTML = msg.content;
        var userP = document.createElement('p');
        userP.className = 'user-name left';
        userP.innerHTML = 'user: '+msg.userName;
        var timeP = document.createElement('p');
        timeP.className ='time left';
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
        MYCHAT.selectedChange(1);
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
    } else if ( msg.type.toLowerCase() == 'private' ) {
      // If the chat has already been created,
      // just switch to it, otherwise create chat
      if (MYCHAT.privateMsgsReceived.has(msg.userName)) {
        MYCHAT.selectedChange(MYCHAT.privateMsgsReceived.get(msg.userName));
      } else {
        MYCHAT.privateMsgsReceived.set(msg.userName, MYCHAT.selected);
      }
      MYCHAT.currentPrivateUserName = msg.userName;

      // Create HTML to display msg
      var contentDiv = document.createElement('div');
      var msgDiv = document.createElement('div');
      msgDiv.className = 'msg';
      contentDiv.className ='content left';
      var textP = document.createElement('p');
      textP.innerHTML = msg.content;
      var userP = document.createElement('p');
      userP.className = 'user-name left';
      userP.innerHTML = 'user: '+msg.userName;
      var timeP = document.createElement('p');
      timeP.className ='time left';
      timeP.innerHTML = msg.time;
      contentDiv.appendChild(textP);
      msgDiv.appendChild(userP);
      msgDiv.appendChild(contentDiv);
      msgDiv.appendChild(timeP);
      var chat = document.getElementById('chat_msg');
      chat.appendChild(msgDiv);
      chat.scrollTop = 100000;
    }
  },

  sendSysMsg: function(msgText, userName, time)
  {
    const msgObj = MYCHAT.createMsgObject('sys', msgText, userName, time);
    MYCHAT.displayMessage(msgObj);
  },

  sendMessage: function()
  {
    const input = $('#msg-input').val();
    if (input == '') return;
    // Create HTML to show
    const contentDiv = document.createElement('div');
    contentDiv.className ='content right';
    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg';
    const textP = document.createElement('p');
    textP.innerHTML = input;
    const userP = document.createElement('p');
    userP.className = 'user-name right';
    userP.innerHTML = MYCHAT.myUser;
    const timeP = document.createElement('p');
    timeP.className ='time right';
    var cTime = MYCHAT.currentTime();
    timeP.innerHTML = cTime;
    contentDiv.appendChild(textP);
    msgDiv.appendChild(userP);
    msgDiv.appendChild(contentDiv);
    msgDiv.appendChild(timeP);
    const chat = document.getElementById('chat_msg');
    chat.appendChild(msgDiv);
    chat.scrollTop = 100000;
    
    var nearUsers = MYAPP.getNearbyUsers();
    var msgObj = MYCHAT.createMsgObject('text', input, MYCHAT.myUser, cTime);

    MYAPP.my_user.lastMsg = {content:input,timeStamp:Date.now()/1000};
    
    if(nearUsers.length>0){
      MYCLIENT.sendPrivateMessage(JSON.stringify(msgObj), nearUsers);
    }
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

  changeMsgs: function()
  {
    MYCHAT.mapMsgs.set(MYCHAT.previousSelected, document.getElementById('chat_msg').innerHTML);
    document.getElementById('chat_msg').innerHTML = MYCHAT.mapMsgs.get(MYCHAT.selected);
  },

  selectedChange: function(newVal)
  {
    MYCHAT.previousSelected = MYCHAT.selected;
    MYCHAT.selected = newVal;
  },

};

