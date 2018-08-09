import React from 'react';
import ChannelList from './ChannelList';
import ChatMainWindow from './ChatMainWindow';
import UserList from './UserList';
import DOMHandler from './DOMHandler';
import LoginModal from './LoginModal';
import ConnectingModal from './ConnectingModal';
import ChannelPicker from './ChannelPicker';
import LeaveChannelModal from './LeaveChannelModal';
import AdminModal from './AdminModal';
import { connect } from 'react-redux';

class ChatApp extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    //&& this.props.loginState.loggedIn
    return (
      <div className="blazechat-root-container">

        <DOMHandler />
        {(!this.props.userInterface.appIsConnected || !this.props.userInterface.defaultChannelsReceived) && <ConnectingModal />}
        {(this.props.userInterface.loginModalVisible && this.props.userInterface.appIsConnected && this.props.userInterface.defaultChannelsReceived) && <LoginModal />}
        {(this.props.userInterface.adminModalVisible && this.props.userInterface.appIsConnected) && <AdminModal />}
        {(this.props.userInterface.channelPickerVisible && this.props.userInterface.appIsConnected) && <ChannelPicker />}
        {(this.props.userInterface.leaveChannelModalVisible && this.props.userInterface.appIsConnected) && <LeaveChannelModal />}

        <div className={"blazechat-overlay-container" + (this.props.userInterface.appIsBlurred ? " blur-container" : "")}>
          {this.props.userInterface.channelListVisible && <ChannelList />}
          <ChatMainWindow />
          {this.props.userInterface.userListVisible && <UserList />}
          <div className={'blazechat-color-overlay' + (this.props.userInterface.appIsBlurred ? ' blazechat-color-overlay-visible' : ' blazechat-color-overlay-invisible')}></div>
        </div>

      </div>
    );
  }
}

const mapStateToProps = (state) => {
    return state;
}

export default connect(mapStateToProps)(ChatApp);