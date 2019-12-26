

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
canvas.addEventListener("click",canvasClick);
window.addEventListener("resize", resize)


//Setting up graphics
var ctx = canvas.getContext("2d");
var height = canvas.height; //length and width of canvas
var width = canvas.width;
//setting up spriteSheet containing music notes and symbols
var spriteSheet = new Image;
spriteSheet.src = "../res/images/musicNotes.png";
//enum for where notes are located in spritesheet;
var Notes = {
  wholeNote: 0,
  halfNote: 32,
  quarterNote: 64,
  eigthNote: 96,
  sixteenthNote: 128,
}
//sets the target to the speakers.
var synth = null;
createSynth();


/*song object will hold everything that the song needs.
will also be the json object that is saved and loaded.
this is an example song that will be loaded at startup.
*/
var song = {
  title: "Angel Beats! - Theme Of SSS",
  bpm: 83,

  tracks:[{
    clef:"Treble",
    instrument:"Guitar",
    notes: [{name:"F#4",length:"8n"},{name:"G#4",length:"8n"},{name:"A#4",length:"4n"},
          {name:"F#5",length:"8n"},{name:"F#5",length:"8n"},{name:"F5",length:"8n"},{name:"A#4",length:"8n"},{name:"G#4",length:"8n"},
          {name:"A#4",length:"8n"},{name:"F#4",length:"4n"},{name:"G#4",length:"8n"},{name:"A#4",length:"8n"},{name:"F#4",length:"4n"},
          {name:"D#4",length:"16n"},{name:"F4",length:"16n"},{name:"F#4",length:"4n."},{name:"F4",length:"8n"},{name:"F#4",length:"8n"},{name:"G#4",length:"4n."},{name:"F#4",length:"8n"}
          ,{name:"G#4",length:"4n."},{name:"A#4",length:"8n"},{name:"A#4",length:"4n"},{name:"F#4",length:"4n"},{name:"F#4",length:"8n"},{name:"G#4",length:"8n"},{name:"A#4",length:"4n"},
                  {name:"F#5",length:"8n"},{name:"F#5",length:"8n"},{name:"F5",length:"8n"},{name:"A#4",length:"8n"},{name:"F#4",length:"8n"},
                  {name:"G#4",length:"8n"},{name:"A#4",length:"4n"},{name:"F#4",length:"8n"},{name:"G#4",length:"8n"},{name:"A#4",length:"4n"},
                  {name:"D#4",length:"16n"},{name:"F4",length:"16n"},{name:"F#4",length:"4n."},{name:"F4",length:"8n"},{name:"F#4",length:"8n"},{name:"G#4",length:"4n."},{name:"F#4",length:"8n"}
                  ,{name:"G#4",length:"4n."},{name:"A#4",length:"8n"},{name:"A#4",length:"4n"},{name:"F#4",length:"4n"}]
    },
    {
      clef:"Bass",
      instrument:"Bass",
      notes:[{name:"F#3",length:"8n"},{name:"G#3",length:"8n"},{name:"A#3",length:"4n"},
            {name:"F#4",length:"8n"},{name:"F#4",length:"8n"},{name:"F4",length:"8n"},{name:"A#3",length:"8n"},{name:"G#3",length:"8n"},
            {name:"A#3",length:"8n"},{name:"F#3",length:"4n"},{name:"G#3",length:"8n"},{name:"A#3",length:"8n"},{name:"F#3",length:"4n"},
            {name:"D#3",length:"16n"},{name:"F3",length:"16n"},{name:"F#3",length:"4n."},{name:"F3",length:"8n"},{name:"F#3",length:"8n"},{name:"G#3",length:"4n."},{name:"F#3",length:"8n"}
            ,{name:"G#3",length:"4n."},{name:"A#3",length:"8n"},{name:"A#3",length:"4n"},{name:"F#3",length:"4n"},{name:"F#3",length:"8n"},{name:"G#3",length:"8n"},{name:"A#3",length:"4n"},
                    {name:"F#4",length:"8n"},{name:"F#4",length:"8n"},{name:"F4",length:"8n"},{name:"A#3",length:"8n"},{name:"F#3",length:"8n"},
                    {name:"G#3",length:"8n"},{name:"A#3",length:"4n"},{name:"F#3",length:"8n"},{name:"G#3",length:"8n"},{name:"A#3",length:"4n"},
                    {name:"D#3",length:"16n"},{name:"F3",length:"16n"},{name:"F#3",length:"4n."},{name:"F3",length:"8n"},{name:"F#3",length:"8n"},{name:"G#3",length:"4n."},{name:"F#3",length:"8n"}
                    ,{name:"G#3",length:"4n."},{name:"A#3",length:"8n"},{name:"A#3",length:"4n"},{name:"F#3",length:"4n"}]
    }
]
};

