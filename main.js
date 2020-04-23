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
const fs = require("fs")


//Windows object.
var win = null; //main
var BPMWin = null; //bpm changer window
var titleWin = null; //title Changer window
var trackWin = null;
var toolsWin = null;
var preWin = null;

//config Files
config = {
  darkMode:false,
  shortcuts: {
    play:{key:"KeyP",Alt:false,Ctrl:false,shift:false,window:false},
    bpm: {key:"KeyB",Alt:false,Ctrl:false,shift:false,window:false},
    solo: {key:"KeyS",Alt:false,Ctrl:false,shift:false,window:false},
    metronome: {key:"KeyM",Alt:false,Ctrl:false,shift:false,window:false},
    count: {key:"KeyC",Alt:false,Ctrl:false,shift:false,window:false},
    currentNoteLeft: {key:"ArrowLeft",Alt:false,Ctrl:false,shift:false,window:false},
    currentNoteRight: {key:"ArrowRight",Alt:false,Ctrl:false,shift:false,window:false},
    shiftUp: {key:"ArrowUp",Alt:false,Ctrl:false,shift:false,window:false},
    shiftDown: {key:"ArrowDown",Alt:false,Ctrl:false,shift:false,window:false},
    dot: {key:"Period",Alt:false,Ctrl:false,shift:false,window:false},
    dot2: {key:"NumpadDecimal",Alt:false,Ctrl:false,shift:false,window:false},
    del: {key:"Backspace",Alt:false,Ctrl:false,shift:false,window:false},
    del2: {key:"Delete",Alt:false,Ctrl:false,shift:false,window:false},
    repeatLastNote: {key:"KeyR",Alt:false,Ctrl:false,shift:false,window:false},
    copy: {key:"KeyC",Alt:false,Ctrl:true,shift:false,window:false},
    paste: {key:"KeyV",Alt:false,Ctrl:true,shift:false,window:false},
    save: {key:"KeyS",Alt:false,Ctrl:true,shift:false,window:false},
    sharp: {key:"Key3",Alt:false,Ctrl:false,shift:false,window:false},
    flat: {key:"Key2",Alt:false,Ctrl:false,shift:false,window:false},
    undo: {key:"KeyZ",Alt:false,Ctrl:true,shift:false,window:false},
    redo: {key:"KeyZ",Alt:false,Ctrl:true,shift:true,window:false},
  },
  autoSave:null,
  saveOnExit:false,
}


function createWindow () {

  loadFile(__dirname + "/.config")
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 650,
    minHeight: 650,
    minWidth: 800,
    icon:__dirname + "/Logo.png",
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
  win.focus(); //gives focus to main window
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
  win.webContents.send("undo");
}

/*redoes last command if it can.*/
function redo(){

  win.webContents.send("redo")
}

/*Opens save bpm window*/
function BPMWindow(){
  // Create the browser window.
  BPMWin = new BrowserWindow({
    width: 250,
    height: 175,
    alwaysOnTop: false,
    icon:__dirname + "/Logo.png",
    parent:win,
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
    parent:win,
    icon:__dirname + "/Logo.png",
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
  // Create the browser window.
  preWin = new BrowserWindow({
    width: 600,
    height: 400 ,
    alwaysOnTop: false,
    parent:win,
    icon:__dirname + "/Logo.png",
    webPreferences: {
      nodeIntegration: true,

    }
  })

  //preWin.webContents.openDevTools();
  preWin.setMenuBarVisibility(false);
  preWin.setResizable(false);

  // and load the index.html of the app.
  preWin.loadFile('src/preferences.html')
  preWin.show();
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
    width: 150,
    height: 310,
    x:400,
    y:400,
    alwaysOnTop: true,
    icon:__dirname + "/Logo.png",
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

function chordWindow(){

  chordWin = new BrowserWindow({
    width: 400,
    height: 400,
    alwaysOnTop: true,
    icon:__dirname + "/Logo.png",
    webPreferences: {
      nodeIntegration: true,

    }
  })

  //toolsWin.webContents.openDevTools();
  chordWin.setMenuBarVisibility(false);
  chordWin.setResizable(false);
  // and load the index.html of the app.
  chordWin.loadFile('src/chord.html')
  chordWin.show();
}

function titleWindow(){
  // Create the browser window.
  titleWin = new BrowserWindow({
    width: 400,
    height: 160,
    parent:win,
    alwaysOnTop: false,
    icon:__dirname + "/Logo.png",
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

/*saves the current song to a song file using json*/
function saveFile(fileName){
  let data = JSON.stringify(config); //Turns objects into strings.
  fs.writeFile(fileName,data,(err) => {
    if(err){ //cretes error popup
      electron.remote.dialog.showErrorBox("Invalid File",
          err + "Please select a valid file");
      throw err;
    }

  })
}
/*used for loading config file*/
/**Loads file from file fileName
parse it from a json file.
*/
function loadFile(fileName){
  fs.readFile(fileName, (err,data) =>{
    if(err){
      //creates popup here
      electron.remote.dialog.showErrorBox("Invalid File",
          err + " No config file found");
      throw err;
    }
    //loads the config
    config = JSON.parse(data);


  })
}
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

//when preferences are closed
ipcMain.on("config", (event,newConfig) => {
  config = newConfig;
  saveFile(__dirname + "/.config");
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

//opens chordbuilder
//asked to open bpm window
ipcMain.on("chord", (event) => {
  //opens bpm window
  chordWindow();
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

ipcMain.on("move-left",(event) => {
  win.webContents.send("move-left");
})

ipcMain.on("move-right",(event) => {
  win.webContents.send("move-right");
})

ipcMain.on("repeat",(event)=>{
  win.webContents.send("repeat");
})
ipcMain.on("getConfig",(event)=>{
  event.returnValue = config;
})

ipcMain.on("copy",(event) =>{
  win.webContents.send("copy");
})

ipcMain.on("paste",(event) =>{
  win.webContents.send("paste");
})

ipcMain.on("undo",(event) =>{
  win.webContents.send("undo");
})

ipcMain.on("redo",(event) =>{
  win.webContents.send("redo");
})
