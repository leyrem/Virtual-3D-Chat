var scene = null;
var renderer = null;
var camera = null;
var character = null;

var animations = {};
var animation = null;

function init()
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
	//document.body.appendChild(renderer.canvas);

	//create a scene
	scene = new RD.Scene();

	//create camera
	camera = new RD.Camera();
	camera.perspective( 60, gl.canvas.width / gl.canvas.height, 0.1, 1000 );
	camera.lookAt([0,80,200],[0,20,0],[0,1,0] );
	//camera.position = [32.2999999, 175.3000793, 315]; // init camera position

	//global settings
	var bg_color = [0.1,0.1,0.1,1];

	//create material for the girl
	var mat = new RD.Material({
		textures: {
		 color: "girl/girl.png" }
		});
	mat.register("girl");

	//create pivot point for the girl
	var girl_pivot = new RD.SceneNode({
		position: [-40,0,0]
	});

	//create a mesh for the girl
	var girl = new RD.SceneNode({
		scaling: 0.3,
		mesh: "girl/girl.wbin",
		material: "girl"
	});
	girl_pivot.addChild(girl);
	girl.skeleton = new RD.Skeleton();
	scene.root.addChild( girl_pivot );

	character_pivot = girl_pivot;
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
	loadAnimation("idle","data/girl/idle.skanim");
	loadAnimation("walking","data/girl/walking.skanim");
	loadAnimation("dance","data/girl/dance.skanim");

	// ROOM PART 
	//load a GLTF for the room
	var room = new RD.SceneNode({
		scaling: 40,
	});
	room.loadGLTF("data/japanese_street_at_night/scene.gltf");
	scene.root.addChild( room );

	// main loop ***********************

	//main draw function
	context.ondraw = function(){
		gl.canvas.width = document.body.offsetWidth;
		gl.canvas.height = document.body.offsetHeight;
		gl.viewport(0,0,gl.canvas.width,gl.canvas.height);


		// How to make the camera follow the character
		camera.lookAt(camera.position, character_pivot.localToGlobal(character.position), [0,1,0]); // ??
		camera.perspective( 60, gl.canvas.width / gl.canvas.height, 0.1, 1000 );
		camera.position[2] = character.position[2] + 200;
		//clear
		renderer.clear(bg_color);
		//render scene
		renderer.render(scene, camera);
	}

	//main update
	context.onupdate = function(dt)
	{
		//not necessary but just in case...
		scene.update(dt);

		var t = getTime();
		var anim = animations.idle;
		var time_factor = 1;

		//control with keys
		if(gl.keys["UP"])
		{
			character.moveLocal([0,0,1]);
			anim = animations.walking;
		}
		else if(gl.keys["DOWN"])
		{
			character.moveLocal([0,0,-1]);
			anim = animations.walking;
			time_factor = -1;
		}
		if(gl.keys["LEFT"])
			character.rotate(90*DEG2RAD*dt,[0,1,0]);
		else if(gl.keys["RIGHT"])
			character.rotate(-90*DEG2RAD*dt,[0,1,0]);

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
			//var coll = vec3.create();
			//scene.testRay(ray, coll, 1000, 0xFF, true);
			if( ray.testPlane( RD.ZERO, RD.UP ) ) //collision
			{
				console.log( "floor position clicked", ray.collision_point );
				//girl_pivot.position = ray.collision_point;
				//character_pivot.orientTo(ray.collision_point, [0,1,0]);
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
			camera.move([-e.deltax*0.1, e.deltay*0.1,0]);
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

}

/* example of computing movement vector
	var delta = vec3.sub( vec3.create(), target, sprite.position );
	vec3.normalize(delta,delta);
	vec3.scaleAndAdd( sprite.position, sprite.position, delta, dt * 50 );
	sprite.updateMatrices();
	sprite.flags.flipX = delta[0] < 0;
*/

// when you get the message syou have to go to the node an dupdate the postion of the users