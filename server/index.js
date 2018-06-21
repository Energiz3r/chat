var config = require('./config');
const express = require('express');
const app = express();
var helmet = require('helmet')
app.use(helmet())
app.use(express.static(__dirname + '/public')); //specify that static content (bundle.js, images) lives in the 'public' folder
var http = require('http').Server(app);
var clone = require('lodash.clone');
var io = require('socket.io')(http, {
  pingTimeout: config.pingTimeout,
  pingInterval: config.pingInterval,
  maxHttpBufferSize: config.maxHttpBufferSize,
});
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html'); //send the index.html file
});



//contains users that are currently connected
var onlineUsers = [];
//contains which channels users have joined
var usersInChannels = [];
//contains user-created channels
var userChannels = [{
  ...config.defaultChannel,
  channelId: 21,
  channelName: 'admin channel',
  topic: 'secret admin stuff'
}]; //TO DO: save/load userChannels from database

//for a given socket ID, return the user's nick
const socketToNick = (socketId) => {
  const userObj = onlineUsers.filter(user => 
    user.socketId == socketId
  );
  if (userObj) {
    if (userObj[0]) {
      return userObj[0].nick;
    } else {
      console.log("couldn't find nick (e2):");
      console.log(userObj);
      return "E:2 ";
      
    }
    
  } else {
    console.log("couldn't find nick (e1)");
    return "E:1 ";
  }
};

//sends a message (par 2) to a channel (par 1), excluding the sender if their socket is also supplied (par 3)
const sendSystemMessageToChannel = (channelId, messageText, socketIdToExclude = false) => {
  //create the message object to send
  +new Date;
  const message = {
    type: 'inbound',
    channelId: channelId,
    source: '*',
    receivedTimestamp: Date.now(),
    messageText: messageText
  }
  //filter users to only people in the target channel
  const usersInChannel = usersInChannels.filter(user => (
    user.channelId == channelId
  ));
  //check there are users in the channel
  if (usersInChannel) {
    //send the message only to those users
    usersInChannel.map((user)=>{
      //exclude the sender if one was specified
      if (user.socketId != socketIdToExclude) {
        io.to(user.socketId).emit('chat message', message);
      }
    })
  }
}

