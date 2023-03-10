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

var door_positions = [
	[35, 0, -84],
	[-30, 0, -59],
	[-35, 0, -137],
	[-30, 0, 43],
	[-30, 0, -225],
	[-30, 0, -277],
	[-30, 0, -323],
	[57, 0, -400],
	[-30, 0, -400],
	[33, 0, -272]
];

var walkarea = null;

// On init, when i load the world from the json i should create all the scene nodes and store them somewhere,
// then render stuff on the draw function

var WORLD_3D = {
	current_room: null,
    my_user: null,
	scene: null,

	onWorldLoaded: function() 
	{
		this.current_room = WORLD.rooms[WORLD.default_room];
		//console.log("Current room is: " + JSON.stringify(this.current_room));
		this.init();
   	},

	addUser: function()
	{

	},

	init: function()
	{
		//create the rendering context
		var context = GL.create({width: window.innerWidth, height:window.innerHeight});

		//setup renderer
		renderer = new RD.Renderer(context);
		renderer.setDataFolder("data");
		renderer.autoload_assets = true;

		var div_wrap = document.getElementById('canvas-wrap');

		//attach canvas to DOM
		div_wrap.appendChild(renderer.canvas);

		//create a scene
		this.scene = new RD.Scene();

		//create camera
		camera = new RD.Camera();
		camera.perspective( 60, gl.canvas.width / gl.canvas.height, 0.1, 1000 );
		camera.lookAt([0,80,200],[0,20,0],[0,1,0]);
		//camera.position = [32.2999999, 175.3000793, 315]; // init camera position

		//global settings
		var bg_color = [0.1,0.1,0.1,1];
		//var avatar = "girl";
		var avatar = MYAPP.myAvatar;
		var avatar_scale = 0.3; 

		//create material for the character
		var mat = new RD.Material({
			textures: {
			color: avatar + "/" + avatar + ".png" }
			});
		mat.register(avatar);

		//create pivot point for the girl
		var girl_pivot = new RD.SceneNode({
			position: [-10,0,100] // init pos
		});

		//create a mesh for the girl
		var girl = new RD.SceneNode({
			scaling: avatar_scale,
			mesh: avatar + "/" + avatar + ".wbin",
			material: avatar
		});
		girl_pivot.addChild(girl);
		girl.skeleton = new RD.Skeleton();
		this.scene.root.addChild( girl_pivot );

		var girl_selector = new RD.SceneNode({
			position: [0, 20, 0],
			mesh: "cube",
			material: avatar,
			scaling: [8,20,8],
			name: "girl_selector",
			layers: 0b1000 // 4th layer
		});

		girl_pivot.addChild(girl_selector);

		walkarea = new WalkArea(); // with addShape I can add all the vertices

		walkarea.addRect([-30,0,-400], 65, 500); // you specify a corner and the height and witdh and it will crate the walkable area
		walkarea.addRect([-30,0,-400], 150, 85)

		character_pivot = girl_pivot;
		character_pivot.rotate(180*DEG2RAD,[0,1,0]);
		character = girl;
		//var material = new RD.Material({color: [1,0,1,1]});
		//material.register("violet");
		//var select_area = new RD.SceneNode({mesh: "cube", postion: [0,30,0], scaling: 10, material: "violet"});
		//select_area.layers
		//girl_pivot.addChild(select_area); // not working, shouyld move with the gitl

		//load some animations
		function loadAnimation( name, url )
		{
			var anim = animations[name] = new RD.SkeletalAnimation();
			anim.load(url);
			return anim;
		}
		loadAnimation("idle","data/" + avatar + "/idle.skanim");
		loadAnimation("walking","data/" + avatar + "/walking.skanim");
		//loadAnimation("dancing","data/" + avatar + "/dancing.skanim");
		//loadAnimation("running","data/" + avatar + "/running.skanim");
		//loadAnimation("waving","data/" + avatar + "/waving.skanim");

		// ------- ROOM PART -----------

		var room22 = new RD.SceneNode({
			name: "a",
			scaling: WORLD_3D.current_room.scaling,
		});
		room22.loadGLTF("data/abandoned_bar/scene.gltf");
		this.scene.root.addChild( room22 );

		// load a GLTF for the room
		var room = new RD.SceneNode({
			name: WORLD_3D.current_room.name,
			scaling: WORLD_3D.current_room.scaling,
		});
		room.loadGLTF(WORLD_3D.current_room.file3D);
		this.scene.root.addChild( room );
		
		//this.scene.root.removeChild(room);

		

	
		
		

		// ----------------- main loop ------------------------

		//main draw function
		context.ondraw = function() {
			gl.canvas.width = document.body.offsetWidth;
			gl.canvas.height = document.body.offsetHeight;
			gl.viewport(0,0,gl.canvas.width,gl.canvas.height);

			// By default we have a 3rd person
			var character_pos = character_pivot.localToGlobal([0,40,0]);

			var campos = character_pivot.localToGlobal([0,60,-70]);
			var camtarget = character_pivot.localToGlobal([0,10,70]);
			var smoothtarget = vec3.lerp(vec3.create(), camera.target, camtarget, 0.02);

			if (far_view == true) 
			{
				//camera.position = [32.2999999, 175.3000793, 315];
				campos = camera.position
				camtarget = character_pivot.localToGlobal([0,50,70]);
				smoothtarget = character_pos
			} 
			else if (first_person_view == true) 
			{
				campos = character_pivot.localToGlobal([0,50,0]);
				camtarget = character_pivot.localToGlobal([0,50 + pitch,70]);
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
				

			camera.perspective( 60, gl.canvas.width / gl.canvas.height, 0.1, 1000 );
			camera.lookAt(campos, smoothtarget, [0,1,0]);
			//clear
			renderer.clear(bg_color);

			//render scene
			renderer.render(WORLD_3D.scene, camera, null, 0b11 ); // render nodes on the first 2 layers, not on the rest, useful for capturing clicks on characte or objects
		
			// Render walkable area
			var vertices = walkarea.getVertices();
			renderer.renderPoints( vertices, null, camera, null,null,null,gl.LINES );
			//renderer.renderLines(vertices); // try and see if it works
		}

		//main update
		context.onupdate = function(dt)
		{
			//not necessary but just in case...
			WORLD_3D.scene.update(dt);

			var t = getTime();
			var anim = animations.idle;
			var time_factor = 1;

			//control with keys
			if(gl.keys["UP"])
			{
				character_pivot.moveLocal([0,0,1]);
				anim = animations.walking;
			}
			else if(gl.keys["DOWN"])
			{
				character_pivot.moveLocal([0,0,-1]);
				anim = animations.walking;
				time_factor = -1;
			}
			if(gl.keys["LEFT"])
				character_pivot.rotate(90*DEG2RAD*dt,[0,1,0]);
			else if(gl.keys["RIGHT"])
				character_pivot.rotate(-90*DEG2RAD*dt,[0,1,0]);

			var pos = character_pivot.position;
			var nearest_pos = walkarea.adjustPosition(pos); // adjusts pos inside walkable area defined above
			character_pivot.position = nearest_pos;

			var ret = WORLD_3D.isByDoor(character_pivot.position);
			if (ret == true) 
				MYAPP.showEnterRoom();
			else MYAPP.hideEnterRoom();


			// Setting walkable boundary manually 
			// var pos = character_pivot.position;
			// pos[0] = Math.clamp(pos[0], -50,-50);
			// character_pivot.position = pos;

			//move bones in the skeleton based on animation
			anim.assignTime( t * 0.001 * time_factor );
			//copy the skeleton in the animation to the character
			character.skeleton.copyFrom( anim.skeleton );
		}

		//user input ***********************

		// detect clicks
		context.onmouseup = function(e)
		{
			if(e.click_time < 200) //fast click
			{
				//compute collision with floor plane
				var ray = camera.getRay(e.canvasx, e.canvasy);
				var node = WORLD_3D.scene.testRay(ray, null, 10000, 0b1000); // layer 4 cause girl_selector is in layer 4
				if (node != null) console.log("You clicked the girl_selector: node is: ", node);
				//var coll = vec3.create();
				//scene.testRay(ray, coll, 1000, 0xFF, true);
				if( ray.testPlane( RD.ZERO, RD.UP ) ) //collision
				{
					console.log( "floor position clicked", ray.collision_point );
					//girl_pivot.position = ray.collision_point;
					character_pivot.orientTo(ray.collision_point, true, [0,1,0], false, true);
				}
			}
		}

		context.onmousemove = function(e)
		{
			if(e.dragging)
			{
				//orbit camera around
				//camera.orbit( e.deltax * -0.01, RD.UP );
				//camera.position = vec3.scaleAndAdd( camera.position, camera.position, RD.UP, e.deltay );
				

				if (first_person_view == true) 
				{
					pitch += e.deltay * -0.2;
					character_pivot.rotate(e.deltax * -0.003, [0,1,0]);
				} else {
					camera.move([-e.deltax*0.1, e.deltay*0.1,0]);
				}
				
			}
		}

		context.onmousewheel = function(e)
		{
			//move camera forward
			camera.moveLocal([0,0,e.wheel < 0 ? 10 : -10] );
		}

		//capture mouse events
		context.captureMouse(true);
		context.captureKeys();

		//launch loop
		context.animate();
	},

	changeRoom: function( current_room, new_room )
	{

		var current_room_node = WORLD_3D.scene.root.findNodeByName(current_room.name);
		WORLD_3D.scene.root.removeChild(current_room_node);

		var new_room_node = new RD.SceneNode({
			name: new_room.name,
			scaling: new_room.scaling,
		});
		new_room_node.loadGLTF(new_room.file3D);
		WORLD_3D.scene.root.addChild( new_room_node );
	},

	isByDoor: function( pos )
	{
		for (var i = 0; i < door_positions.length; i++)
		{
			if ((door_positions[i][0] - 3) <= Math.round(pos[0]) &&  Math.round(pos[0]) <= (door_positions[i][0] + 3) && (door_positions[i][2] - 3) <= Math.round(pos[2]) &&  Math.round(pos[2]) <= (door_positions[i][2] + 3) ) 
			{
				console.log("You are by door");
				return true;
			}
		}	
		return false;
	},

}
// function init()
// {
// 	//create the rendering context
// 	var context = GL.create({width: window.innerWidth, height:window.innerHeight});

// 	//setup renderer
// 	renderer = new RD.Renderer(context);
// 	renderer.setDataFolder("data");
// 	renderer.autoload_assets = true;

// 	var div_wrap = document.getElementById('canvas-wrap');

// 	//attach canvas to DOM
// 	div_wrap.appendChild(renderer.canvas);
// 	//document.body.appendChild(renderer.canvas);

// 	//create a scene
// 	scene = new RD.Scene();

// 	//create camera
// 	camera = new RD.Camera();
// 	camera.perspective( 60, gl.canvas.width / gl.canvas.height, 0.1, 1000 );
// 	camera.lookAt([0,80,200],[0,20,0],[0,1,0]);
// 	//camera.position = [32.2999999, 175.3000793, 315]; // init camera position

// 	//global settings
// 	var bg_color = [0.1,0.1,0.1,1];
// 	var avatar = "girl";
// 	var avatar_scale = 0.3; // scale for the girl

// 	//create material for the girl
// 	var mat = new RD.Material({
// 		textures: {
// 		 color: avatar + "/" + avatar + ".png" }
// 		});
// 	mat.register(avatar);

// 	//create pivot point for the girl
// 	var girl_pivot = new RD.SceneNode({
// 		position: [-10,0,100] // init pos
// 	});

// 	//create a mesh for the girl
// 	var girl = new RD.SceneNode({
// 		scaling: avatar_scale,
// 		mesh: avatar + "/" + avatar + ".wbin",
// 		material: avatar
// 	});
// 	girl_pivot.addChild(girl);
// 	girl.skeleton = new RD.Skeleton();
// 	scene.root.addChild( girl_pivot );

// 	var girl_selector = new RD.SceneNode({
// 		position: [0, 20, 0],
// 		mesh: "cube",
// 		material: "girl",
// 		scaling: [8,20,8],
// 		name: "girl_selector",
// 		layers: 0b1000 // 4th layer
// 	});

// 	girl_pivot.addChild(girl_selector);

// 	walkarea = new WalkArea(); // with addShape I can add all the vertices

// 	walkarea.addRect([-30,0,-400], 65, 500); // you specify a corner and the height and witdh and it will crate the walkable area
// 	walkarea.addRect([-30,0,-400], 150, 85)

// 	character_pivot = girl_pivot;
// 	character_pivot.rotate(180*DEG2RAD,[0,1,0]);
// 	character = girl;
// 	//var material = new RD.Material({color: [1,0,1,1]});
// 	//material.register("violet");
// 	//var select_area = new RD.SceneNode({mesh: "cube", postion: [0,30,0], scaling: 10, material: "violet"});
// 	//select_area.layers
// 	//girl_pivot.addChild(select_area); // not working, shouyld move with the gitl

// 	//load some animations
// 	function loadAnimation( name, url )
// 	{
// 		var anim = animations[name] = new RD.SkeletalAnimation();
// 		anim.load(url);
// 		return anim;
// 	}
// 	loadAnimation("idle","data/" + avatar + "/idle.skanim");
// 	loadAnimation("walking","data/" + avatar + "/walking.skanim");
// 	//loadAnimation("dancing","data/" + avatar + "/dancing.skanim");
// 	//loadAnimation("running","data/" + avatar + "/running.skanim");
// 	//loadAnimation("waving","data/" + avatar + "/waving.skanim");

// 	// ROOM PART 
// 	//load a GLTF for the room
// 	var room = new RD.SceneNode({
// 		scaling: 40,
// 	});
// 	room.loadGLTF("data/japanese_street_at_night/scene.gltf");
// 	scene.root.addChild( room );

// 	// main loop ***********************

// 	//main draw function
// 	context.ondraw = function(){
// 		gl.canvas.width = document.body.offsetWidth;
// 		gl.canvas.height = document.body.offsetHeight;
// 		gl.viewport(0,0,gl.canvas.width,gl.canvas.height);

// 		// By default we have a 3rd person
// 		var character_pos = character_pivot.localToGlobal([0,40,0]);

// 		var campos = character_pivot.localToGlobal([0,60,-70]);
// 		var camtarget = character_pivot.localToGlobal([0,10,70]);
// 		var smoothtarget = vec3.lerp(vec3.create(), camera.target, camtarget, 0.02);

// 		if (far_view == true) 
// 		{
// 			//camera.position = [32.2999999, 175.3000793, 315];
// 			campos = camera.position
// 			camtarget = character_pivot.localToGlobal([0,50,70]);
// 			smoothtarget = character_pos
// 		} 
// 		else if (first_person_view == true) 
// 		{
// 			campos = character_pivot.localToGlobal([0,50,0]);
// 			camtarget = character_pivot.localToGlobal([0,50 + pitch,70]);
// 			smoothtarget = camtarget; // disabling the smoothing for fpv
// 		} 

// 		// Systmem of cmaeras to switch based on distance
// 		// var campos = cameras[0];
// 		// var max_dist = 100000;

// 		// for(var i = 0; i < cameras.length; i++) 
// 		// {
// 		// 	var dist = vec3.distance(cameras[i], character_pos);
// 		// 	if (dist < max_dist)
// 		// 	{
// 		// 		max_dist = dist;
// 		// 		campos = cameras[i];
// 		// 	}
// 		// }
// 		//camera.lookAt(campos, character_pos, [0,1,0]);
			

// 		camera.perspective( 60, gl.canvas.width / gl.canvas.height, 0.1, 1000 );
// 		camera.lookAt(campos, smoothtarget, [0,1,0]);
// 		//clear
// 		renderer.clear(bg_color);
// 		//render scene
// 		renderer.render(scene, camera, null, 0b11 ); // render nodes on the first 2 layers, not on the rest, useful for capturing clicks on characte or objects
	
// 		// Render walkable area
// 		var vertices = walkarea.getVertices();
// 		renderer.renderPoints( vertices, null, camera, null,null,null,gl.LINES );
// 		//renderer.renderLines(vertices); // try and see if it works
// 	}

// 	//main update
// 	context.onupdate = function(dt)
// 	{
// 		//not necessary but just in case...
// 		scene.update(dt);

// 		var t = getTime();
// 		var anim = animations.idle;
// 		var time_factor = 1;

// 		//control with keys
// 		if(gl.keys["UP"])
// 		{
// 			character_pivot.moveLocal([0,0,1]);
// 			anim = animations.walking;
// 		}
// 		else if(gl.keys["DOWN"])
// 		{
// 			character_pivot.moveLocal([0,0,-1]);
// 			anim = animations.walking;
// 			time_factor = -1;
// 		}
// 		if(gl.keys["LEFT"])
// 			character_pivot.rotate(90*DEG2RAD*dt,[0,1,0]);
// 		else if(gl.keys["RIGHT"])
// 			character_pivot.rotate(-90*DEG2RAD*dt,[0,1,0]);

// 		var pos = character_pivot.position;
// 		var nearest_pos = walkarea.adjustPosition(pos); // adjusts pos inside walkable area defined above
// 		character_pivot.position = nearest_pos;

// 		var ret = isByDoor(character_pivot.position);
// 		if(ret == true) 
// 			MYAPP.showEnterRoom();
// 		else MYAPP.hideEnterRoom();


// 		// Setting walkable boundary manually 
// 		// var pos = character_pivot.position;
// 		// pos[0] = Math.clamp(pos[0], -50,-50);
// 		// character_pivot.position = pos;

// 		//move bones in the skeleton based on animation
// 		anim.assignTime( t * 0.001 * time_factor );
// 		//copy the skeleton in the animation to the character
// 		character.skeleton.copyFrom( anim.skeleton );
// 	}

// 	//user input ***********************

// 	// detect clicks
// 	context.onmouseup = function(e)
// 	{
// 		if(e.click_time < 200) //fast click
// 		{
// 			//compute collision with floor plane
// 			var ray = camera.getRay(e.canvasx, e.canvasy);
// 			var node = scene.testRay(ray, null, 10000, 0b1000); // layer 4 cause girl_selector is in layer 4
// 			if (node != null) console.log("You clicked the girl_selector: node is: ", node);
// 			//var coll = vec3.create();
// 			//scene.testRay(ray, coll, 1000, 0xFF, true);
// 			if( ray.testPlane( RD.ZERO, RD.UP ) ) //collision
// 			{
// 				console.log( "floor position clicked", ray.collision_point );
// 				//girl_pivot.position = ray.collision_point;
// 				character_pivot.orientTo(ray.collision_point, true, [0,1,0], false, true);
// 			}
// 		}
// 	}

// 	context.onmousemove = function(e)
// 	{
// 		if(e.dragging)
// 		{
// 			//orbit camera around
// 			//camera.orbit( e.deltax * -0.01, RD.UP );
// 			//camera.position = vec3.scaleAndAdd( camera.position, camera.position, RD.UP, e.deltay );
			

// 			if (first_person_view == true) 
// 			{
// 				pitch += e.deltay * -0.2;
// 				character_pivot.rotate(e.deltax * -0.003, [0,1,0]);
// 			} else {
// 				camera.move([-e.deltax*0.1, e.deltay*0.1,0]);
// 			}
			
// 		}
// 	}

// 	context.onmousewheel = function(e)
// 	{
// 		//move camera forward
// 		camera.moveLocal([0,0,e.wheel < 0 ? 10 : -10] );
// 	}

// 	//capture mouse events
// 	context.captureMouse(true);
// 	context.captureKeys();

// 	//launch loop
// 	context.animate();

// }


// function isByDoor(pos)
// {
// 	for (var i = 0; i < door_positions.length; i++)
// 	{
// 		if ((door_positions[i][0] - 3) <= Math.round(pos[0]) &&  Math.round(pos[0]) <= (door_positions[i][0] + 3) && (door_positions[i][2] - 3) <= Math.round(pos[2]) &&  Math.round(pos[2]) <= (door_positions[i][2] + 3) ) 
// 		{
// 			console.log("You are by door");
// 			return true;
// 		}
// 	}	
// 	return false;
// }

// /* example of computing movement vector
// 	var delta = vec3.sub( vec3.create(), target, sprite.position );
// 	vec3.normalize(delta,delta);
// 	vec3.scaleAndAdd( sprite.position, sprite.position, delta, dt * 50 );
// 	sprite.updateMatrices();
// 	sprite.flags.flipX = delta[0] < 0;
// */

// // when you get the message syou have to go to the node an dupdate the postion of the users

// // To search nodes in the scene:
// // scene.root.findNodeByName("girl_selector") and returns a SceneNode object
// // Also you have to set the paramnter name when you create the Scene Node