var noteRender = [
{
  noteNumber:0,
  rect:{
    x:0,
    y:0,
    width:0,
    height:0
  },
  img:null
}
];


//music vars
var BPM = 120; //The beats per minute of song
var volume = 0;
var isPlaying = false;
var isCountOn = false; //if starting count is on.
var metronome = false; //if the metronome is on.
var isSolo = false; //if the instrument is soloing
var currentInstrument = 0;
var currentNote = 0;
var currentTimeouts = [];
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
  ctx.fillText("BPM: " + getBPM(),canvas.width-100,20);
}

/**Draws the sheet music*/
function drawMusic(){
  //the current width the notes take up on the current staff
  let xOffset = 40; //x offset
  let yOffset = 100; //y offset
  let noteSpacing = 48; //how far apart the notes are
  let spaceSize = 10; // how far apart the lines are
  let screenHeight = 500; //the parents screenHeight
  let barCounter = 0;//used to see where the bar lines should be drawn

  drawStaff(yOffset,spaceSize); //draws a staff at an offset on y=0
  for(notes in song.tracks[currentInstrument].notes){
    if(notes == currentNote){//drawing current note indicator
      /*checks if its still on the screen*/

      if(yOffset >= 200+canvas.parentElement.scrollTop && isPlaying){
        canvas.parentElement.scrollTop += 10
      }
      ctx.beginPath();
      ctx.fillStyle = "#000000";
      ctx.moveTo(xOffset+10,yOffset-5);
      ctx.lineTo(xOffset+10,yOffset+spaceSize*5);
      ctx.closePath();
      ctx.stroke();
    }
    drawNote(notes,xOffset,yOffset);

    barCounter += 1/Number(song.tracks[currentInstrument].notes[notes].length.replace("n",""));
    if(barCounter >= 1){
      barCounter = 0;
      drawBar(xOffset,yOffset,spaceSize);
    }
    xOffset += noteSpacing; //adds space for next note
    if(xOffset >= (width-80)){
      xOffset = 40;
      //creates new staff
      yOffset += spaceSize*5 + 75;
      if(yOffset+50 > height){ //increase canvas size.
        resizeCanvas(0,yOffset+spaceSize*5+50);
      }
      drawStaff(yOffset,spaceSize);

    }
  }


}
/**draws a barline*/
function drawBar(xOffset,yOffset,spaceSize){
    ctx.beginPath();
    ctx.moveTo(xOffset + 30,yOffset);
    ctx.lineTo(xOffset + 30,yOffset + spaceSize*4);
    ctx.stroke();
    ctx.closePath();
}
/**Draws a staff with the offset of y=offset*/
function drawStaff(offset,spaceSize){


  for(let y = offset; y < offset + spaceSize*5; y += spaceSize  ){
    ctx.beginPath();
    ctx.moveTo(40,y);
    ctx.lineTo(width - 30 ,y);
    ctx.stroke();
    ctx.closePath();
  }

}

