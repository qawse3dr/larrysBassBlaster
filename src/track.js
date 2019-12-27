
const electron = require("electron");



//document Elements
const cancelBtn = document.getElementById("cancel");
const addBtn = document.getElementById("add");
const nameText = document.getElementById("nameText");
const instrument = document.getElementById("instrument");
const effect = document.getElementById("effects");


//eventListeners
cancelBtn.addEventListener("click",cancel);
addBtn.addEventListener("click",addTrack);

function addTrack(event){
  if(nameText.value == ""){
    electron.remote.dialog.showErrorBox("Invalid Name",
        "Please Enter A Name"
    )
  } else{
    track = {
      clef:getClef(instrument.value),
      instrument:instrument.value,
      name:nameText.value,
      effects: effect.value,
      notes: []
    }
    electron.ipcRenderer.send("new-track",track);
    cancel();
  }

}


function getClef(name){
  if(name == "Bass"){
    return "Bass";
  } else {
    return "Treble"
  }
}


function cancel(event){
  electron.remote.getCurrentWindow().close();
}
