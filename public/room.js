// MODEL

var FACING_RIGHT = 0;
var FACING_FRONT = 1;
var FACING_LEFT = 2;
var FACING_BACK = 3;

function clamp(v,min,max) { return (v<min?min:(v>max?max:v));}
function lerp(a,b,f){ return a*(1-f)+b*f; }

function User( name )
{
    this.id = -1;
    this.name = name || "unnamed";
    this.room = "";
    this.position = 0;
    this.facing = FACING_FRONT;
    this.animation = "idle";
    this.avatar = "images/spritesheet.png";
    this.target = [0,0];
    this.lastMsg = {content: "", timeStamp: 0};
}

User.prototype.fromJSON = function( json )
{
    for(var i in json)
    {
        this[i] = json[i]; // update every variable in the User instance
        console.log()
    }
}

function Room( name )
{
    this.id = -1;
    this.name = name;
    this.url = null;
    this.people = [];
    this.range = [-100,100];
    this.exits = [];
}

Room.prototype.addUser = function( user )
{
    var index = this.people.indexOf(user.id);
    var index2 = this.people.indexOf(user.id.toString());
    if(index != -1 || index2 !=-1)
        return;
    this.people.push(user.id);
    user.room = this.name;
}

Room.prototype.removeUser = function( user )
{
    var index = this.people.indexOf(user.id);
    if(index != -1)
        this.people.splice(index, 1);
}

var WORLD = {
    last_id: 0,
    default_room: null,
    rooms: {},
    users: {},
    users_by_id: {},

    createRoom: function( name, url , data)
    {
        var room = new Room(name);
        room.id = this.last_id++;
        room.url = url;

        if(data){
            for(var i in data)
                room[i] = data[i];
        }

        return room;
    },

    getRoom: function( name ) { return this.rooms[name]; },
    
    addUser: function( user, room )
    {
        this.users[user.name] = user;
        this.users_by_id[user.id] = user;
        room.addUser(user);
    },

    changeRoom: function ( user, new_room )
    {
        this.removeUser(user);
        user.room = new_room;
        new_room.addUser(user);
    },

    changeUserTarget: function( user, target )
    {
        user.target=[target,0];
        console.log(user);
        this.users[user.name] = user;
    },

    removeUser: function( user )
    {
        var room = this.getRoom(user.room);
        if(room)
            room.removeUser(user);
    },

    getUserById: function( id ) { return this.users_by_id[id]; },

    fromJSON: function( json )
    {
        for(var i in json.rooms)
        {
            var some_room = this.createRoom(i, json.rooms[i].url, json.rooms[i]);
            this.rooms[some_room.name] = some_room;
        }
        this.last_id = json.last_id;
        this.default_room = json.default_room;
    },

    changeUserLastMSG: function( userName, msgContent )
    {
        var user = this.users[userName];
        user.lastMsg = {content:msgContent, timeStamp: Date.now()/1000};
        this.users[userName] = user;
    },
};

if(typeof(window) == "undefined")
{
    module.exports = {
        WORLD, Room, FACING_FRONT, User
    };
}