var my_stream = null;
var my_PeerID = 0;





//create peer instance
var peer = new Peer();
//fetch user ID from server
peer.on('open', function(id) {
    
    my_PeerID = id;
    console.log('My peer ID is: ' + id);
    
    
    //this id must be sent somehow to other user
});

peer.on('connection', function(conn) {
    conn.on('data', function(data){
        console.log(data); //this will receive "Hello!"
        
    });
});



// var General_audio = document.querySelector("audio");
// General_audio.volume = 100;

function startPeerAudio(){
    //request access
    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function (stream) {
                //assign stream to audio element
                
                my_stream = stream;

                var newAudio = document.createElement("audio");
                newAudio.id = "my_audio";
                newAudio.srcObject = stream;
                newAudio.volume = 0;
                var audioDiv = document.getElementById("my_audio_inputs");
                audioDiv.appendChild(newAudio);
        
                
            })
            .catch( function (error) {
                //if the users doesnt allow access to webcam
                console.log("Something went wrong!");
                console.log(error);
            });
        }

        
}

peer.on('error', function(err) { 
    console.log("There was an error on the peer connection: "+err); 
 })
//incomming calls
peer.on('call', function(call) {
        // Answer the call
    call.answer( my_stream ); 
    call.on('stream', function(remoteStream) {
        num_calls++;
        var newAudio = document.createElement("audio");
        newAudio.id = "Call n"+num_calls;
        newAudio.srcObject = remoteStream;
        newAudio.volume = 1;
        var audioDiv = document.getElementById("my_audio_inputs");
        audioDiv.appendChild(newAudio);
        

        console.log("Playing audio call number "+num_calls);
        newAudio.play();

    });
});

function callRemoteUser( stream, target_peerID )
{
    //call remote user and send him my stream
    var call = peer.call( target_peerID, my_stream );

    //in case he answer my call, show his video
    call.on('stream', function( remoteStream ) {
        num_calls++;
        var newAudio = document.createElement("audio");
        newAudio.id = "Call n"+num_calls;
        newAudio.srcObject = remoteStream;
        newAudio.volume = 1;
        var audioDiv = document.getElementById("my_audio_inputs");
        audioDiv.appendChild(newAudio);

        console.log("Playing audio call number "+num_calls);
        newAudio.play();
    });
}

var num_calls = 0;