/**Draws note given by index note in song in the current track.*/
function drawNote(note,xOffset,yOffset){
  let noteOffset = 0; //how much to shift the y offset for the note.
  let noteType = 0;  //the shift in the spriteSheet needed for note type.
  let isDotted = false;
  let isRest = 0; //if its a rest it will be shifted 32 pixels down in the sprite sheet
  //gets note offsets
  for(let i = 0;i < song.tracks[currentInstrument].notes[notes].name.length;i++){
    let noteLetter = song.tracks[currentInstrument].notes[notes].name[i];
    if(i == 0){
      switch(noteLetter){
        case "A":
          noteOffset = -35;
          break;
        case "B":
          noteOffset = -40;
          break;
        case "C":
          noteOffset = -10;
          break;
        case "D":
          noteOffset = -15;
          break;
        case "E":
          noteOffset = -20;
          break;
        case "F":
          noteOffset = -25;
          break;
        case "G":
          noteOffset = -30;
          break;
      }
    } else if([0,1,2,3,4,5,6,7].includes(Number(noteLetter))){

      let offsets = [140,105,70,35,0,-35,-70]

      noteOffset += offsets[Number(noteLetter)];
      if(song.tracks[currentInstrument].clef == "Bass"){
        noteOffset -= 25
        //bass is an octave down plus shift
      }


    }

  }
  if(song.tracks[currentInstrument].notes[notes].name == "r"){
    isRest = 1;
    noteOffset = 5;
  } else if(song.tracks[currentInstrument].notes[notes].name.includes("#")){
    drawSymbol("#", xOffset,yOffset,noteOffset)
  } else if(song.tracks[currentInstrument].notes[notes].name.includes("b")){
    drawSymbol("b", xOffset,yOffset,noteOffset)
  }

  //gets note type
  switch(song.tracks[currentInstrument].notes[note].length){
    case "1n":
      noteType = Notes.wholeNote;
      break;
    case "1n.":
      noteType = Notes.wholeNote;
      isDotted = true;
      break;
    case "2n":
      noteType = Notes.halfNote;
      break;
    case "2n.":
      noteType = Notes.halfNote;
    case "4n":
      noteType = Notes.quarterNote;
      break;
    case "4n.":
      noteType = Notes.quarterNote;
      isDotted = true;
      break;
    case "8n":
      noteType = Notes.eigthNote;
      break;
    case "8n.":
      noteType = Notes.eigthNote;
    case "16n":
      noteType = Notes.sixteenthNote;
      break;
  }
  if(notes ==0)
  console.log(noteOffset)
  //draw lines for note if its off the staff
  if(noteOffset < -5){
    for(let lines = -10; lines >= noteOffset+20; lines -= 10){
      ctx.beginPath();
      ctx.moveTo(xOffset,yOffset+lines);
      ctx.lineTo(xOffset+25,yOffset+lines);
      ctx.stroke();
      ctx.closePath();
    }
  }
  else if(noteOffset > 20){
    for(let lines = 40; lines <= noteOffset+30; lines += 10){
        console.log(noteOffset)
      ctx.beginPath();
      ctx.moveTo(xOffset-5,yOffset+lines);
      ctx.lineTo(xOffset+20,yOffset+lines);
      ctx.stroke();
      ctx.closePath();
    }

  }
  if(noteOffset <= 20 && isRest != 1){ //flips notes
    isRest= 2
    noteOffset += 18
  }
  ctx.drawImage(spriteSheet,noteType,32*isRest,32,32,xOffset,yOffset + noteOffset,32,32);

  if(isDotted){
    ctx.beginPath();

    ctx.arc(xOffset+20, yOffset+25 + noteOffset, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
  }
}

/**draws the symbol symbol beside the note to the left*/
function drawSymbol(symbol, xOffset,yOffset,noteShift){
  ctx.font = "12px Arial";   //default font.
  ctx.fillStyle = "black";
  ctx.textAlign = "center";

  ctx.fillText(symbol,xOffset-5,yOffset+noteShift+25);
}

/*********************GRAPHICS************************/
//plays the song when play is clicked or stops it if its already playing
function play(event){ //plays the song or stops it.
  if(!isPlaying){
    playSong();
  } else{ //shuts off the song. need to add in shut off at end of song.
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
  /*Sets the BPM to local var and to the synth*/
}
function setBPM(bpm){
  BPM = bpm
  tone.Transport.bpm.value=BPM;
}


/*************BUTTON onclicks*********************/
volumeSlider.oninput = () => {
  volume = volumeSlider.value;
  synth.volume.value = volume;
}

function playSong(){
  isPlaying = true;
  playBtn.innerText = "Stop"
  let timeoutOffsets = [];
  let startOffset = (isCountOn) ? tone.Time("4n")*8 : 0; //offset for start count
  let maxDelta = 0; //gets the length of the song.
  synth.sync(); //start syncing the tracks

  if(isCountOn){
    for(let i = 0; i < 8; i++)
    synth.triggerAttackRelease("C2","32n",tone.Time("4n")*i,1);
  }
  //loops through and syncs tracks
  if(currentNote >= song.tracks[currentInstrument].notes.length){
    currentNote = 0;
    canvas.parentElement.scrollTop = 0
  }
  for(track in song.tracks){
    if(isSolo){ //skip other tracks if you are soloing
      if(track != currentInstrument){
        continue;
      }
    }
    let delta = startOffset; //time passed
    for(let note = currentNote; note < song.tracks[track].notes.length;note++){ //adds song to queue
      if(song.tracks[track].notes[note].name !== "r"){
        synth.triggerAttackRelease(song.tracks[track].notes[note].name,song.tracks[track].notes[note].length,delta,0.5);
        //console.log(song.tracks[track].notes[note]);
      }

      delta += tone.Time(song.tracks[track].notes[note].length); //add offset

      if(track == currentInstrument){ //setsvar isCountOn = false; //if starting count is on.
        timeoutOffsets.push(delta);
      }
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
  for(time in timeoutOffsets){ //sets the timer for changing notes
    currentTimeouts.push(setTimeout( () => {
      currentNote++;
      if(currentNote == song.tracks[currentInstrument].notes.length)
      stopPlay();

    }, timeoutOffsets[time]*1000));
  }
  tone.Transport.start();

}

/**stops the notes from playing*/
function stopPlay(){
  isPlaying = false;
  playBtn.innerText = "Play"
  tone.Transport.stop();
  synth.unsync();
  createSynth();
  currentTimeouts.forEach(timeout => {
    clearTimeout(timeout);
  });
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
  //if it is playing it stops and restarts the song with the new feature
  if(isPlaying){
    stopPlay();
    playSong();
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
  //if it is playing it stops and restarts the song with the new feature
  if(isPlaying){
    stopPlay();
    playSong();
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
  //if it is playing it stops and restarts the song with the new feature
  if(isPlaying){
    stopPlay();
    playSong();
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

/*****************DOCUEMNT interaction************/
function setTitle(title){
  let titleText = document.getElementById("title");
  titleText.innerText = title
}

function canvasClick(event){

  let canvasRect = canvas.getBoundingClientRect();
  let mouseX = event.clientX - canvasRect.left;
  let mouseY = event.clientY - canvasRect.top;

  changeCurrentNote(mouseX,mouseY+canvas.parentElement.scrollTop)
}

function changeCurrentNote(mouseX,mouseY){
    console.log("X: "+ mouseX +" y "+ mouseY)


}

function resize(event){
   resizeCanvas(canvas.parentElement.offsetWidth,10);
   canvas.parentElement.style.height = Math.floor(window.innerHeight*0.85 ) + "px";

   if(canvas.height < Number(canvas.parentElement.style.height.replace("px",""))){
     resizeCanvas(0,Number(canvas.parentElement.style.height.replace("px","")));

   }
}
/********************IPC COMMUNICATIONS*************************/
ipcRenderer.on("send-bpm", (event,bpm) => { //changes bpm to new given bpm
  setBPM(bpm);
  //if it is playing it stops and restarts the song with the new feature
  if(isPlaying){
    stopPlay();
    playSong();
  }
})

//loading the JSON obj from file listener
ipcRenderer.on("load-file", (event,fileName) => {
  loadFile(fileName);
})

//Listener for saving JSON file.
ipcRenderer.on("save-file", (event,fileName) => {
  saveFile(fileName);
  console.log(fileName)
  console.log("saved")
})
/********************IPC COMMUNICATIONS*************************/


/*****keyboard shortcuts************/
electron.remote.getCurrentWindow().webContents.on('before-input-event', (event, input) => {

  if(input.type == "keyDown" && input.control){
    if(input.code == "KeyS"){
      ipcRenderer.send("save");
    }
  } else if(input.type == "keyDown"){
    console.log(input.code)
    switch(input.code){
      case "KeyP":
        play(event)
        break;
      case "KeyB":
        ipcRenderer.send("open-bpm-window");
        break;
      case "KeyS":
        soloToggle()
        break;
      case "KeyM":
        metronomeToggle();
        break;
      case "KeyC":
        countToggle();
        break;
      case "ArrowLeft":
        if(currentNote > 0){
          currentNote--;
        }
        if(isPlaying){
          play(event);
          play(event);
        }
        break;
      case "ArrowRight":
        if(currentNote < song.tracks[currentInstrument].notes.length -1){
          currentNote++;
        }
        if(isPlaying){
          play(event);
          play(event);
        }
        break;
      case "ArrowUp":
        currentNote = 0;
        canvas.parentElement.scrollTop = 0;
        break;
    }
  }
})
/*******keyboard shortcuts*********/