//the business end of the stick - event handlers for the client belong in here
io.on('connection', (socket) => {

  //get the user's IP address
  var ipaddress = socket.handshake.address.substr(7);
  if (ipaddress) {
    require('dns').reverse(ipaddress, function(err, domains) {
      if (!domains) {
        console.log('connection from: ' + ipaddress);
      } else {
        console.log('connection from: ' + domains[0]);
      }
    });
  } else {
    console.log('connection from unknown IP');
  }

  //when the client requests a user list
  socket.on('get user list', (channelId, callback) => {
    console.log("Request for user list for channel: '" + channelId + "' from socket: " + socket.id);
    let response = "success"
    //check the channel ID was valid
    if (isNaN(channelId)) {
      response = "invalid channel ID";
    }

    //check if the channel ID is in one of the channel lists
    response = "that channel was not found";
    config.defaultChannels.map((channel)=>{
      if (channel.channelId == channelId) {
        response = "success";
      }
    });
    userChannels.map((channel)=>{
      if (channel.channelId == channelId) {
        response = "success";
      }
    });

    //check the user is actually in that channel
    response = "you are not in channel: " + channelId
    let usersChannels = []; //keep track of which channels the user *is* in, we'll use this later on
    usersInChannels.map((record)=>{
      if (record.channelId == channelId && record.socketId == socket.id) {
        response = "success";
      }
      if (record.socketId == socket.id) {
        usersChannels.push(record.channelId);
      }
    })

    //check the permissions for the channel here

    //send the list of users in the channel
    if (response == "success") {

      //get the list of users actually in the requested channel
      const userList = usersInChannels.filter(user => user.channelId == channelId);

      let outgoingList = [];

      //create the object for each user in the channel
      userList.map((user) => {

        let outgoingUser = {
          userId: user.socketId,
          channels: [], //contains a list of channels the user is in
          isAway: false, //lol
          isBlocked: false, //lol
          isCurrentUser: false,
          group: 'user' //lol
        };

        //populate the channels array for this user
        usersInChannels.map((record)=>{

          //only get channels the user requesting the user list is in - for privacy reasons we don't want them seeing other channels a user is in unles they're in those same channels
          if (record.socketId == user.socketId && usersChannels.includes(record.channelId)) {
            outgoingUser.channels.push(record.channelId);
          }
        })

        //get the nickname for this user
        onlineUsers.map((record)=>{
          if (record.socketId == user.socketId) {
            outgoingUser.nick =  record.nick;
          }
        })

        //check if the user is the current user
        if (user.socketId == socket.id) {
          outgoingUser.isCurrentUser = true;
        }

        //add to the list we'll send to the client
        outgoingList.push(outgoingUser);

      });

      //send the list to the client
      io.to(socket.id).emit('user list', outgoingList);
    }
    callback(response);
  });

  //when the client requests to join a channel
  socket.on('join channel', (channelId, callback) => {
    console.log("Request to join channel '" + channelId + "' from socket: " + socket.id);
    let response = "success"
    //check the channel ID was valid
    if (isNaN(channelId)) {
      response = "invalid channel ID";
    }
    //check if the ID is in one of the channel lists
    response = "channel not found";
    for (var i = 0; i < config.defaultChannels.length; i++) {
      if (config.defaultChannels[i].channelId == channelId) {
        response = "success";
      }
    };
    for (var i = 0; i < userChannels.length; i++) {
      if (userChannels[i].channelId == channelId) {
        response = "success";
      }
    };

    //check the permissions for the channel here

    //check if the user is already in the channel
    usersInChannels.map((channel)=>{
      if (channel.channelId == channelId && channel.socketId == socket.id) {
        response = "already in channel";
      }
    });
    //add the user to the channel
    if (response == "success") {
      usersInChannels.push({
        channelId: channelId,
        socketId: socket.id
      })
      //message to send to users in the channel
      const nick = socketToNick(socket.id);
      sendSystemMessageToChannel(channelId, nick + " has joined the channel", socket.id);

      let outgoingUser = {
        userId: socket.id,
        channels: [], //contains a list of channels the user is in
        isAway: false, //lol
        isBlocked: false, //lol
        isCurrentUser: false,
        group: 'user' //lol
      };
      //populate the channels array for this user
      usersInChannels.map((record)=>{
        if (record.socketId == socket.id) {
          outgoingUser.channels.push(record.channelId);
        }
      })
      //get the nickname for this user
      outgoingUser.nick =  nick;

      //send the new user object to everyone in the channel except the joining user
      usersInChannels.map((record)=>{
        if (record.channelId == channelId && record.socketId != socket.id) {
          //send the user item to the client
          io.to(record.socketId).emit('single user', outgoingUser);
        }
      })
      
    }
    callback({ response, channelId });
  });

  //when the client requests a list of the default channels they may join
  socket.on('request default channels', () => {
    console.log("Request for default channels from socket: " + socket.id)
    for (var i = 0; i < config.defaultChannels.length; i++) {
      //we don't want to send the entire channel object, so here we set up a new one with the required values in it
      const channel = {
        channelId: config.defaultChannels[i].channelId,
        channelName: config.defaultChannels[i].channelName,
        topic: config.defaultChannels[i].topic,
        isSelected: config.defaultChannels[i].isSelected
      };
      //send the channel object
      io.to(socket.id).emit('default channel', channel);
      if (i == config.defaultChannels.length - 1) {
        io.to(socket.id).emit('default channels finished');
        console.log("Sent default channels to socket: " + socket.id)
      }
    };
  });

  //when the client requests a list of the user channels they may join
  socket.on('request user channels', () => {
    console.log("Request for user channels from socket: " + socket.id)
    for (var i = 0; i < userChannels.length; i++) {
      //we don't want to send the entire channel object, so here we set up a new one with the required values in it
      const channel = {
        channelId: userChannels[i].channelId,
        channelName: userChannels[i].channelName,
        topic: userChannels[i].topic,
        isSelected: userChannels[i].isSelected
      };
      //check the channel is publicly listed
      if (channel.isVisible) {
        //send the channel object
        io.to(socket.id).emit('user channel', channel);
      }
      if (i == userChannels.length - 1) {
        io.to(socket.id).emit('user channels finished');
        console.log("sent user channels to socket: " + socket.id)
      }
    };
  });

  //when the client requests to set their nick
  socket.on('set nick', (nick, callback) => {
    console.log("Request to set nick '" + nick + "' from socket: " + socket.id)
    let error = "success";
    if (!nick) {
      error = "no nick supplied";
    } else {
      //check if another user has that nick already
      onlineUsers.map((user)=>{
        if (user.nick == nick) { //the nick is in use
          if (user.socketId == socket.id) { //if it's the current user
            error = "nick already set";
          } else {
            error = "that nick is in use";
          }
        }
      })
      //check the length of the nick
      if (nick.length > config.nickMaxLength) {
        error = "nick was too long";
      }
      if (nick.length < config.nickMinLength) {
        error = "nick was too short";
      }
    }
    //if there was no error
    if (error == "success") {
      console.log("Nick '" + nick + "' accepted for socket: " + socket.id)
      //if the user is changing their nick (ie. they already have a nick) drop them from the array first
      let wasExistingUser = false;
      let existingNick = '';
      onlineUsers.map((user) => {
        if (user.socketId == socket.id) {
          console.log('User "' + user.nick + '" changed their nick to "' + nick + '".');
          wasExistingUser = true;
          existingNick = user.nick;
          onlineUsers.splice(i,1);
        }
      })
      //add the user to the array of online users
      onlineUsers.push({
        nick: nick,
        socketId: socket.id
      })
      //set the text of the message that will get sent to the user's channels
      let messageText = nick + " joined the channel";
      if (wasExistingUser) {
        messageText = existingNick + ' changed their nick to ' + nick;
      }
      //get the channels this user is in and send a message
      usersInChannels.map((user)=>{
        if (user.socketId == socket.id) {
          sendSystemMessageToChannel(user.channelId, messageText, socket.id);
        }
      });
    }
    //send the response
    callback(error);
  });

  //when the client sends a chat message
  socket.on('chat message', (msg, callback) => {
    //clone the incoming message object
    let outgoing = clone(msg); //this is so that we can mutate the object before sending without changing the original, which we need to reference
    let response = "nick not found";
    +new Date;
    outgoing.receivedTimestamp = Date.now();
    outgoing.sentTimestamp = "";
    //grab the nickname associated with the source socket ID and add it to the outgoing message (and also verify the user exists)
    onlineUsers.map((user) => {
      if (user.socketId == socket.id) {
        outgoing.source = user.nick;
        response = "success"
      }
    });
    //check the length of the message doesn't exceed the limit
    if (outgoing.messageText && outgoing.messageText.length > config.messageMaxLength) {
      response = "message exceeded maximum length";
    }
    //check the user is actually in the channel they're trying to send a message to
    console.log(usersInChannels);
    const checkUser = usersInChannels.filter(user => (
      user.channelId == outgoing.channelId && user.socketId == socket.id
    ));
    if (checkUser.length < 1) {
      response = "user not found in target channel";
    }

    //check channel message permissions here

    //send the response
    const timestamp = msg.sentTimestamp;
    callback({ timestamp, response });
    //if there were no errors
    if (response == "success") {
      console.log("'" + outgoing.source + "' said: '" + outgoing.messageText + "'");
      //filter users to only people in the target channel
      const usersInChannel = usersInChannels.filter(user => (
        user.channelId == outgoing.channelId
      ));
      //send the message only to those users
      usersInChannel.map((user)=>{
        //exclude the sender
        if (user.socketId != socket.id) {
          io.to(user.socketId).emit('chat message', outgoing);
        }
      })
    }
  });

  //when the client disconnects
  socket.on('disconnect', (reason) => {

    if (reason == 'transport error') {
      reason = 'connection closed';
    }

    const nick = socketToNick(socket.id);
    const messageText = nick + " has disconnected (" + reason + ")"
    console.log(nick + " (" + socket.id + ") has disconnected (" + reason + ")");

    //remove the users from the relevant arrays and send a notification to channels
    usersInChannels.map((user, i)=>{
      if (user.socketId == socket.id) {
        sendSystemMessageToChannel(user.channelId, messageText, socket.id)
        //tell clients who were in a channel with the user to remove the user from their user lists
        usersInChannels.map((record)=>{
          if (record.channelId == user.channelId && record.socketId != socket.id) {
            io.to(record.socketId).emit('remove user', socket.id);
          }
        })
        usersInChannels.splice(i,1);
      }
    })
    onlineUsers.map((user, i) => {
      if (user.socketId == socket.id) {
        onlineUsers.splice(i,1);
      }
    })
  });

});

//listen on port 3000.
//NOTE: blazebox is set up to map port 80 to 3000 so this doesn't need to be changed for production
http.listen(3000, () => {
  console.log('listening on *:3000');
});