//var scene = null;
var renderer = null;
var camera = null;
var character = null;

var animations = {};
var animation = null;

var pitch = 0;

var first_person_view = false;
var far_view = false;

var cameras = [ // different camera positions
	[0, 40, 100],
	[100, 40, 100]
];

var WORLD_3D = {
	context: null,
	renderer: null,
	current_room: null,
	camera: null,
    my_user: null,
	scene: null,
	current_room_walkarea: null,
	current_anim: null,
	my_character_pivot: null,
	my_character: null,
	bg_color: null,

	onWorldLoaded: function() 
	{
		//create the rendering context
		WORLD_3D.context = GL.create({width: window.innerWidth, height:window.innerHeight});

		//setup renderer
		WORLD_3D.renderer = new RD.Renderer(WORLD_3D.context);
		WORLD_3D.renderer.setDataFolder("data");
		WORLD_3D.renderer.autoload_assets = true;

		var div_wrap = document.getElementById('canvas-wrap');

		//attach canvas to DOM
		div_wrap.appendChild(WORLD_3D.renderer.canvas);

		//create a scene
		this.scene = new RD.Scene();

		//create camera
		WORLD_3D.camera = new RD.Camera();
		WORLD_3D.camera.perspective( 60, gl.canvas.width / gl.canvas.height, 0.1, 1000 );
		WORLD_3D.camera.lookAt([0,80,200],[0,20,0],[0,1,0]);
		//camera.position = [32.2999999, 175.3000793, 315]; // init camera position

		//global settings
		WORLD_3D.bg_color = [0.1,0.1,0.1,1];

		WORLD_3D.loadAnimation("idle", "james", "data/james/idle.skanim");
		WORLD_3D.loadAnimation("walking", "james", "data/james/walking.skanim");
		WORLD_3D.loadAnimation("dancing", "james", "data/james/dancing.skanim");
		WORLD_3D.loadAnimation("waving", "james", "data/james/waving.skanim");

		WORLD_3D.loadAnimation("idle", "bryce", "data/bryce/idle.skanim");
		WORLD_3D.loadAnimation("walking", "bryce", "data/bryce/walking.skanim");
		WORLD_3D.loadAnimation("dancing", "bryce", "data/bryce/dancing.skanim");
		WORLD_3D.loadAnimation("waving", "bryce", "data/bryce/waving.skanim");

		WORLD_3D.loadAnimation("idle", "girl", "data/girl/idle.skanim");
		WORLD_3D.loadAnimation("walking", "girl", "data/girl/walking.skanim");
		WORLD_3D.loadAnimation("dancing", "girl", "data/girl/dancing.skanim");
		WORLD_3D.loadAnimation("waving", "girl", "data/girl/waving.skanim");

		WORLD_3D.loadAnimation("idle", "yellow-girl", "data/yellow-girl/idle.skanim");
		WORLD_3D.loadAnimation("walking", "yellow-girl", "data/yellow-girl/walking.skanim");
		WORLD_3D.loadAnimation("dancing", "yellow-girl", "data/yellow-girl/dancing.skanim");
		WORLD_3D.loadAnimation("waving", "yellow-girl", "data/yellow-girl/waving.skanim");


		//console.log("Current room is: " + JSON.stringify(this.current_room));
		WORLD_3D.addUserNode(true, MYAPP.my_user_obj);
		this.init();
   	},

	loadAnimation:  function ( name, avatar, url )
	{
		var anim = animations[name + "_" + avatar] = new RD.SkeletalAnimation();
		anim.load(url);
		return anim;
	},

	init: function()
	{
		//create the rendering context
		// var context = GL.create({width: window.innerWidth, height:window.innerHeight});

		// //setup renderer
		// renderer = new RD.Renderer(context);
		// renderer.setDataFolder("data");
		// renderer.autoload_assets = true;

		// var div_wrap = document.getElementById('canvas-wrap');

		// //attach canvas to DOM
		// div_wrap.appendChild(renderer.canvas);

		// //create a scene
		// this.scene = new RD.Scene();

		// //create camera
		// camera = new RD.Camera();
		// camera.perspective( 60, gl.canvas.width / gl.canvas.height, 0.1, 1000 );
		// camera.lookAt([0,80,200],[0,20,0],[0,1,0]);
		// //camera.position = [32.2999999, 175.3000793, 315]; // init camera position

		// //global settings
		// var bg_color = [0.1,0.1,0.1,1];
		//var avatar = "girl";
		var avatar = MYAPP.myAvatar;
		// // var avatar_scale = 0.3; 
		// var avatar2 = "james";

		// //create material for the character
		// var mat = new RD.Material({
		// 	textures: {
		// 	color: avatar2 + "/" + avatar2 + ".png" }
		// 	});
		// mat.register(avatar2);

		// //create pivot point for the girl
		// var girl_pivot = new RD.SceneNode({
		// 	position: [-10,0,100] // init pos
		// });

		//create a mesh for the girl
		// var girl = new RD.SceneNode({
		// 	scaling: 0.3,
		// 	mesh: avatar2 + "/" + avatar2 + ".wbin",
		// 	material: avatar2
		// });
		// girl_pivot.addChild(girl);
		// girl.skeleton = new RD.Skeleton();
		// this.scene.root.addChild( girl_pivot );

		// var girl_selector = new RD.SceneNode({
		// 	position: [0, 20, 0],
		// 	mesh: "cube",
		// 	material: avatar,
		// 	scaling: [8,20,8],
		// 	name: "girl_selector",
		// 	layers: 0b1000 // 4th layer
		// });

		// girl_pivot.addChild(girl_selector);

		this.setWalkArea();
		

		//character_pivot = girl_pivot;
		//character_pivot.rotate(180*DEG2RAD,[0,1,0]);
		//character = girl;
		//var material = new RD.Material({color: [1,0,1,1]});
		//material.register("violet");
		//var select_area = new RD.SceneNode({mesh: "cube", postion: [0,30,0], scaling: 10, material: "violet"});
		//select_area.layers
		//girl_pivot.addChild(select_area); // not working, shouyld move with the gitl

		//load some animations
		// function loadAnimation( name, url )
		// {
		// 	var anim = animations[name] = new RD.SkeletalAnimation();
		// 	anim.load(url);
		// 	return anim;
		// }
		// loadAnimation("idle","data/" + avatar2 + "/idle.skanim");
		// loadAnimation("walking","data/" + avatar2 + "/walking.skanim");
		// loadAnimation("dancing","data/" + avatar2 + "/dancing.skanim");
		// //loadAnimation("running","data/" + avatar + "/running.skanim");
		// loadAnimation("waving","data/" + avatar2 + "/waving.skanim");
		//this.current_anim = animations.idle;

		// ------- ROOM PART -----------

		//room22.loadGLTF("data/white_modern_living_room.glb"); scalng 40
		//room22.loadGLTF("data/american_diner/scene.gltf"); scaling 1000
		//room22.loadGLTF("data/american_diner2/scene.gltf"); scaing 1000
		//room22.loadGLTF("data/american_diner3/scene.gltf");  scaling 16
		//room22.loadGLTF("data/american_diner4/scene.gltf");  scaling 20
		
	
		// load a GLTF for the room
		var room = new RD.SceneNode({
			name: WORLD_3D.current_room.name,
			scaling: WORLD_3D.current_room.scaling,
		});
		room.loadGLTF(WORLD_3D.current_room.file3D);
		this.scene.root.addChild( room );

		if (WORLD_3D.current_room.name == "living_room") WORLD_3D.createSubCanvasVideo();
		if (WORLD_3D.current_room.name == "conference") {
			WORLD_3D.createSubCanvasVideoWebCam('video_webcam', "subcanvas_webcam", [-40,45,-175]);
			WORLD_3D.createSubCanvasVideoWebCam('video_webcam_other', "subcanvas_webcam_other", [40,45,-175]);
		}

		// ----------------- main loop ------------------------

		//main draw function
		WORLD_3D.context.ondraw = function() {
			gl.canvas.width = document.body.offsetWidth;
			gl.canvas.height = document.body.offsetHeight;
			gl.viewport(0,0,gl.canvas.width,gl.canvas.height);

			// By default we have a 3rd person
			var character_pos = WORLD_3D.my_character_pivot.localToGlobal([0,40,0]);

			var campos = WORLD_3D.my_character_pivot.localToGlobal([0,60,-70]);
			var camtarget = WORLD_3D.my_character_pivot.localToGlobal([0,10,70]);
			var smoothtarget = vec3.lerp(vec3.create(), WORLD_3D.camera.target, camtarget, 0.02);

			if (far_view == true) 
			{
				//camera.position = [32.2999999, 175.3000793, 315];
				campos = WORLD_3D.camera.position
				camtarget = WORLD_3D.my_character_pivot.localToGlobal([0,50,70]);
				smoothtarget = character_pos
			} 
			else if (first_person_view == true) 
			{
				campos = WORLD_3D.my_character_pivot.localToGlobal([0,50,0]);
				camtarget = WORLD_3D.my_character_pivot.localToGlobal([0,50 + pitch,70]);
				smoothtarget = camtarget; // disabling the smoothing for fpv
			} 

			// Systmem of cmaeras to switch based on distance
			// var campos = cameras[0];
			// var max_dist = 100000;

			// for(var i = 0; i < cameras.length; i++) 
			// {
			// 	var dist = vec3.distance(cameras[i], character_pos);
			// 	if (dist < max_dist)
			// 	{
			// 		max_dist = dist;
			// 		campos = cameras[i];
			// 	}
			// }
			//camera.lookAt(campos, character_pos, [0,1,0]);
				

			WORLD_3D.camera.perspective( 60, gl.canvas.width / gl.canvas.height, 0.1, 1000 );
			WORLD_3D.camera.lookAt(campos, smoothtarget, [0,1,0]);
			//clear
			WORLD_3D.renderer.clear(WORLD_3D.bg_color);

			//render scene
			WORLD_3D.renderer.render(WORLD_3D.scene, WORLD_3D.camera, null, 0b11 ); // render nodes on the first 2 layers, not on the rest, useful for capturing clicks on characte or objects
		
			// Render walkable area
			var vertices = WORLD_3D.current_room_walkarea.getVertices();
			//WORLD_3D.renderer.renderPoints( vertices, null, WORLD_3D.camera, null,null,null,gl.LINES );
			//renderer.renderLines(vertices); // try and see if it works
		}

		//main update
		WORLD_3D.context.onupdate = function(dt)
		{
			//not necessary but just in case...
			WORLD_3D.scene.update(dt);

			var t = getTime();
			//var anim = animations.idle;
			var anim = animations[WORLD_3D.current_anim];
			var time_factor = 1;

			var anim_name = WORLD_3D.current_anim;

			//control with keys
			if(gl.keys["UP"])
			{
				WORLD_3D.my_character_pivot.moveLocal([0,0,1]);
				anim_name = "walking" + "_" + MYAPP.myAvatar;
				anim = animations[anim_name];
			}
			else if(gl.keys["DOWN"])
			{
				WORLD_3D.my_character_pivot.moveLocal([0,0,-1]);
				anim_name = "walking" + "_" + MYAPP.myAvatar;
				anim = animations[anim_name];
				time_factor = -1;
			}
			if(gl.keys["LEFT"])
				WORLD_3D.my_character_pivot.rotate(90*DEG2RAD*dt,[0,1,0]);
			else if(gl.keys["RIGHT"])
				WORLD_3D.my_character_pivot.rotate(-90*DEG2RAD*dt,[0,1,0]);

			var pos = WORLD_3D.my_character_pivot.position;
			var nearest_pos = WORLD_3D.current_room_walkarea.adjustPosition(pos); // adjusts pos inside walkable area defined above
			WORLD_3D.my_character_pivot.position = nearest_pos;

			var ret = WORLD_3D.isByDoor(WORLD_3D.my_character_pivot.position);
			if (ret[0] == true) 
				MYAPP.showEnterRoom(ret[1]);
			else MYAPP.hideEnterRoom();

			var ret2 = WORLD_3D.isByItem(WORLD_3D.my_character_pivot.position);
			if(ret2[0] == true)
				MYAPP.showItemInteraction(ret2[1]);
			else MYAPP.hideItemInteraction();


			// Setting walkable boundary manually 
			// var pos = character_pivot.position;
			// pos[0] = Math.clamp(pos[0], -50,-50);
			// character_pivot.position = pos;

			//move bones in the skeleton based on animation
			anim.assignTime( t * 0.001 * time_factor );
			//copy the skeleton in the animation to the character
			WORLD_3D.my_character.skeleton.copyFrom( anim.skeleton );

			WORLD.getUserById(MYAPP.myUserID).rotation = WORLD_3D.my_character_pivot.rotation;
			WORLD.getUserById(MYAPP.myUserID).position = WORLD_3D.my_character_pivot.position;
			WORLD.getUserById(MYAPP.myUserID).current_anim = anim_name;

			var msg = {pos:  WORLD_3D.my_character_pivot.position, rot:  WORLD_3D.my_character_pivot.rotation, anim: anim_name, type:"UPDATE_STATE"};
			if (MYCLIENT.on_connect != null) MYCLIENT.sendMessage(JSON.stringify(msg));

			for (var i = 0; i < WORLD.rooms[WORLD_3D.current_room.name].people.length; i ++) {
				
				var userID = WORLD.rooms[WORLD_3D.current_room.name].people[i];
				if (userID != MYAPP.myUserID) {
					var u = WORLD.getUserById(userID);
					var n = WORLD_3D.scene.root.findNodeByName(u.name + "_char_node");
					if (n == null) continue; 
					if (u.current_anim == null) continue;
					if (animations[u.current_anim] == null || animations[u.current_anim] === undefined) continue;


					animations[u.current_anim].assignTime( t * 0.001 * time_factor );
					n.skeleton.copyFrom(animations[u.current_anim].skeleton);

					WORLD_3D.scene.root.findNodeByName(u.name).position = u.position;
					WORLD_3D.scene.root.findNodeByName(u.name).rotation = u.rotation;
				}
			}


			
		}

		//user input ***********************

		// detect clicks
		WORLD_3D.context.onmouseup = function(e)
		{
			if(e.click_time < 200) //fast click
			{
				//compute collision with floor plane
				var ray = WORLD_3D.camera.getRay(e.canvasx, e.canvasy);
				var node = WORLD_3D.scene.testRay(ray, null, 10000, 0b1000); // layer 4 cause girl_selector is in layer 4
				if (node != null) MYAPP.interactUser(node);
				//var coll = vec3.create();
				//scene.testRay(ray, coll, 1000, 0xFF, true);
				if( ray.testPlane( RD.ZERO, RD.UP ) ) //collision
				{
					//console.log( "floor position clicked", ray.collision_point );
					//girl_pivot.position = ray.collision_point;
					//WORLD_3D.my_character_pivot.orientTo(ray.collision_point, true, [0,1,0], false, true);
				}
			}
		}

		WORLD_3D.context.onmousemove = function(e)
		{
			if(e.dragging)
			{
				//orbit camera around
				//camera.orbit( e.deltax * -0.01, RD.UP );
				//camera.position = vec3.scaleAndAdd( camera.position, camera.position, RD.UP, e.deltay );
				

				if (first_person_view == true) 
				{
					pitch += e.deltay * -0.2;
					WORLD_3D.my_character_pivot.rotate(e.deltax * -0.003, [0,1,0]);
				} else {
					WORLD_3D.camera.move([-e.deltax*0.1, e.deltay*0.1,0]);
				}
				
			}
		}

		WORLD_3D.context.onmousewheel = function(e)
		{
			//move camera forward
			WORLD_3D.camera.moveLocal([0,0,e.wheel < 0 ? 10 : -10] );
		}

		//capture mouse events
		WORLD_3D.context.captureMouse(true);
		WORLD_3D.context.captureKeys();

		//launch loop
		WORLD_3D.context.animate();
	},

	removeUserNode: function(user_obj) 
	{
		
		var user_node = WORLD_3D.scene.root.findNodeByName(user_obj.name);
		WORLD_3D.scene.root.removeChild(user_node);
	
	},

	addUserNode: function(is_mine, user_obj)
	{
		
		var avatar = user_obj.avatar;

		//c reate material for the character
		var mat = new RD.Material({
			textures: {
			color: avatar + "/" + avatar + ".png" }
			});
		mat.register(avatar);

		//create pivot point for the character
		var char_pivot = new RD.SceneNode({
			name: user_obj.name,
			position: user_obj.position // init pos 
		});

		//create a mesh for the character
		var char = new RD.SceneNode({
			name: user_obj.name + "_char_node",
			scaling: user_obj.avatar_scale,
			mesh: avatar + "/" + avatar + ".wbin",
			material: avatar
		});
		char.skeleton = new RD.Skeleton();
		char_pivot.addChild(char);
		
		this.scene.root.addChild( char_pivot );

		char_pivot.rotate(180*DEG2RAD,[0,1,0]);

		if (is_mine === true) {
			WORLD_3D.my_character_pivot = char_pivot;
			WORLD_3D.my_character = char;
			WORLD_3D.current_anim = "idle" + "_" + avatar;
		}

		var char_selector = new RD.SceneNode({
			position: [0, 20, 0],
			mesh: "cube",
			material: avatar,
			scaling: [8,40,8],
			name: user_obj.name + "_selector",
			layers: 0b1000 // 4th layer
		});

		char_pivot.addChild(char_selector);

		
		console.log("Added node to world 3d on pos: " + user_obj.position + " , with avatar: " + user_obj.avatar);
	},

	changeRoom: function( current_room, new_room ) // new_room and current_room must be Room objects
	{

		for(var i = 0; i < WORLD.rooms[current_room.name].people.length; i++) {
			var user_id = WORLD.rooms[current_room.name].people[i];
			if (user_id == MYAPP.myUserID) continue;
			WORLD_3D.removeUserNode(WORLD.getUserById(user_id));
		}

		if (current_room.name == "living_room") {
			var n = WORLD_3D.scene.root.findNodeByName("subcanvas");
			WORLD_3D.scene.root.removeChild(n);
		}
		if (current_room.name == "conference") {
			var n = WORLD_3D.scene.root.findNodeByName("subcanvas_webcam");
			WORLD_3D.scene.root.removeChild(n);

			//var n2 = WORLD_3D.scene.root.findNodeByName("subcanvas_webcam_other");
			//WORLD_3D.scene.root.removeChild(n2);
		}

		var current_room_node = WORLD_3D.scene.root.findNodeByName(current_room.name);
		WORLD_3D.scene.root.removeChild(current_room_node);

		var new_room_node = new RD.SceneNode({
			name: new_room.name,
			scaling: new_room.scaling,
		});
		new_room_node.loadGLTF(new_room.file3D);
		WORLD_3D.scene.root.addChild( new_room_node );
		WORLD_3D.current_room = new_room;
		WORLD_3D.setWalkArea();

		for (var j = 0; j < new_room.door_positions.length; j++) {
			if (new_room.door_positions[i].target == current_room.name) {
				WORLD_3D.my_character_pivot.position = new_room.door_positions[i].position;
				break;
			}
		}

		if (new_room.name == "living_room")
		{
			WORLD_3D.createSubCanvasVideo();
		}
		if (new_room.name == "conference")
		{
			WORLD_3D.createSubCanvasVideoWebCam('video_webcam', "subcanvas_webcam",[-40,45,-175]);
			WORLD_3D.createSubCanvasVideoWebCam('video_webcam_other', "subcanvas_webcam_other",[40,45,-175]);
		}
	},

	isByDoor: function( pos )
	{
		var door_positions = WORLD_3D.current_room.door_positions;
		for (var i = 0; i < door_positions.length; i++)
		{
			// if ((door_positions[i][0] - 3) <= Math.round(pos[0]) &&  Math.round(pos[0]) <= (door_positions[i][0] + 3) && (door_positions[i][2] - 3) <= Math.round(pos[2]) &&  Math.round(pos[2]) <= (door_positions[i][2] + 3) ) 
			// {
			// 	console.log("You are by door");
			// 	return true;
			// }
			if ((door_positions[i].position[0] - 20) <= Math.round(pos[0]) &&  Math.round(pos[0]) <= (door_positions[i].position[0] + 20) && (door_positions[i].position[2] - 20) <= Math.round(pos[2]) &&  Math.round(pos[2]) <= (door_positions[i].position[2] + 20) ) 
			{
				//console.log("You are by door");
				return [true, door_positions[i].target];
			}
		}	
		return [false, null];
	},

	isByItem: function( pos )
	{
		var items = WORLD_3D.current_room.items;
		for(var i = 0; i < items.length; i ++)
		{
			if ((items[i].position[0] - 20) <= Math.round(pos[0]) &&  Math.round(pos[0]) <= (items[i].position[0] + 20) && (items[i].position[2] - 20) <= Math.round(pos[2]) &&  Math.round(pos[2]) <= (items[i].position[2] + 20) ) 
			{
				//console.log("You are by door");
				return [true, items[i].name];
			}
		}
		return [false, null];
	},

	setWalkArea: function() // Every time is called, the walkarea is set of the current room, meant to be called after changing rooms
	{

		this.current_room_walkarea = new WalkArea(); // with addShape I can add all the vertices
		for(var i = 0; i < WORLD_3D.current_room.walkarea.length; i ++)
		{
			var coords = WORLD_3D.current_room.walkarea[i];
			this.current_room_walkarea.addRect(coords.init_pos, coords.height, coords.width);
		}
	},
	createSubCanvasVideoWebCam: function(videoID, name, postion_canvas)
	{
		//create an offscreen canvas where we will draw
        var subcanvas = document.createElement("canvas");
        subcanvas.width = 1800;
        subcanvas.height = 1200;
        var subctx = subcanvas.getContext("2d");
        subctx.fillStyle = "white";
        subctx.fillRect(0,0,subcanvas.width,subcanvas.height);
        subctx.clearRect(2,2,subcanvas.width-4,subcanvas.height-4);

		//create a texture to upload the offscreen canvas 
        var texture = GL.Texture.fromImage(subcanvas, { wrap: gl.CLAMP_TO_EDGE });
        gl.textures[name] = texture; //give it a name

		//create a node
		var panel = new RD.SceneNode({
			name: name,
			mesh:"plane",
			scale:[80,42,4],
			position: postion_canvas,//[-40,45,-175],
			flags:{two_sided:true}
		});
		panel.texture = name; //assign canvas texture to node
		this.scene.root.addChild(panel);

		var video = document.getElementById(videoID);

		video.addEventListener('play', function() {
			var $this = this; //cache
			(function loop() {
			  if (!$this.paused && !$this.ended) {
				subctx.drawImage($this, 0, 0, 1800, 1200);
				setTimeout(loop, 1000 / 30); // drawing at 30fps
				texture.uploadImage(subcanvas);
			  }
			})();
		  }, 0);
	},

	createSubCanvasVideo: function()
	{
		//create an offscreen canvas where we will draw
        var subcanvas = document.createElement("canvas");
        subcanvas.width = 1800;
        subcanvas.height = 1000;
        var subctx = subcanvas.getContext("2d");
        subctx.fillStyle = "white";
        subctx.fillRect(0,0,subcanvas.width,subcanvas.height);
        subctx.clearRect(2,2,subcanvas.width-4,subcanvas.height-4);

		//create a texture to upload the offscreen canvas 
        var texture = GL.Texture.fromImage(subcanvas, { wrap: gl.CLAMP_TO_EDGE });
        gl.textures[":canvas"] = texture; //give it a name

		//create a node
		var panel = new RD.SceneNode({
			name: "subcanvas",
			mesh:"plane",
			scale:[80,42,4],
			position: [18,55,-97],
			flags:{two_sided:true}
		});
		panel.texture = ":canvas"; //assign canvas texture to node
		this.scene.root.addChild(panel);

		var video = document.getElementById('video');

		video.addEventListener('play', function() {
			var $this = this; //cache
			(function loop() {
			  if (!$this.paused && !$this.ended) {
				subctx.drawImage($this, 0, 0, 2000, 1000);
				setTimeout(loop, 1000 / 30); // drawing at 30fps
				texture.uploadImage(subcanvas);
			  }
			})();
		  }, 0);
	},

}
