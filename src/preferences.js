const electron = require("electron");
const path = require("path");
const ipcRenderer = electron.ipcRenderer;

//configs
var config = ipcRenderer.sendSync("getConfig");
var isDarkMode = config.darkMode;
if(isDarkMode == "true"){
  document.getElementById("style").setAttribute("href","../res/css/stylesDark.css")
}

const autoSave = document.getElementById("autoSave");
const saveOnExit = document.getElementById("saveOnExit");
const styleDrop = document.getElementById("selectedStyle");
const generalClass = document.getElementById("general")
const shortcut = document.getElementById("shortcut");
const styleClass = document.getElementById("styleId");
const shortcutButtons = document.getElementsByClassName("shortcutButton")


//listeners
saveOnExit.addEventListener("change", (event) => {
  config.saveOnExit = saveOnExit.value
})
autoSave.addEventListener("change", (event) => {
  config.autoSave = autoSave.value
  console.log(config.autoSave)
})
styleDrop.addEventListener("change", (event) => {
  config.darkMode = styleDrop.value
})
//used for changing the shortcut key
var activeShortcut = null;
general()
function general(){
  activeShortcut = null;
  generalClass.style.visibility = "visible";
  shortcut.style.visibility = "hidden";
  styleClass.style.visibility = "hidden";
  saveOnExit.value = config.saveOnExit;
  autoSave.value = config.autoSave;
}

function shortcuts(){
  generalClass.style.visibility = "hidden";
  shortcut.style.visibility = "visible";
  styleClass.style.visibility = "hidden";
  loadShortcutValues();
}

function styleOnclick(){
  activeShortcut = null;
  generalClass.style.visibility = "hidden";
  shortcut.style.visibility = "hidden";
  styleClass.style.visibility = "visible";
  styleDrop.value = config.darkMode + ""
}

function shortCutButton(element){
  activeShortcut = element
}

function loadShortcutValues(){

  for(let i = 0; i < shortcutButtons.length;i++){

    switch(shortcutButtons[i].value){
      case "play":
        shortcutButtons[i].innerText = shortcutToString(config.shortcuts.play)
        break;
      case "bpmWindow":
        shortcutButtons[i].innerText = shortcutToString(config.shortcuts.bpm)
        break;
      case "solo":
        shortcutButtons[i].innerText = shortcutToString(config.shortcuts.solo)
        break;
      case "metronome":
        shortcutButtons[i].innerText = shortcutToString(config.shortcuts.metronome)
        break;
      case "countIn":
        shortcutButtons[i].innerText = shortcutToString(config.shortcuts.count)
        break;
      case "shiftLeft":
        shortcutButtons[i].innerText = shortcutToString(config.shortcuts.currentNoteLeft)
        break;
      case "shiftRight":
        shortcutButtons[i].innerText = shortcutToString(config.shortcuts.currentNoteRight)
        break;
      case "shiftUp":
        shortcutButtons[i].innerText = shortcutToString(config.shortcuts.shiftUp)
        break;
      case "shiftDown":
        shortcutButtons[i].innerText = shortcutToString(config.shortcuts.shiftDown)
        break;
      case "dot":
        shortcutButtons[i].innerText = shortcutToString(config.shortcuts.dot)
        break;
      case "del":
        shortcutButtons[i].innerText = shortcutToString(config.shortcuts.del)
        break;
      case "repeat":
        shortcutButtons[i].innerText = shortcutToString(config.shortcuts.repeatLastNote)
        break;
      case "copy":
        shortcutButtons[i].innerText = shortcutToString(config.shortcuts.copy)
        break;
      case "paste":
        shortcutButtons[i].innerText = shortcutToString(config.shortcuts.paste)
        break;
      case "flat":
        shortcutButtons[i].innerText = shortcutToString(config.shortcuts.flat)
        break;
      case "sharp":
        shortcutButtons[i].innerText = shortcutToString(config.shortcuts.sharp)
        break;

    }

  }
}

function shortcutToString(shortcut){
  let str = "unset";
  if(shortcut.key != ""){
    str = shortcut.key;
  }
  if(shortcut.Alt){
    str += " + Alt";
  }
  if(shortcut.Ctrl){
    str += " + Ctrl";
  }
  if(shortcut.shift){
    str += " + Shift";
  }
  return str;
}

/**Returns if the event is true*/
function shortcutHandler(input){

  switch(activeShortcut.value){
    case "play":
      setShortcut(config.shortcuts.play,input)
      break;
    case "bpmWindow":
      setShortcut(config.shortcuts.bpm,input)
      break;
    case "solo":
      setShortcut(config.shortcuts.solo,input)
      break;
    case "metronome":
      setShortcut(config.shortcuts.metronome,input)
      break;
    case "countIn":
      setShortcut(config.shortcuts.count,input)
      break;
    case "shiftLeft":
      setShortcut(config.shortcuts.currentNoteLeft,input)
      break;
    case "shiftRight":
      setShortcut(config.shortcuts.currentNoteRight,input)
      break;
    case "shiftUp":
      setShortcut(config.shortcuts.shiftUp,input)
      break;
    case "shiftDown":
      setShortcut(config.shortcuts.shiftDown,input)
      break;
    case "dot":
      setShortcut(config.shortcuts.dot,input)
      break;
    case "del":
      setShortcut(config.shortcuts.del,input)
      break;
    case "repeat":
      setShortcut(config.shortcuts.repeatLastNote,input)
      break;
    case "copy":
      setShortcut(config.shortcuts.copy,input)
      break;
    case "paste":
      ssetShortcut(config.shortcuts.paste,input)
      break;
    case "flat":
      setShortcut(config.shortcuts.flat,input)
      break;
    case "sharp":
      setShortcut(config.shortcuts.sharp,input)
      break;

  }
  activeShortcut = null;
  loadShortcutValues();
  console.log(input.code)
  console.log(input.shift)
}

function setShortcut(shortcutElement,input){
  shortcutElement.key = input.code;
  shortcutElement.shift = input.shift;
  shortcutElement.Ctrl = input.control;
  shortcutElement.Alt = input.alt;

}
//shortcuts cuts\
electron.remote.getCurrentWindow().webContents.on('before-input-event', (event, input) => {

  if(input.code != "ShiftLeft" &&
     input.code != "ShiftRight" &&
     input.code != "ControlLeft" &&
     input.code != "ControlRight" &&
     input.code != "AltLeft" &&
     input.code != "AltRight"){
       if(activeShortcut != null){
           shortcutHandler(input)
       }
     }
})

electron.remote.getCurrentWindow().webContents.on("close", () => {
  ipcRenderer.send("config",config)
})
