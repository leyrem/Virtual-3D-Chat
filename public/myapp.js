// Checking if click is inside canvas
var isMouseHover = false;
var canvas = document.querySelector("canvas");
canvas.addEventListener("mouseleave", function (event) {
    isMouseHover = false
    
    });
canvas.addEventListener("mouseover", function (event) {
    isMouseHover = true
});

var MYAPP = {
    current_room: null,
    my_user: null,
    scale: 1.2,
    cam_offset: 0,
    animations: 
    {
        idle:[0],
        walking:[2,3,4,5,6,7,8,9],
        talking: [0,1]
    },

    init: function(def_room_name) {}, // Used for testing

    onWorldLoaded: function() {
         this.current_room = WORLD.rooms[WORLD.default_room];
    },

    draw: function( canvas, ctx )
    {
        ctx.imageSmoothingEnabled = false;

        ctx.clearRect(0,0,canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width/2 ,canvas.height/2);
        ctx.scale(this.scale,this.scale);
        ctx.translate(this.cam_offset, 0)

        if(this.current_room)
            this.drawRoom(ctx, this.current_room);

        ctx.restore();
    },

    canvasToWorld: function( pos )
    {
        var a = (pos[0] - canvas.width/2)/this.scale-this.cam_offset;
        var b = (pos[1] - canvas.height/2)/this.scale;

        return [a, b];
    },
    
    drawRoom: function( ctx, room )
    {

        //draw room background
        var scale = 1;
        var img = getImage(room.url);
        img.width = 1200;
        img.height = 336; 

        if(img){

            ctx.drawImage(img,-img.width * scale/2, -img.height * scale/2 - 60, img.width*scale, img.height*scale);
            if(this.my_user){
                var doorImg = getImage("images/doorSpritesheet.png");
    
                for(var i = 0; i<room.exits.length;++i){
                    var exit = room.exits[i];
                    ctx.fillStyle = "red";
                    var verticalOutput = 0;
                    if(room.exits[i].target==this.my_user.next_room) verticalOutput = doorImg.height/2;
                    ctx.drawImage(doorImg, 0, verticalOutput, doorImg.width, doorImg.height/2, exit.position,20,exit.width,60);
                }
            }
            

            //draw room users
            for(var i=0; i < room.people.length; ++i)
            {
                var user = WORLD.getUserById(room.people[i]);
                if(user)
                    this.drawUser(ctx,user);
            }
        }
    },

    drawUser: function( ctx, user )
    {
        if(!user.avatar) 
        {
            console.log("Not user avatar");
            return;
        }

        var anim = this.animations[user.animation];
        if(!anim) return;

        var time = performance.now()*0.001;

        var img = getImage(user.avatar);
        var frame = anim[Math.floor(time*7) % anim.length];
        var facing = user.facing;
        ctx.drawImage(img, frame*32, facing*64, 32, 64, user.position-16,20, 32, 64);

        // Draw message on canvas
        if((Date.now()/1000-user.lastMsg.timeStamp)<5){
            var output_text = user.lastMsg.content;/*.split("");

            here I want to create a solution where I compute how many lines there are of text and
            split the ouput text accordignly to the maxWidth, the problem is that fillText doesn't
            allow '\n' to draw different lines so I have to call multiple fillText with every line
            and the new position for each line, add a margin between lines. We must also know how many lines
            beforehand to draw the rectangle first and also the max width, because some letters take more width
            than others.

            A simpler solution is to limit the number of characters in the input :)

            output_text = output_text.join("");*/

            ctx.font = "bolder 15px arial";

            var textWidth = ctx.measureText(output_text).width;
            var textHeight = ctx.measureText(output_text).fontBoundingBoxAscent + 
                ctx.measureText(output_text).fontBoundingBoxDescent;

            ctx.style = "black";            
            ctx.fillStyle = "white";
            ctx.fillRect(user.position-textWidth/2,-textHeight,textWidth,textHeight);
            
            
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillStyle = "black";

            ctx.fillText(output_text,user.position , -textHeight/2);
            
        }
    },

    getNearbyUsers: function()
    {
        var maxDist = canvas.width/2;
        var users = this.current_room.people;
        var nearUsers = [];
        var tempUser = null;
        for(var i = 0; i<users.length; i++){
            tempUser = WORLD.getUserById(users[i]);
            if(tempUser){
                if(Math.abs(this.my_user.position-tempUser.position)<maxDist && tempUser.id!=this.my_user.id){
                    nearUsers.push(tempUser.id);
                }
            }
        }

        return nearUsers;
        
    },
    updateUser: function( user, dt )
    {
        if(user){

            var room = this.current_room;
            user.target[0] = clamp(user.target[0],room.range[0],room.range[1]);

            var diff= (user.target[0]-user.position);
            var delta = diff;
            if (delta > 0) {
                delta = 30;
            }else if (delta < 0) {
                delta = -30;
            }else{
                delta = 0;
            }
            if (Math.abs(diff) < 1) {
                if(typeof(user.target[0]) != typeof("1")){
                    user.position = user.target[0];
                    delta = 0;
                }
            } else {
                user.position += delta*dt;
            }

            if(delta == 0) {
                user.animation = "idle";
            }else {
                if(delta > 0) {
                    user.facing = FACING_RIGHT;
                } else {
                    user.facing = FACING_LEFT;
                }
                user.animation = "walking";
            }
            user.position = clamp(user.position, room.range[0], room.range[1]);
            var wUser = WORLD.getUserById(user.id);
            wUser = user;
        }
    },

    update: function( dt )
    {

        if(this.current_room && this.my_user){
            for(var i = 0; i < this.current_room.people.length; ++i) {
                var user = WORLD.getUserById(this.current_room.people[i]);
                this.updateUser(user,dt);
            }

            for(var i=0; i<this.current_room.exits.length;++i){
                var exit = this.current_room.exits[i];
                if(exit.target==this.my_user.next_room){ //si hi ha 2 portes que van a la mateixa room, i clica la més llunyana, entraria a la primera que passi per sobre
                    if(this.my_user.position>exit.position){
                        if(this.my_user.position<exit.position+exit.width) {
                            var new_room = WORLD.getRoom(exit.target);
                            this.my_user.room = exit.target;
                            WORLD.changeRoom(this.my_user, new_room);
                            MYCLIENT.changeRoom(new_room.name);
                            $('#chat-connected-msg').html(`You are connected to room: ${new_room.name}`);
                            document.getElementById('chat_msg').innerHTML = "";
                            this.current_room = new_room;
                        }
                    }
                }
            }
            this.is_cursor_on_exit();
            if(isNaN(this.cam_offset)) this.cam_offset = 0;
            this.cam_offset=lerp(this.cam_offset, -this.my_user.position,0.02);
        }
    },

     is_cursor_on_exit: function()
     {
        var localmouse = this.canvasToWorld(mouse_pos);
        var cursor_exit = null;
        for(var i = 0; i < this.current_room.exits.length; ++i) {
            var exit = this.current_room.exits[i];
            if(localmouse[0] > exit.position){
                if(localmouse[0] < exit.position+exit.width) {
                    if(localmouse[1] > 20) {//change the hardcode to datacode
                        if(localmouse[1] < 80) {
                            cursor_exit = exit;
                        }
                    }
                }
            }
        }
        
        if(cursor_exit) {
            document.body.style.cursor = 'pointer'; //Put in here door sprites to open and close :)
        } else {
            document.body.style.cursor = '';
        }
        return cursor_exit;
    },

    onMouse: function( e )
    {

        var localmouse = this.canvasToWorld(mouse_pos);
        if(e.type == "mousedown"){
            if(localmouse[0].constructor != String && !isNaN(localmouse[0])){
                if(this.my_user && isMouseHover) {
                    
                    this.my_user.target[0] = localmouse[0];
                    this.my_user.target[1] = localmouse[1];
        
                    var cursor_exit = this.is_cursor_on_exit();
                    if(cursor_exit) this.my_user.next_room=cursor_exit.target;
                    else this.my_user.next_room="";
                    var msg = {content: this.my_user.target[0], userName:this.my_user.name, type:"movement"};
                if(MYCLIENT.on_connect!=null) MYCLIENT.sendMessage(JSON.stringify(msg));
                }
            }
        }else if(e.type == "mousemove"){
    
        }else //mouseup
        {
    
        }
    },
    
    onKey: function () {

    },

    receiveMSG: function( msg )
    {
        var parsedMsg = JSON.parse(msg);
        if (parsedMsg.type = "text"){
            WORLD.changeUserLastMSG(parsedMsg.userName, parsedMsg.content);
        }
    },
};