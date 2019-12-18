


const electron = require("electron");
const path = require("path");
const ipcRenderer = electron.ipcRenderer;
const tone = require("tone");
const playBtn = document.getElementById("Play");
const midiParser = require("midi-parser-js");
const fs = require("fs");

//sets the target to the speakers.
var synth = new tone.Synth().toMaster();

var isPlaying = false;
var song = {
  title: "Angel Beats! - Theme Of SSS",
  bpm: 83,
  notes: [{name:"F#4",length:"8n"},{name:"G#4",length:"8n"},{name:"A#4",length:"4n"},
          {name:"F#5",length:"8n"},{name:"F#5",length:"8n"},{name:"F5",length:"8n"},{name:"A#4",length:"8n"},{name:"F#4",length:"8n"},
          {name:"G#4",length:"8n"},{name:"A#4",length:"4n"},{name:"F#4",length:"8n"},{name:"G#4",length:"8n"},{name:"A#4",length:"4n"},
          {name:"D#4",length:"16n"},{name:"F4",length:"16n"},{name:"F#4",length:"6n"},{name:"F4",length:"8n"},{name:"F#4",length:"8n"},{name:"G#4",length:"6n"},{name:"F#4",length:"8n"}
          ,{name:"G#4",length:"6n"},{name:"A#4",length:"8n"},{name:"A#4",length:"4n"},{name:"F#4",length:"4n"},{name:"F#4",length:"8n"},{name:"G#4",length:"8n"},{name:"A#4",length:"4n"},
                  {name:"F#5",length:"8n"},{name:"F#5",length:"8n"},{name:"F5",length:"8n"},{name:"A#4",length:"8n"},{name:"F#4",length:"8n"},
                  {name:"G#4",length:"8n"},{name:"A#4",length:"4n"},{name:"F#4",length:"8n"},{name:"G#4",length:"8n"},{name:"A#4",length:"4n"},
                  {name:"D#4",length:"16n"},{name:"F4",length:"16n"},{name:"F#4",length:"6n"},{name:"F4",length:"8n"},{name:"F#4",length:"8n"},{name:"G#4",length:"6n"},{name:"F#4",length:"8n"}
                  ,{name:"G#4",length:"6n"},{name:"A#4",length:"8n"},{name:"A#4",length:"4n"},{name:"F#4",length:"4n"}]
};
var canvas = document.getElementById("song-canvas"); //render
var ctx = canvas.getContext("2d");
var BPM = 120; //The beats per minute of song

//sets the rendering item for canvas
setInterval(render,16);
playBtn.addEventListener("click",play);


function render(){ //displays the song canvas.
  ctx.fillStyle = "#d3d3d3";
  ctx.fillRect(0,0,750,550);
  ctx.font = "12px Arial";
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.fillText("BPM: " + getBPM(),700,20);
}
/*drawcanvas*/


function play(event){ //plays the song or stops it.
  if(!isPlaying){
    isPlaying = true;
    playBtn.innerText = "Stop"
    let delta = tone.now(); //time passed
    for(note in song.notes){ //adds song to queue
      synth.triggerAttackRelease(song.notes[note].name,song.notes[note].length,delta);
      delta += tone.TransportTime(song.notes[note].length);
      console.log(song.notes[note]);
    }

  } else{ //shuts off song. need to add in shut off at end of song.
    isPlaying = false;
    playBtn.innerText = "Play"
    synth.dispose();
     synth = new tone.Synth().toMaster();

  }
}

/*Gets the BPM*/
function getBPM(){
  return BPM;
}
/*Sets the BPM to local var and to the synth*/
function setBPM(bpm){
  BPM = bpm
  tone.Transport.bpm.value=BPM;
}


function edit(){

}
function saveFile(fileName){
  let data = JSON.stringify(song);
  fs.writeFile(fileName,data,(err) => {
    if(err){
      //popup
      throw err;
    }
    console.log("writen");
  })
}
function loadFile(fileName){
  fs.readFile(fileName, (err,data) =>{
    if(err){
      //do popup here
      throw err;
    }
    song = JSON.parse(data);
    setBPM(song.bpm);
    setTitle(song.title);

  })
}

function setTitle(title){
  let titleText = document.getElementById("title");
  titleText.innerText = title
}

/**SLEEP FUNCTIONS FROM
https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
AUTHOR: Dan Dascalescu
*/
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/********************IPC COMMUNICATIONS*************************/
ipcRenderer.on("send-bpm", (event,bpm) => { //changes bpm to new given bpm
  setBPM(bpm);

})

//loading the JSON obj from file listener
ipcRenderer.on("load-file", (event,fileName) =>{ //loads a midi file in with given name
  loadFile(fileName);
})

//Listener for saving JSON file.
ipcRenderer.on("save-file", (event,fileName) => {
  saveFile(fileName);
  console.log(fileName)
  console.log("saved")
})
