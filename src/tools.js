
const electron = require("electron");

//configs
var config = electron.ipcRenderer.sendSync("getConfig");
var isDarkMode = config.darkMode;
if(isDarkMode == "true"){
  document.getElementById("style").setAttribute("href","../res/css/stylesDark.css")
  document.getElementById("tool-style").setAttribute("href","../res/css/toolsDark.css")
}

/*******ONCLICK FUNCTIONS*********/

/**Sends to main request new note to be made*/
function notePress(element){
  electron.ipcRenderer.send("new-note",element.value);
}

/**Sends to main requesting new rest to be made*/
function restPress(element){
  electron.ipcRenderer.send("new-rest",element.value);
}


/**sends to main which moves current note up one note*/
function moveUp(){
  electron.ipcRenderer.send("move-note-up");
}

/**sends to main moving the note down one*/
function moveDown(){
  electron.ipcRenderer.send("move-note-down");
}

/**requests the current note becomes a flat. if its is a
sharp it over writes it*/
function flat(){
  electron.ipcRenderer.send("flat");
}

/*request the current note becomes a sharp. if it is a flat
it overwrites it*/
function sharp(){
  electron.ipcRenderer.send("sharp");
}

/**toggles if the current note isdotted or not.*/
function dot(){
  electron.ipcRenderer.send("dot");
}

/**deletes the current note*/
function del(){
  electron.ipcRenderer.send("del-note");
}

/**repeats the last note*/
function repeat(){
  electron.ipcRenderer.send("repeat")
}
//shortcuts cuts\
electron.remote.getCurrentWindow().webContents.on('before-input-event', (event, input) => {


  if(input.type == "keyDown"){
    if(input.type == "keyDown"){
      console.log(input.code)
      if(shortcutHandler(input,config.shortcuts.play)){
        play(event)
      } else if(shortcutHandler(input, config.shortcuts.bpm)){
        ipcRenderer.send("open-bpm-window");
      } else if(shortcutHandler(input, config.shortcuts.solo)){
        soloToggle()
      } else if(shortcutHandler(input, config.shortcuts.metronome)){
        metronomeToggle();
      } else if(shortcutHandler(input, config.shortcuts.count)){
        countToggle();
      } else if(shortcutHandler(input, config.shortcuts.currentNoteLeft)){
        electron.ipcRenderer.send("move-left")
      } else if(shortcutHandler(input, config.shortcuts.currentNoteRight)){
        electron.ipcRenderer.send("move-right");
      } else if(shortcutHandler(input, config.shortcuts.shiftUp)){
        electron.ipcRenderer.send("move-note-up");
      } else if(shortcutHandler(input, config.shortcuts.shiftDown)){
        electron.ipcRenderer.send("move-note-down");
      } else if(shortcutHandler(input, config.shortcuts.dot) || shortcutHandler(input,config.shortcuts.dot2)){
        electron.ipcRenderer.send("dot");
     } else if(shortcutHandler(input, config.shortcuts.del) || shortcutHandler(input,config.shortcuts.del2)){
       electron.ipcRenderer.send("del-note")
     } else if(shortcutHandler(input, config.shortcuts.copy)){
       electron.ipcRenderer.send("copy")
     } else if(shortcutHandler(input, config.shortcuts.paste)){
       electron.ipcRenderer.send("paste")
     } else if(shortcutHandler(input, config.shortcuts.repeatLastNote)){
       electron.ipcRenderer.send("repeat")
     } else if(shortcutHandler(input, config.shortcuts.sharp)){
       electron.ipcRenderer.send("sharp");
     } else if(shortcutHandler(input, config.shortcuts.flat)){
       electron.ipcRenderer.send("flat");
     } else if(shortcutHandler(input, config.shortcuts.undo)){
       electron.ipcRenderer.send("undo");
     } else if(shortcutHandler(input, config.shortcuts.redo)){
       electron.ipcRenderer.send("redo");
     }
    }

  }
})

/**Returns if the event is true*/
function shortcutHandler(input,keyCombo){

  return (input.code == keyCombo.key
     && input.shift == keyCombo.shift
     && input.alt == keyCombo.Alt
     && input.control == keyCombo.Ctrl
     )
}


function chordBuilder(){
  electron.ipcRenderer.send("chord")
}
