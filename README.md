# Exploring Socket.io

An app to learn how to use the different features of socket.io.

## Install 

Check out code
npm install client and server
npm start client 
npm start server

## Sockets - keep it tight

The fist thing we need to manage is sockets. 

Server:

A client must be able to ask the server for a list of all the connected sockets when they first connect.
When a socket connects to the server we want to broadcast that to anyone who is online.

Client:

When a connection is made I want to know what sockets are already connected.
After we get the initial list we will need to listen for when new sockets connect 
and for when sockets disconnect. 
    
## Boot Sequence
    
    index.html    
    index.js
    App.js
    App Mounts 
    create stores
    create a socket
    socket connects
    get sockets which are already on the server who have connected before me
    if we have a user in local storage -> login
    
    after a user has logged in
    
##### Create a new room
##### Join an existing room
##### Leave a room

        
    
    
    



