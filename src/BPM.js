const electron = require("electron");
const path = require("path");
const ipcRenderer = electron.ipcRenderer;

//html elements
const cancelBtn = document.getElementById("cancelBtn");
const bpmText = document.getElementById("BPM-text");
const submitBtn = document.getElementById("submitBtn")

//event listender
cancelBtn.addEventListener("click",cancel);
submitBtn.addEventListener("click",submit);

//configs
var config = ipcRenderer.sendSync("getConfig");
var isDarkMode = config.darkMode;
if(isDarkMode == "true"){
  document.getElementById("style").setAttribute("href","../res/css/stylesDark.css")
}

//event listener functions
function cancel(){
  electron.remote.getCurrentWindow().close();
}

function submit(){
  if(bpmText.value != 0 && bpmText.value <= 300){ //valid input was given
    ipcRenderer.send("send-bpm-to-main",Number(bpmText.value));
    cancel();
  } else {
    electron.remote.dialog.showErrorBox("Invalid BPM",
        "Invalid BPM was entered please enter one\n 1-300"
    )

  }
}

/*****keyboard shortcuts************/
electron.remote.getCurrentWindow().webContents.on('before-input-event', (event, input) => {

  if(input.type == "keyDown"){
    console.log(input.code)
    switch(input.code){
      case "Enter":
        submit()
        break;
      case "Escape":
        cancel();
        break;
    }
  }
})
/*******keyboard shortcuts*********/
