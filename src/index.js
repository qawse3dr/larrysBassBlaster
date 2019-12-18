


const electron = require("electron");
const path = require("path");
const ipcRenderer = electron.ipcRenderer;

const playBtn = document.getElementById("Play");
playBtn.addEventListener("click",play);

var isPlaying = false;
var canvas = document.getElementById("song-canvas");
var ctx = canvas.getContext("2d");
var BPM = 120; //The beats per minute of song

setInterval(render,16);

function render(){
  ctx.fillStyle = "#d3d3d3";
  ctx.fillRect(0,0,750,550);
  ctx.font = "12px Arial";
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.fillText("BPM: " + getBPM(),700,20);
}
/*drawcanvas*/

function play(event){
  if(!isPlaying){
    isPlaying = true;
    playBtn.innerText = "Stop"
  } else{
    isPlaying = false;
    playBtn.innerText = "Play"
  }
}

function getBPM(){
  return BPM;
}
function edit(){

}

function BPM(){

}


/********************IPC COMMUNICATIONS*************************/
ipcRenderer.on("send-bpm", (event,bpm) => { //changes bpm to new given bpm
  BPM = bpm;
})
