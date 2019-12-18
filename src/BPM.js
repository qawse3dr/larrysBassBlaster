const electron = require("electron");
const path = require("path");
const ipcRenderer = electron.ipcRenderer;
const cancelBtn = document.getElementById("cancelBtn");
const bpmText = document.getElementById("BPM-text");
const submitBtn = document.getElementById("submitBtn")

//event listender
cancelBtn.addEventListener("click",cancel);
submitBtn.addEventListener("click",submit);



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
