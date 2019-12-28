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
var BPMWin = null; //bpm changer window
var titleWin = null; //title Changer window
var trackWin = null;
var toolsWin = null;

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
  //win.webContents.openDevTools();
  // and load the index.html of the app.
  win.loadFile('src/index.html')
  win.on("close", () => {
    if(BPMWin != null) BPMWin.destroy();
    BPMWin = null;
    if(toolsWin) toolsWin.destroy();
    toolsWin = null;
    if(titleWin) titleWin.destroy();
    titleWin = null;
    if(trackWin) trackWin.destroy();
    trackWin = null;
  })

  //opens toolkit at launch
  editingTools();
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
        type: "separator",
        role: "seperator"
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
        type: "separator",
        role: "seperator"
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
      { //deletes currentTrack
        label: "Delete Current Track",
        click: deleteTrack
      },
      { //Opens editing window
        label: "Editing Tools",
        click: editingTools
      },
      {
        type: "separator",
        role: "seperator"
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
  BPMWin = new BrowserWindow({
    width: 200,
    height: 150,
    alwaysOnTop: false,
    webPreferences: {
      nodeIntegration: true,

    }
  })

  //BPMWin.webContents.openDevTools();
  BPMWin.setMenuBarVisibility(false);
  BPMWin.setResizable(false);

  // and load the index.html of the app.
  BPMWin.loadFile('src/BPM.html')
  BPMWin.show();
}

function newTrack(){
  // Create the browser window.
  trackWin = new BrowserWindow({
    width: 300,
    height: 200,
    alwaysOnTop: false,
    webPreferences: {
      nodeIntegration: true,

    }
  })
  //trackWin.webContents.openDevTools();
  trackWin.setMenuBarVisibility(false);
  trackWin.setResizable(false);

  // and load the index.html of the app.
  trackWin.loadFile('src/track.html')
  trackWin.show();

}
/*Opens Prefernces window*/
function preferences(){

}

/**asks if they wouldlike to delete current track*/
function deleteTrack(){
  let response = dialog.showMessageBox(win,

    {
    buttons: ["Yes","No"],
    message: "Would you like to delete the current track?",
    cancelId:1})
  if(response == 0){//yes was selected
    win.webContents.send("delete-track");
  }
}

/**Opens editing tools*/
function editingTools(){
  // Create the browser window.
  // Create the browser window.
  toolsWin = new BrowserWindow({
    width: 100,
    height: 296,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,

    }
  })

  //toolsWin.webContents.openDevTools();
  toolsWin.setMenuBarVisibility(false);
  toolsWin.setResizable(false);
  // and load the index.html of the app.
  toolsWin.loadFile('src/tools.html')
  toolsWin.show();
}

function titleWindow(){
  // Create the browser window.
  titleWin = new BrowserWindow({
    width: 400,
    height: 150,

    alwaysOnTop: false,
    webPreferences: {
      nodeIntegration: true,

    }
  })

  //BPMWin.webContents.openDevTools();
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
  if(BPMWin != null) BPMWin.destroy();
  BPMWin = null;
  if(toolsWin) toolsWin.destroy();
  toolsWin = null;
  if(titleWin) titleWin.destroy();
  titleWin = null;
  if(trackWin) trackWin.destroy();
  trackWin = null;
})


/********************IPC COMMUNICATIONS*************************/
ipcMain.on("send-bpm-to-main", (event,bpm) => {
  //sends new bpm the main window
  win.webContents.send("send-bpm",bpm);

})

//gets the title from titleWin and sends it to the mainWin
ipcMain.on("send-title-to-main", (event,title) => {
  win.webContents.send("send-title",title);

})

//asked to open bpm window
ipcMain.on("open-bpm-window", (event) => {
  //opens bpm window
  BPMWindow();
})

//waitings for save to be called
ipcMain.on("save", (event) => {
  save();
})

ipcMain.on("new-track",(event,track) => {
  win.webContents.send("new-track",track);
})

ipcMain.on("new-note",(event,noteLength) => {
  win.webContents.send("new-note",noteLength);
})

ipcMain.on("new-rest",(event,noteLength) => {
  win.webContents.send("new-rest",noteLength);
})

ipcMain.on("move-note-up",(event) => {
  win.webContents.send("move-note-up");
})

ipcMain.on("move-note-down",(event) => {
  win.webContents.send("move-note-down");
})

ipcMain.on("flat",(event) => {
  win.webContents.send("flat");
})

ipcMain.on("sharp",(event) => {
  win.webContents.send("sharp");
})

ipcMain.on("dot",(event) => {
  win.webContents.send("dot");
})

ipcMain.on("del-note",(event) => {
  win.webContents.send("del-note");
})
