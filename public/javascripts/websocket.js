const websocket = {
    socket: new WebSocket((window.location.protocol === "https:" ? 'wss://' : 'ws://') + window.location.host + '/websocket'),
    listeners: {},
    addEventListener: (ressource, eventType, callback) => {
        if ( !websocket.listeners.hasOwnProperty(ressource))
            websocket.listeners[ressource] = {};
        if ( !websocket.listeners[ressource].hasOwnProperty(eventType))
            websocket.listeners[ressource][eventType] = [];
        websocket.listeners[ressource][eventType].push(callback);
    },
    removeEventListener: (ressource, eventType, callback) => {
        if ( !websocket.listeners.hasOwnProperty(ressource))
            return;
        if (!eventType)
            delete websocket.listeners[ressource];
        else if (!callback || websocket.listeners[ressource][eventType].length < 2)
            delete websocket.listeners[ressource][eventType];
        else {
            for (let i in websocket.listeners[ressource][eventType])
                if (websocket.listeners[ressource][eventType][i] == callback)
                    delete websocket.listeners[ressource][eventType][i];
            if (websocket.listeners[ressource][eventType].length < 1)
                delete websocket.listeners[ressource][eventType];
        }
    }
};

// websocket.socket.addEventListener('open', function(e) {});

/*
    creator: { userID: 1, sessionID: '0000-0000-0000-000000' / null }
    type: new, update, delete
    ressource: inventory / rooms / chat
    identifiers: { id: 1, service: 4 } / null
    data: any-value / {} / [] / null
    receivers: null / [userID]
*/
websocket.socket.addEventListener('message', (e) => {
    const message = JSON.parse(e.data);

    if (websocket.listeners.hasOwnProperty(message.ressource)) {
        for (let i in websocket.listeners[message.ressource][message.type])
            websocket.listeners[message.ressource][message.type][i](message);
    }
});
