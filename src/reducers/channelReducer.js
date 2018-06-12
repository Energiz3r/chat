const reducerDefaultState = [];

export default (state = reducerDefaultState, action) => {
    switch (action.type) {
        case 'ADD_CHANNEL':
            return [
            ...state,
            action.channel
            ];
        case 'SET_CURRENT_CHANNEL':
            return state.map((channel) => {
                if (channel.channelId === action.channelId) {
                    return {
                        ...channel,
                        isCurrent: true
                    }
                } else {
                    return {
                        ...channel,
                        isCurrent: false //return false here because we only want one channel to be current at any time
                    }
                }
            })
        case 'JOIN_CHANNEL':
            return state.map((channel) => {
                if (channel.channelId === action.channelId) {
                    return {
                        ...channel,
                        isJoined: true
                    }
                } else {
                    return {
                        ...channel
                    }
                }
            })
        default:
            return state;
    }
};
