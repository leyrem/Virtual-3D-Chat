

// Namespace that includes the whole functionality of the chat
const MYCHAT = {


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
    myUserSprite: 'images/spritesheet1.png',
    init: function()
    {
      
      // Send messages
      $('#send_button').click(MYCHAT.sendMessage);
      $('#msg-input').on('keypress', function(e) {
        if (e.which == 13) MYCHAT.sendMessage(false);
      });
  
    },
  
    displayMessage: function( msg, side)
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
      var msgObj = MYCHAT.createMsgObject('text', input, MYCHAT.myUser, MYCHAT.currentTime());
      MYCHAT.displayMessage(msgObj, "right");
  
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

  };
  
  