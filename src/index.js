


const electron = require("electron");
const path = require("path");
const ipcRenderer = electron.ipcRenderer;
const tone = require("tone");
const playBtn = document.getElementById("Play");
const midiParser = require("midi-parser-js");
const fs = require("fs");

const volumeSlider = document.getElementById("volume");
//sets the target to the speakers.
var synth = null;
createSynth();

var isPlaying = false;
var song = {
  title: "Angel Beats! - Theme Of SSS",
  bpm: 83,
  tracks:[{
    instrument:"Guitar",
    notes: [{name:"F#4",length:"8n"},{name:"G#4",length:"8n"},{name:"A#4",length:"4n"},
          {name:"F#5",length:"8n"},{name:"F#5",length:"8n"},{name:"F5",length:"8n"},{name:"A#4",length:"8n"},{name:"F#4",length:"8n"},
          {name:"G#4",length:"8n"},{name:"A#4",length:"4n"},{name:"F#4",length:"8n"},{name:"G#4",length:"8n"},{name:"A#4",length:"4n"},
          {name:"D#4",length:"16n"},{name:"F4",length:"16n"},{name:"F#4",length:"6n"},{name:"F4",length:"8n"},{name:"F#4",length:"8n"},{name:"G#4",length:"6n"},{name:"F#4",length:"8n"}
          ,{name:"G#4",length:"6n"},{name:"A#4",length:"8n"},{name:"A#4",length:"4n"},{name:"F#4",length:"4n"},{name:"F#4",length:"8n"},{name:"G#4",length:"8n"},{name:"A#4",length:"4n"},
                  {name:"F#5",length:"8n"},{name:"F#5",length:"8n"},{name:"F5",length:"8n"},{name:"A#4",length:"8n"},{name:"F#4",length:"8n"},
                  {name:"G#4",length:"8n"},{name:"A#4",length:"4n"},{name:"F#4",length:"8n"},{name:"G#4",length:"8n"},{name:"A#4",length:"4n"},
                  {name:"D#4",length:"16n"},{name:"F4",length:"16n"},{name:"F#4",length:"6n"},{name:"F4",length:"8n"},{name:"F#4",length:"8n"},{name:"G#4",length:"6n"},{name:"F#4",length:"8n"}
                  ,{name:"G#4",length:"6n"},{name:"A#4",length:"8n"},{name:"A#4",length:"4n"},{name:"F#4",length:"4n"}]
    },
    {
      instrument:"Bass",
      notes:[{name:"F#2",length:"8n"},{name:"G#2",length:"8n"},{name:"A#2",length:"4n"},
            {name:"F#3",length:"8n"},{name:"F#3",length:"8n"},{name:"F3",length:"8n"},{name:"A#2",length:"8n"},{name:"F#2",length:"8n"},
            {name:"G#2",length:"8n"},{name:"A#2",length:"4n"},{name:"F#2",length:"8n"},{name:"G#2",length:"8n"},{name:"A#2",length:"4n"},
            {name:"D#2",length:"16n"},{name:"F2",length:"16n"},{name:"F#2",length:"6n"},{name:"F2",length:"8n"},{name:"F#2",length:"8n"},{name:"G#4",length:"6n"},{name:"F#4",length:"8n"}
            ,{name:"G#2",length:"6n"},{name:"A#2",length:"8n"},{name:"A#2",length:"4n"},{name:"F#2",length:"4n"},{name:"F#2",length:"8n"},{name:"G#4",length:"8n"},{name:"A#4",length:"4n"},
                    {name:"F#3",length:"8n"},{name:"F#3",length:"8n"},{name:"F3",length:"8n"},{name:"A#2",length:"8n"},{name:"F#2",length:"8n"},
                    {name:"G#2",length:"8n"},{name:"A#2",length:"4n"},{name:"F#2",length:"8n"},{name:"G#2",length:"8n"},{name:"A#2",length:"4n"},
                    {name:"D#2",length:"16n"},{name:"F2",length:"16n"},{name:"F#2",length:"6n"},{name:"F2",length:"8n"},{name:"F#2",length:"8n"},{name:"G#4",length:"6n"},{name:"F#4",length:"8n"}
                    ,{name:"G#2",length:"6n"},{name:"A#2",length:"8n"},{name:"A#2",length:"4n"},{name:"F#2",length:"4n"}]
    }
]
};


