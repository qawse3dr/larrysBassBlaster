const electron = require("electron");
const path = require("path");
const ipcRenderer = electron.ipcRenderer;

//configs
var config = ipcRenderer.sendSync("getConfig");
var isDarkMode = config.darkMode;
if(isDarkMode == "true"){
  document.getElementById("style").setAttribute("href","../res/css/stylesDark.css")
}
