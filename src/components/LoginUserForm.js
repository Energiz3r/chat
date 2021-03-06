import React from 'react';
import { connect } from 'react-redux';
import { socket } from '../utils/handlers/client';
import { setNick, setAdmin } from '../actions/actions';
import requestJoinDefaultChannels from '../utils/handlers/requestJoinDefaultChannels';
import log from '../utils/log'

class LoginUserForm extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      email: '',
      emailIsValid: false,
      password: '',
      termsAccepted: true,
      waitingForLoginResponse: false,
      loginResponse: '',
      accountWasCreated: this.props.accountWasCreated
    }
  }
  onFormSubmit=(e)=>{
    e.preventDefault();
    if (this.state.emailIsValid && this.state.termsAccepted && !this.state.waitingForLoginResponse && this.state.password.length > 0) {
      this.setState({
        ...this.state,
        waitingForLoginResponse: true,
        loginResponse: ''
      })

      const loginObject = {
        type: 'user',
        email: this.state.email,
        password: this.state.password
      }

      //send the login request to the server
      socket.emit('request login', loginObject);

    } else {
      this.setState({
        ...this.state,
        waitingForLoginResponse: false,
        loginResponse: 'invalid form entry'
      })
    }
  }
  handleLoginResponse = ({response, nick, isAdmin}) => { //listener action
    if (response == "success") {

      log("Login accepted, joining channels...")

      this.props.dispatch(setNick(nick));

      if (isAdmin) {
        this.props.dispatch(setAdmin());
      }

      requestJoinDefaultChannels();

      //animate closing this modal
      this.props.unmount()

    } else if (!response) { //in case the response wasn't an object as expected
      this.setState({
        ...this.state,
        waitingForLoginResponse: false,
        loginResponse: "error sending request - invalid response"
      })
    } else {
      this.setState({
        ...this.state,
        waitingForLoginResponse: false,
        loginResponse: response
      })
    }
  }
  componentDidMount = () => {
    socket.on('login response', this.handleLoginResponse); //create listener
  }
  componentWillUnmount = () => {
    socket.removeListener('login response', this.handleLoginResponse); //destroy listener
  }
  
  onPWChange=(e)=>{
    const password = e.target.value;
    this.setState({
      ...this.state,
      password
    })
  }
  onEmailChange=(e)=>{
    const email = e.target.value;
    //check if email is valid
    if (!email || email.match( /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ )) {
      this.setState({
        ...this.state,
        email,
        emailIsValid: true
      })
    } else {
      this.setState({
        ...this.state,
        email,
        emailIsValid: false
      })
    }
  }
  render() {
    return (

      <div className="loginFormContainer">
        <form className="loginForm" onSubmit={this.onFormSubmit}>

          {(this.state.email != '' && !this.state.emailIsValid) &&
            <p className="loginMessage">Please enter a valid email</p>}

          {this.state.accountWasCreated && 
            <p className="loginMessage ping-good">Account was successfully created! Please log in:</p>}

          {this.state.loginResponse != '' ? <p className="nickSetFailedReason">{this.state.loginResponse}</p> : ''}
          <input 
            className={"loginInput guestNickInput" + (this.props.configuration.lightTheme ? " guestNickInput-light" : "")}
            type='text'
            placeholder="email"
            onChange={this.onEmailChange}
            value={this.state.email || ''}
            spellCheck="false"
          />
          <input
            className={"loginInput guestNickInput" + (this.props.configuration.lightTheme ? " guestNickInput-light" : "")}
            type='password'
            placeholder="password"
            onChange={this.onPWChange}
            value={this.state.password || ''}
          />

          <div className="terms-container terms-container-user">
            <p className={"terms-paragraph" + (this.props.configuration.lightTheme ? " p-light" : "")}>Accept <a href='terms.html' className={this.props.configuration.lightTheme ? "a-light" : ""}>terms and conditions</a>?</p>
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={this.state.termsAccepted ? "checked" : ''}
                onChange={() => {
                  if (this.state.termsAccepted) { this.setState({
                    ...this.state,
                    termsAccepted: false
                  }) }
                  else { this.setState({
                    ...this.state,
                    termsAccepted: true
                  }) }
                }}
              />
              <span className="checkbox-checkmark"></span>
            </label>
            
          </div>

          <p className="loginMessage">
            <button
              className='loginButton'
              //check for conditions that would cause the button to be disabled
              disabled={!this.state.emailIsValid ||
                this.props.channels.filter((channel) => channel.isDefault && channel.isSelectedInPicker == true).length < 1 ||
                !this.state.termsAccepted ||
                this.state.waitingForLoginResponse}
            >
              {!this.state.waitingForLoginResponse ? "Start chatting" : "Logging in... "}
              {this.state.waitingForLoginResponse && <span className="fa fa-spinner fa-spin"></span>}
            </button>
          </p>
        </form>
      </div>
    );
  };
}

export default connect(state=>state)(LoginUserForm);