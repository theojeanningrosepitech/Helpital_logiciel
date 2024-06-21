const {app, BrowserWindow, screen, ipcMain, clipboard} = require('electron');
const os = require('os');
const path = require('path')
const axios = require("axios");
let mainWindow, awaitingNFCwriting = { waiting: false, error: false, code: '' };
let nfcPcsc;

try {
    nfcPcsc = require('nfc-pcsc');
} catch (e) {
    console.error('Missing nfc-pcsc module (optional)');
}
require('dotenv').config();

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

function createWindow() {
    mainWindow = new BrowserWindow({
        // width: 1200,
        // height: 800,
        frame: true,
        icon: __dirname + '/../public/images/helpital_logo_heart.png',
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),
        }
    })
    mainWindow.removeMenu();
    if (mainWindow.maximizable)
        mainWindow.maximize();
    mainWindow.webContents.openDevTools();
    const sysInfo = getSystemInformation();
    // console.log(__dirname + '../public/images/helpital_logo_heart.png')
    const url = `${(process.env.EXTERNAL_SERVER_ADDRESS && process.env.EXTERNAL_SERVER_ADDRESS !== '') ? process.env.EXTERNAL_SERVER_ADDRESS : process.env.SERVER_ADDRESS}?machine_hash=${sysInfo.hash}&machine_type=${sysInfo.type}`;
    console.log(url);


    let startTime, endTime, sourceURL, cookie;
    //electron log
    mainWindow.webContents.on('did-finish-load', async () => {
        endTime = new Date();
        if (endTime > startTime) {
            let parse = function (arr) {
                // console.log("array =", arr)
                let params = new URLSearchParams(arr[1]);
                params = [...params.entries()]
                let paramsObj = {}
                params.forEach((key, i) => {
                    paramsObj[key[0]] = key[1]
                })
                return {
                    path: arr[0][arr[0].length - 1] === '/' ? arr[0] : arr[0] + '/',
                    params: JSON.stringify(paramsObj)
                }
            }
            let ref = parse(sourceURL.split('?'))
            let u = parse(mainWindow.getURL().split('?'))
            var timeDiff = endTime - startTime;
            let logObj = {
                machine_id: sysInfo.hash,
                network_type: sysInfo.type,
                time_spent: timeDiff,
                referrer: ref.path,
                referrer_parameters: ref.params,
                url: u.path,
                url_parameters: u.params,
                cookies: nC,
                date: endTime,
            }
            // axios.post('http://localhost:5001/electron/data', logObj)
        }
        cookie = await mainWindow.webContents.session.cookies.get({})
        nC = {}
        cookie.forEach(c => {
            nC[c.name] = c.value
        })
        cookie = JSON.stringify(nC)
        startTime = new Date();
        sourceURL = mainWindow.getURL();
    })

    //client log
    ipcMain.on('mouseClick', function (event, arg) {
        arg["screen_width"] = mainWindow.getSize()[0]
        arg["screen_height"] = mainWindow.getSize()[1]
        // axios.post('http://localhost:5001/client/data', arg)
    })
    ipcMain.on('clipboard-copy', (event, text) => {
        clipboard.writeText(text, 'selection');
    });

    ipcMain.handle('nfc-availability', (event) => {
        if (nfcPcsc)
            return true;
        else
            return false;
    });

    if (nfcPcsc) {
        const nfc = new nfcPcsc.NFC();

        ipcMain.handle('nfc-write', async (event, arg) => {

            if (!arg || typeof arg !== 'string' || arg.length != 16) {
                return false;
            }
            const result = await awaitingToWriteNFC(arg);
            return result;
        });

        nfc.on('reader', async reader => {

            console.log(`device attached`, reader.reader.name);
            //reader.aid = '';
            // reader.autoProcessing = false;

        	reader.on('card', async card => {
                const authKey = 'FFFFFFFFFFFF';
            	const keyType = nfcPcsc.KEY_TYPE_B;

                if (awaitingNFCwriting.waiting) {
                	try {
                        await reader.authenticate(4, keyType, authKey);
                    	const data = Buffer.allocUnsafe(16);
                        data.write(awaitingNFCwriting.code);
                        await reader.write(4, data, 16);
                        awaitingNFCwriting.error = false;
                	} catch (err) {
                    	console.error(`error when writing data`, err);
                        awaitingNFCwriting.error = true;
                    }
                    awaitingNFCwriting.waiting = false;

                } else {
                	try {
                        await reader.authenticate(4, keyType, authKey);
                		// reader.read(blockNumber, length, blockSize = 4, packetSize = 16)
                		const data = await reader.read(4, 16);
                        mainWindow.webContents.send('nfc', data.toString());
                	} catch (err) {
                		console.error(`error when reading data`, err);
                	}
                }
        	});

        	reader.on('error', err => {
        		console.log(`${reader.reader.name}  an error occurred`, err);
        	});

        });

        nfc.on('error', err => {
        	console.log('An error occurred on nfc', err);
        });
    }

    mainWindow.loadURL(url);
}

async function awaitingToWriteNFC(code) {
    awaitingNFCwriting.waiting = true;
    awaitingNFCwriting.code = code;

    for (let i = 0; i !== 60; i++) {
        await new Promise(r => setTimeout(r, 500));

        if ( !awaitingNFCwriting.waiting)
            return !awaitingNFCwriting.error;
    }
    awaitingNFCwriting.waiting = false;
    return false;
}

function getSystemInformation() {
    const nI = os.networkInterfaces();

    if (nI.hasOwnProperty('Ethernet')) {
        return {hash: nI.Ethernet[0].mac, type: 'ethernet'};
    } else if (nI.hasOwnProperty('eth0')) {
        return {hash: nI.eth0[0].mac, type: 'eth0'};
    } else if (nI.hasOwnProperty('Wi-Fi')) {
        return {hash: nI["Wi-Fi"][0].mac, type: 'wifi'};
    }

    for (const key in nI) {
        for (const wireless of nI[key]) {
            if ( !wireless.internal && wireless.family === 'IPv4') {
                return {hash:wireless.mac, type: 'wifi'};
            }
        }
    }
    return null
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0)
            createWindow()
    })
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
    //TODO: Safe save of data for windows -> create a file and check if saved ?
})
