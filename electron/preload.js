const { contextBridge, ipcRenderer } = require('electron');
const API = {};
const EVENT = {};

document.addEventListener('click', (event) => {
    let x = event.clientX;
    let y = event.clientY;
    let attr = {}
    for (let a of event.target.attributes) {
        attr[a.name] = a.value !== undefined ? a.value : "";
    }
    let t = {
        attributes: attr,
        childElementCount: event.target.childElementCount,
        localName: event.target.localName,
        tagName: event.target.tagName
    }
    let str = document.cookie.split('; ');
    const result = {};
    for (let i in str) {
        const cur = str[i].split('=');
        result[cur[0]] = cur[1];
    }
    ipcRenderer.send('mouseClick', {
        mousePosX: x,
        mousePosY: y,
        target: t,
        cookies: result,
        referrer: document.referrer,
        url: location.href,
        date: new Date()
    });
});

EVENT.nfc = (callback) => {
    ipcRenderer.on('nfc', (evnt, arg) => {
        callback(evnt, arg);
    });
};

API.on = (eventType, callback) => {
   EVENT[eventType](callback);
};

API.availabilityNFC = async () => {
    const result = await ipcRenderer.invoke('nfc-availability');
    return result;
}

API.writeNFC = async (code) => {
    try {
        const result = await ipcRenderer.invoke('nfc-write', code);
        return result;
    } catch (e) {
        console.error(e);
        return false;
    }
}

API.clipboardCopy = (text) => ipcRenderer.send('clipboard-copy', text);

// create an api for window objects in web pages
contextBridge.exposeInMainWorld('electronAPI', API);
