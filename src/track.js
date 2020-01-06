
const electron = require("electron");


//configs
var config = electron.ipcRenderer.sendSync("getConfig");
var isDarkMode = config.darkMode;
if(isDarkMode == "true"){
  document.getElementById("style").setAttribute("href","../res/css/stylesDark.css")
}

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
    track = {//create new Track
      clef:getClef(instrument.value),
      instrument:instrument.value,
      name:nameText.value,
      effects: "None",
      notes: []
    }

    //sends new track to main.
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
