# VIRTUAL 3D CHAT: STREET EXPERIENCE

With our app we want to recreate the daily life of users. The actions they'd usually do when they are out on the street and that they can share with friends or complete strangers. That is why our app is based on a japanese street with several doors. You can go inside a restaurant and play music, you can go to your living room and watch TV, or you can go to a conference room and connect via webcam to other users.

## Feautures:
- Translation: of messages by selecting the language you text in and you want to get messages in, from the dropwdown on top of the chat.
- WebCam connection: using PeerJS by going to the coference room at the end of the street and approaching the screen. You are required to enter a peer ID of another user willing to connect to the webcam in order to establish the connection.
- Collaborative TV watching: by going to the first door on the right and entering the living room. If you approach the TV you can play it and enjoy a video with other users.
- Direct Messaging: if you click on top of a user, you can send direct messages to him/her that will only be received by that user.
- Group messaging: you can chat like a regular groupchat with all the users in the room.
- LogIn/SignUp: you can sign up the first time you use the app, and log in afterwards. If you use the same browser after you login once, the session token will be stored on your local storage thus not requiring you to sign up every time. You can log out by clicking the log out button to exit.
- Database connectivity: passwords, tokens, user avatars, positions and current rooms are stored on the server database so when you log out all the info regarding your user is stored and retrieved when you log in afterwards.
- Avatar selection: You can select your avatar when you sign up the first time, and change it by clicking the Change Avatar button afterwards.
- View mode: you can select 3 different view modes when you are logged in, 3rd person, far view, and first person.
- Animation mode: you can select the animation you want for your avatar, such as dancing, waving others, or idle.
- Music playing: if you go to the 'restaurant' room, you can get close to the record player and select a song to listen to. We are using Spotify's iframe so you can only preview songs of a playlist.

## Tech:
We are using different tech:
- PeerJS to establish the connection with webcam to others.
- Crypto for password hashing and session token generation.
- JSON: the 3D space configuration is done via the world.json file, you can add there different rooms with door positions, target exits, walk areas, sacaling, 3d file path and items. This makes very easy to create new rooms as you just need to add this parameters and it will be added. In the position you indicate there is a door, the app will show a message to join that room to the user while connected. If you add an item, the user will also get a pop up message on the screen to interact with that item when he/she is close to it. You then have to add specific code to create the logic of the interaction.
- Painting video/stream on a canvas 2D: when you play a video or connect your webcam, the video generated will be painted frame by frame on a canvas 2d on the screen.