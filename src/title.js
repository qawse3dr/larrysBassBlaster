const electron = require("electron");
const path = require("path");
const ipcRenderer = electron.ipcRenderer;

const cancelBtn = document.getElementById("cancelBtn");
const submitBtn = document.getElementById("submitBtn");
const titleText = document.getElementById("title-text");

cancelBtn.addEventListener("click",cancel);
submitBtn.addEventListener("click",submit);


/**Cancels change exits with doing nothing*/
function cancel(event){
  electron.remote.getCurrentWindow().close();
}

function submit(){
  if(titleText.value != ""){ //valid input was given
    ipcRenderer.send("send-title-to-main",titleText.value);
    cancel();
  } else {
    electron.remote.dialog.showErrorBox("Invalid Title",
        "Please Enter A Title"
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
