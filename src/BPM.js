const electron = require("electron");
const path = require("path");

const cancelBtn = document.getElementById("cancelBtn");
cancelBtn.addEventListener("click",cancel);


function cancel(){
  electron.remote.getCurrentWindow().close();
}

function submit(){
  
}
