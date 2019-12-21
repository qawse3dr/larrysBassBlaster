

//includes
const electron = require("electron");
const path = require("path");
const ipcRenderer = electron.ipcRenderer;
const tone = require("tone");
const fs = require("fs");

//UI Elements

//buttons
const playBtn = document.getElementById("play-btn");
const countBtn = document.getElementById("count-btn");
const metronomeBtn = document.getElementById("metronome-btn");
const soloBtn = document.getElementById("solo-btn");

const volumeSlider = document.getElementById("volume"); //slider
const canvas = document.getElementById("song-canvas"); //render

//Button Listener for playing.
playBtn.addEventListener("click",play);
metronomeBtn.addEventListener("click",metronomeToggle);
countBtn.addEventListener("click",countToggle);
soloBtn.addEventListener("click",soloToggle);


//Setting up graphics
var ctx = canvas.getContext("2d");
var height = canvas.height; //length and width of canvas
var width = canvas.width;


//sets the target to the speakers.
var synth = null;
createSynth();



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




//music vars
var BPM = 120; //The beats per minute of song
var volume = 0;
var isPlaying = false;
var isCountOn = false; //if starting count is on.
var metronome = false; //if the metronome is on.
var isSolo = false; //if the instrument is soloing
var currentInstrument = 0;
//sets the rendering item for canvas
setInterval(render,16);

//loads defualt Song.
setBPM(song.bpm);
setTitle(song.title);


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
//plays the song when play is clicked or stops it if its already playing
function play(event){ //plays the song or stops it.
  if(!isPlaying){
    playSong();
  } else{ //shuts off song. need to add in shut off at end of song.
    stopPlay();



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


/*************BUTTON onclicks*********************/
volumeSlider.oninput = () => {
  volume = volumeSlider.value;
  console.log(volume);
  synth.volume.value = volume;
}

function playSong(){
  isPlaying = true;
  playBtn.innerText = "Stop"
  let startOffset = (isCountOn) ? tone.Time("4n")*8 : 0; //offset for start count
  let maxDelta = 0; //gets the length of the song.
  console.log(startOffset)
  synth.sync(); //start syncing the tracks

  if(isCountOn){
    for(let i = 0; i < 8; i++)
    synth.triggerAttackRelease("C2","32n",tone.Time("4n")*i,1);
  }
  //loops through and syncs tracks
  for(track in song.tracks){
    if(isSolo){ //skip other tracks if you are soloing
      if(track != currentInstrument){
        continue;
      }
    }
    let delta = startOffset; //time passed
    for(note in song.tracks[track].notes){ //adds song to queue
      synth.triggerAttackRelease(song.tracks[track].notes[note].name,song.tracks[track].notes[note].length,delta,0.5);
      delta += tone.Time(song.tracks[track].notes[note].length); //add offset
      //console.log(song.tracks[track].notes[note]);
      if(maxDelta<delta) maxDelta = delta;
    }

    }
    if(metronome){ //metronome is enabled
      let delta = startOffset;
      for(let ticks = 0; ticks < getTimeInBeats(maxDelta); ticks ++){ //converts time to quarter notes
        synth.triggerAttackRelease("C2","32n",delta,1);
        delta += tone.Time("4n"); //add offset
      }
  }
  tone.Transport.start();
}

/**stops the notes from playing*/
function stopPlay(){
  isPlaying = false;
  playBtn.innerText = "Play"
  tone.Transport.stop();
  synth.unsync();
  createSynth()
}

/*Converts the time into how many beats it will take.*/
function getTimeInBeats(time){
  return time/60*BPM;
}

/*toggle the boolean metronome  also changing colour of button*/
function metronomeToggle(){
  metronome = (metronome) ? false : true;
  if(metronome){
    metronomeBtn.style.background="#4b81a6"
  } else {
    metronomeBtn.style.background="lavender";
  }
}

/*toggles the solo boolean  also changing colour of button*/
function soloToggle(){
  isSolo = (isSolo) ? false : true;
  if(isSolo){
    soloBtn.style.background="#4b81a6"
  } else {
    soloBtn.style.background="lavender";
  }
}

/*toggle the count boolean also changing colour of button*/
function countToggle(){
  isCountOn = (isCountOn) ? false : true;
  if(isCountOn){
    countBtn.style.background="#4b81a6"
  } else {
    countBtn.style.background="lavender";
  }
}

/*********MUSIC FUNCTIONS*************/



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
