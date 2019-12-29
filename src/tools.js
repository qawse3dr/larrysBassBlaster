
const electron = require("electron");



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
    console.log(input.code)
    switch(input.code){
      case "ArrowUp":
        electron.ipcRenderer.send("move-note-up");
        break;
      case "ArrowDown":
        electron.ipcRenderer.send("move-note-down");
        break;
      case "ArrowRight":
        electron.ipcRenderer.send("move-right");
        break;
      case "ArrowLeft":
        electron.ipcRenderer.send("move-left")
        break;
      case "NumpadDecimal":
      case "Period":
        electron.ipcRenderer.send("dot");
        break;
      case "Backspace":
      case "Delete":
        electron.ipcRenderer.send("del-note")
        break;
      case "KeyR":
        electron.ipcRenderer.send("repeat")
        break;
    }
  }
})
