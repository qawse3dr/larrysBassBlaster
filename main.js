/*
Author: Lawrence Milne
gitHandle: qawse3dr
*/


const { app, BrowserWindow } = require('electron')


var win = null;

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  win.loadFile('index.html')
  win.webContents.openDevTools()
}

function getData(){
  console.log('Clicked!!')
}
win.querySelector('#Play').addEventListener('click', () => {
  getData()
})
app.on('ready', createWindow)
