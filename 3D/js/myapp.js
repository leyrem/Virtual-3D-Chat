
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
        if (e.which == 13) MYAPP.sendMessage(false);
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

    },

    logInChat: function()
    {
      const user_name = $('#on-join-input-userName').val();
      const password = $('#on-join-input-password').val();
      // If the input is empty, do not add
      if (user_name =='' || password == '') return;

      document.getElementById('login-page').style.display = 'none';
      MYAPP.goSelectAvatar();
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

      document.getElementById('signup-page').style.display = 'none';
      MYAPP.goSelectAvatar();
    },

    goSelectAvatar: function()
    {
      document.getElementById('choose-avatar-page').style.display = 'block';

      $('#avatar-select-button').click(function() {
        document.getElementById('choose-avatar-page').style.display = 'none';
        document.getElementById('canvas-wrap').style.display = 'block';
        MYAPP.startAPP();
      });
    },

    startAPP: function() 
    {
      fetch("./js/world.json").then(function(resp) {
              return resp.json();
          }).then(function(json) {
              WORLD.fromJSON(json);
              WORLD_3D.onWorldLoaded();
              var room_name = WORLD.default_room;
              //console.log("World JSON is: " +JSON.stringify(json));

              // Connect to the server
              //MYCHAT.connectServer(userName, room_name, password);
          }).catch( function(error) {
            console.log("Error fetching:" + error);
          });
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
          if(side === "left") userP.innerHTML = msg.userName;
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
          MYAPP.selectedChange(1);
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
      WORLD_3D.changeRoom(WORLD_3D.current_room, new_room);
      //console.log("Enter room clicked");
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
        WORLD_3D.current_anim = animations.dancing;
      else if (this.id == "idle-button")
        WORLD_3D.current_anim = animations.idle;
      else if (this.id == "wave-button")
        WORLD_3D.current_anim = animations.waving;
    },

  };
  
  