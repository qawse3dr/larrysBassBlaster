/*
Author: Lawrence Milne
gitHandle: qawse3dr
*/


const electron = require('electron');
const shell = electron.shell;
const ipcMain = electron.ipcMain;
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const dialog = electron.dialog;



//Windows object.
var win = null; //main
var BPMwin = null; //bpm changer window
var titleWin = null; //title Changer window


function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    minHeight: 600,
    minWidth: 800,
    webPreferences: {
      nodeIntegration: true
    }
  })
  //win.setResizable(false);
  win.webContents.openDevTools();
  // and load the index.html of the app.
  win.loadFile('src/index.html')

}

/*
  MenuBar for the program
    contains {File(save and loading),Editing,Help(link to github and info)}
*/
var menu = electron.Menu.buildFromTemplate([
  { //File menu
    label: "File",
    submenu: [
      {
        label: "Save",
        click: save
      },
      {
        label: "Load",
        click: load
      },
      {
        type: "separator"
      },
      {
        label: "Exit",
        click: () => win.close()
      }
    ]
  },
  { //Edit menu
    label: "Edit",
    submenu: [
      { //undoes last command
        label: "Undo",
        click: undo
      },
      { //redoes last command if one exists
        label: "Redo",
        click: redo
      },
      {
        type: "separator"
      },
      { //Opens BPM Window
        label: "Change BPM",
        click: BPMWindow
      },
      { //Opens Title change Window
        label: "Change Title",
        click: titleWindow
      },
      { //Opens Add new Track window
        label: "Add track",
        click: newTrack
      },
      {
        type: "separator"
      },
      {
        label: "Preferences",
        click: preferences
      }
    ]
  },
  { //Help menu
    label: "Help",
    submenu: [
      { //undoes last command
        label: "Documentation",
        click: () => {
          shell.openExternal("https:/www.github.com/qawse3dr");
        }
      },
      { //redoes last command if one exists
        label: "qawse3dr git page",
        click: () => {
          shell.openExternal("https:/www.github.com/qawse3dr");
        }
      }
    ]
  }
]);

/**************** MENU FUNCTIONS *****************************/
/*saves to a midi file.*/
function save(){
  let fileName = dialog.showSaveDialog({
    title: "Save Song",
    filters: [
      {
        name: "Json Files", extensions: ["json"]
      },
      {
        name: "All Files", extensions: ["*"]
      }
    ]
  })
  win.webContents.send("save-file",fileName);
}

/*Opens another window to load a midi file.*/
function load(){
  let fileName = dialog.showOpenDialog({
    title: "Load Song",
    properties: ["openFile"],
    filters: [
      {
        name: "Json File", extensions: ["json"]
      },
      {
        name: "All Files", extensions: ["*"]
      }
    ]
  })

  //sends the midi file name to the ipcRenderer
  win.webContents.send("load-file",fileName[0]);
}

/*undos last command if it can.*/
function undo(){

}

/*redoes last command if it can.*/
function redo(){


}

/*Opens save bpm window*/
function BPMWindow(){
  // Create the browser window.
  BPMwin = new BrowserWindow({
    width: 200,
    height: 150,
    titleBarStyle: "hidden",
    alwaysOnTop: false,
    webPreferences: {
      nodeIntegration: true,

    }
  })

  //BPMwin.webContents.openDevTools();
  BPMwin.setMenuBarVisibility(false);
  BPMwin.setResizable(false);

  // and load the index.html of the app.
  BPMwin.loadFile('src/BPM.html')
  BPMwin.show();
}

function newTrack(){
  console.log("WORK IN PROGRESS")
}
/*Opens Prefernces window*/
function preferences(){

}

function titleWindow(){
  // Create the browser window.
  titleWin = new BrowserWindow({
    width: 400,
    height: 150,
    titleBarStyle: "hidden",
    alwaysOnTop: false,
    webPreferences: {
      nodeIntegration: true,

    }
  })

  //BPMwin.webContents.openDevTools();
  titleWin.setMenuBarVisibility(false);
  titleWin.setResizable(false);

  // and load the index.html of the app.
  titleWin.loadFile('src/title.html')
  titleWin.show();
}


Menu.setApplicationMenu(menu)

/****************MENU FUCNTIONS END*****************************/

//Starts the app when its ready.
app.on("ready",createWindow);

//Runs when app closes(clean up)
app.on("close", () => {
  win = null;
  BPMwin = null;
})


/********************IPC COMMUNICATIONS*************************/
ipcMain.on("send-bpm-to-main", (event,bpm) => {
  //sends new bpm the main window
  win.webContents.send("send-bpm",bpm);

})

ipcMain.on("send-title-to-main", (event,title) => {
  //sends new bpm the main window
  win.webContents.send("send-title",title);

})
ipcMain.on("open-bpm-window", (event) => {
  //opens bpm window
  BPMWindow();
})
ipcMain.on("save", (event) => {
  save();
})
