var WebSocketServer = require('websocket').server;

//var WebSocket = require('../node_modules/ws');
//var WebSocketServer = WebSocket.Server;
var DATABASE_MANAGER = require('./credentials.js').DATABASE_MANAGER;

var MYSERVER = require('./myserver.js').MYSERVER;
var queryString = require('querystring'),
            url	= require('url'),
            http = require('http'),
            express = require('express');


const app = express();

// Init http server
const serverH = http.createServer(app);
// Init websocket instance
const wss = new WebSocketServer({ httpServer: serverH });

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

wss.on('request', function(request) {
    var connection = request.accept(null, request.origin);
    var ws = connection;
    console.log("NEW WEBSOCKET USER!!!");

   
    console.log("resource url queri: " + JSON.stringify(request.resourceURL.query));
    MYSERVER.onUserConnect(connection, request.resourceURL);

    connection.on('message', function( msg ) {
        // if(!isJson(msg)) {
        //     console.log("Error, can only deal with JSON messages, ignoring...");
        //     return;
        // }
        if (msg.type === 'utf8') {
            MYSERVER.onUserMessage(ws, msg.utf8Data);
        } else {
            console.log("Not utf 8 message");
        }
    });

    connection.on('close', function() {
        MYSERVER.onUserDisconnect(ws);
    });

    connection.on('error', function( event ) {
        MYSERVER.onUserDisconnect(ws, event);
    });

});


// wss.on('connection', function (ws, req) {
//     MYSERVER.onUserConnect(ws, req);

//     ws.on('message', function( msg ) {
//         if(!isJson(msg)) {
//             console.log("Error, can only deal with JSON messages, ignoring...");
//             return;
//         }
//         MYSERVER.onUserMessage(ws, msg);
//     });

//     ws.on('close', function() {
//         MYSERVER.onUserDisconnect(ws);
//     });

//     ws.on('error', function( event ) {
//         MYSERVER.onUserDisconnect(ws, event);
//     });
    
// });

wss.onclose = (event) => {
    DATABASE_MANAGER.disconnect();
    console.log('The connection has been closed successfully.');
};


// to handle static files, redirect to public folder
app.use(express.static('../public'));

serverH.listen( 9018 , function() {
    MYSERVER.init();
    MYSERVER.onReady();
    // Connect to DB 
    DATABASE_MANAGER.init();
    console.log("[Server] VirtualServer listening!");
});