var canvas = document.getElementById("song-canvas"); //render
var ctx = canvas.getContext("2d");
var height = 550; //length and width of canvas
var width = 750;

//music vars
var BPM = 120; //The beats per minute of song
var volume = 0;
var isCountOn = false; //if starting count is on.
var metronome = false; //if the metronome is on.
var isSolo = false; //if the instrument is soloing
var currentInstrument = 0;
//sets the rendering item for canvas
setInterval(render,16);

//Button Listener for playing.
playBtn.addEventListener("click",play);


/*********************GRAPHICS************************/
/**Renders the sheetMusic*/
function render(){ //displays the song canvas.

  //Paints Screen
  fillScreen("#d3d3d3")
  /**draws BPM on canvas.*/
  renderBPM();


  /**draws music*/
  drawMusic();
}

/**Resizes the canvas*/
function resizeCanvas(newWidth,newHeight){
  if(newWidth != 0){
    width = newWidth;
    canvas.width = width;
  }
  if(newHeight != 0){
    height = newHeight;
    canvas.height = height;
  }
  //canvas.parentElement.scrollTo(0,0);
}
/**fills the screen with colour colour*/
function fillScreen(colour){
  ctx.fillStyle = colour; //fill screen
  ctx.fillRect(0,0,canvas.width,canvas.height);

}

/**Draws the BPM.*/
function renderBPM(){
  ctx.font = "12px Arial";   //default font.
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.fillText("BPM: " + getBPM(),700,20);
}

/**Draws the sheet music*/
function drawMusic(){

}
/*********************GRAPHICS************************/

function play(event){ //plays the song or stops it.
  if(!isPlaying){
    isPlaying = true;
    playBtn.innerText = "Stop"
    synth.sync();
    //TODO: next add it so many tracks can be played
    for(track in song.tracks){
      console.log(track);
      let delta = 0; //time passed
      for(note in song.tracks[track].notes){ //adds song to queue
        synth.triggerAttackRelease(song.tracks[track].notes[note].name,song.tracks[track].notes[note].length,delta);
        delta += tone.TransportTime(song.tracks[track].notes[note].length);
        //console.log(song.tracks[track].notes[note]);
      }
    }
    tone.Transport.start(tone.now());
  } else{ //shuts off song. need to add in shut off at end of song.
    isPlaying = false;
    playBtn.innerText = "Play"
    synth.unsync();
    tone.Transport.stop();

  }
}
/*********MUSIC FUNCTIONS*************/
/*Creates the synth object*/
function createSynth(){
  if(synth != null) synth.dispose()
  synth = new tone.PolySynth().toMaster();
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

volumeSlider.oninput = () => {
  volume = volumeSlider.value;
  console.log(volume);
  synth.volume.value = volume;
}
/*********MUSIC FUNCTIONS*************/

function edit(){

}

/******************FILE IO************************/
/*saves the current song to a song file using json*/
function saveFile(fileName){
  let data = JSON.stringify(song); //Turns objects into strings.
  fs.writeFile(fileName,data,(err) => {
    if(err){ //cretes error popup
      electron.remote.dialog.showErrorBox("Invalid File",
          err + "Please select a valid file");
      throw err;
    }

  })
}
/**Loads file from file fileName
parse it from a json file.
*/
function loadFile(fileName){
  fs.readFile(fileName, (err,data) =>{
    if(err){
      //creates popup here
      electron.remote.dialog.showErrorBox("Invalid File",
          err + " Please select a valid file");
      throw err;
    }
    //loads the song
    song = JSON.parse(data);
    setBPM(song.bpm);
    setTitle(song.title);

  })
}
/******************FILE IO************************/
function setTitle(title){
  let titleText = document.getElementById("title");
  titleText.innerText = title
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
/********************IPC COMMUNICATIONS*************************/
