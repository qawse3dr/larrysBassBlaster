


const electron = require("electron");
const path = require("path");

const playBtn = document.getElementById("Play");
playBtn.addEventListener("click",play);

var isPlaying = false;
var canvas = document.getElementById("song-canvas");
var ctx = canvas.getContext("2d");


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
  return 120;
}
function edit(){

}

function BPM(){

}
