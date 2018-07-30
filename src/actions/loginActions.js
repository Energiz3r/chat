export const setLoginState = (
  {
    loggedIn = false,
    nick = '',
    username = '',
    usernameIsValidNick = false,
    usernameIsValidEmail = false
  } = {}
) => ({
  type: 'SET_LOGIN_STATE',
  loginState: {
    loggedIn,
    nick,
    username,
    usernameIsValidNick,
    usernameIsValidEmail
  }
});
  
export const unsetUsernameIsValidNick = () => ({
  type: 'UNSET_USERNAME_IS_VALID_NICK'
});
export const unsetUsernameIsValidEmail = () => ({
  type: 'UNSET_USERNAME_IS_VALID_EMAIL'
});
export const setUsernameIsValidNick = () => ({
  type: 'SET_USERNAME_IS_VALID_NICK'
});
export const setUsernameIsValidEmail = () => ({
  type: 'SET_USERNAME_IS_VALID_EMAIL'
});

export const setUsername = (username) => ({
  type: 'SET_USERNAME',
  username
});
export const setLoggedIn = () => ({
  type: 'SET_LOGGED_IN'
});
export const setNick = (nick) => ({
  type: 'SET_NICK',
  nick
});
  