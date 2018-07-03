import { store } from '../../stores/store';
import { addUser, removeUser, flushUserList } from '../../actions/actions';
import socket from './client';
import getCurrentChannel from '../getCurrentChannel';

//requests a list of users for the current channel
export const requestUserList = () => {

  //check the user is in a channel before sending a server request
  if (store.getState().channels.filter(channel => channel.isJoined).length > 0) {
    //get the ID of the current channel
    const currentChannelId = getCurrentChannel();
    //empty the list first
    store.dispatch(flushUserList());
    //make sure the list is emptied before sending the request
    //setTimeout(()=>{
      //send the request to the server
      socket.emit('request user list', currentChannelId, (response) => {
        //handle the response
        if (response == "success") {
          console.log("user list request sent");
        } else {
          console.log("user list request failed: " + response);
        }
      });
    //},0) //0ms ensures it happens next tick :)
  }

}

//handle removing a user from channels (array)
export const onRemoveUser = (userId) => {
  if (userId) {
    console.log("Remove user request received: " + userId)
    store.dispatch(removeUser(userId));
  } else {
    console.log("invalid user ID received for removing a user: " + userId);
  }  
};

//handle receiving a single user
export const onReceiveUser = (user) => {
  if (typeof(user) == 'object') {
    console.log("user received: " + user.nick)
    store.dispatch(addUser(user));
  } else {
    console.log("invalid user obj received:");
    console.log(user);
  }  
};
