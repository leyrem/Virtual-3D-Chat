const crypto = require('crypto');
var REDIS_CLIENT = require('./redis/red.js').REDIS_CLIENT;


var DATABASE_MANAGER = {

    init: async function()
    {
        await REDIS_CLIENT.connect(); // Connecting to redis db locally
    },

    disconnect: async function()
    {
        await REDIS_CLIENT.quit(); // Quitting connection to database
    },

    hash_password: function( passwd )
    {
        if (!passwd) return;
        var hash = null;
        if( passwd.constructor === String )
            hash = crypto.createHash('md5').update(passwd).digest("hex");
        else 
            throw("Cannot hash a password that is not a string");

        return hash;
    },

    is_valid_passwd: async function( user_name, passwd )
    {
        // Comparing the hash of the password passed with the hash of the password stored for that user
        var hashed = crypto.createHash('md5').update(passwd).digest("hex");
        var pass_user = await REDIS_CLIENT.get_value_from_key("users:" + user_name);
        return hashed == pass_user;
    },

    set_user_password: async function( user_name, passwd )
    {
        var hashed_pss = this.hash_password(passwd);
        await REDIS_CLIENT.set_key_value("users:" + user_name, hashed_pss);
    },

    check_user_in_db: async function(user_name)
    {
        var ret = await REDIS_CLIENT.get_value_from_key("users:" + user_name);
        if (ret == null) return false;
        else return true;
    },

    login: async function( user_name, passwd )
    {
        var ret = await REDIS_CLIENT.get_value_from_key("users:" + user_name);
        if (ret == null) {
            console.log(`[DB MANAGER] User ${user_name} not in DB, adding it`);
            this.set_user_password(user_name, passwd);
            return true;
        }
        console.log(`[DB MANAGER] User ${user_name} in already in DB, checking password`);
        var isOk = this.is_valid_passwd(user_name, passwd);
        console.log(`[DB MANAGER] User ${user_name} password provided is ${isOk ? "correct" : "incorrect"}`)
        return isOk;
    },

    save_user_position: async function( user_name, position )
    {
        if(user_name == null)
            throw("Cannot save position of user because user_name is null");
        if(position == null)
            throw("Cannot save position of user because position is null");

        await REDIS_CLIENT.set_key_value("users:" + user_name + ":position", position);
    },

    get_user_position: async function( user_name )
    {
        if(user_name == null)
            throw("Cannot save position of user because user_name is null");
            
        return await REDIS_CLIENT.get_value_from_key("users:" + user_name + ":position");
    },

    save_user_avatar: async function(user_name, avatar)
    {
        if (user_name == null)
            throw("Cannot save position of user because user_name is null");
        if (avatar == null)
            throw("Cannot save position of user because position is null");

        await REDIS_CLIENT.set_key_value("users:" + user_name + ":avatar", avatar);
    },

    get_user_avatar: async function(user_name)
    {
        if (user_name == null)
            throw("Cannot save position of user because user_name is null");
            
        return await REDIS_CLIENT.get_value_from_key("users:" + user_name + ":avatar");
    },

    save_user_room: async function(user_name, room_name)
    {
        if (user_name == null)
            throw("Cannot save position of user because user_name is null");
        if (room_name == null)
            throw("Cannot save position of user because position is null");

        await REDIS_CLIENT.set_key_value("users:" + user_name + ":room_name", room_name);
    },

    get_user_room: async function(user_name)
    {
        if (user_name == null)
            throw("Cannot save room of user because user_name is null");
            
        return await REDIS_CLIENT.get_value_from_key("users:" + user_name + ":room_name");
    },

    save_session_token: async function(user_name, token)
    {
        if (user_name == null)
            throw("Cannot save token of user because user_name is null");
        if (token == null)
            throw("Cannot save token of user because token is null");

        await REDIS_CLIENT.set_key_value("users:" + token + ":session_token", user_name);
    },

    get_session_token_info: async function(token)
    {
        if (token == null)
            throw("Cannot save position of user because user_name is null");
            
        return await REDIS_CLIENT.get_value_from_key("users:" + token + ":session_token");
    },

    

}

module.exports = { DATABASE_MANAGER };