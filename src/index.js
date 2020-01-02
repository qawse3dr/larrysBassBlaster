

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
const trackDropdown = document.getElementById("track-dropdown")


//Button Listener for playing.
playBtn.addEventListener("click",play);
metronomeBtn.addEventListener("click",metronomeToggle);
countBtn.addEventListener("click",countToggle);
soloBtn.addEventListener("click",soloToggle);
canvas.addEventListener("click",canvasClick);
window.addEventListener("resize", resize)
trackDropdown.addEventListener("change",changeTrack)


/*holds operations done by user and the data added or changed
each operation has a name and data
data for each operation is unique*/
var operation = []
var operationIndex = -1; //allows for undoing and redoing operations
var ignoreOperation = false;
var config = ipcRenderer.sendSync("getConfig");
var isDarkMode = config.darkMode;
if(isDarkMode){
  document.getElementById("style").setAttribute("href","../res/css/stylesDark.css")
}
//Setting up graphics
var ctx = canvas.getContext("2d");
var height = canvas.height; //length and width of canvas
var width = canvas.width;
//setting up spriteSheet containing music notes and symbols
var spriteSheet = new Image;
if(isDarkMode){
  spriteSheet.src = "../res/images/musicNotesDark.png";
}
else{
  spriteSheet.src = "../res/images/musicNotes.png";
}


var mouseX = 0;
var mouseY = 0;
var isClicked = false;
var copyStart = -1;
var copyEnd = -1;
var copyTrack = -1
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
  title: "Title",
  bpm: 120,
  tracks:[
    {
      name:"Bass",
      instrument:"Bass",
      clef:"Bass",
      effects:"None",
      notes: [],

    }
  ]
};


loadTracks()
//music vars
var BPM = 120; //The beats per minute of song
var volume = 0;
var isPlaying = false;
var isCountOn = false; //if starting count is on.
var metronome = false; //if the metronome is on.
var isSolo = false; //if the instrument is soloing
var currentInstrument = 0;
var currentNote = -1;
var currentTimeouts = [];
//sets the rendering item for canvas
setInterval(render,16);

//loads defualt Song.
setBPM(song.bpm);
setTitle(song.title);

operation = []
operationIndex = 0;
/*********************GRAPHICS************************/
/**Renders the sheetMusic*/
function render(){ //displays the song canvas.

  //Paints Screen\
  if(isDarkMode){
    fillScreen("#031a40")
  }else{

    fillScreen("#d3d3d3")
  }
  /**draws BPM on canvas.*/
  renderBPM();

  ctx.beginPath();
  ctx.stroke();
  ctx.closePath()
  /**draws music*/
  if(song.tracks.length > 0){
    drawMusic();
  }
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
  if(isDarkMode){
    ctx.fillStyle = "#808080"
  } else{

    ctx.fillStyle = "black";
  }
  ctx.textAlign = "center";
  ctx.fillText("BPM: " + getBPM(),canvas.width-100,20);
}

/**Draws the sheet music*/
function drawMusic(){
  //the current width the notes take up on the current staff

  //package all spacing together to make it easier to use in functions
  //x offset
  //y offset
  //how far apart the notes are
  // how far apart the lines are
  //used to see where the bar lines should be drawn
  let pos = {xOffset:60,yOffset:100,noteSpacing:48,spaceSize:10,barCounter:0}

  let screenHeight = 500; //the parents screenHeight

  if(isDarkMode){
    ctx.fillStyle  = "#808080";
    ctx.strokeStyle = '#808080';
  } else{
    ctx.fillStyle = "#000000";
    ctx.strokeStyle = '#000000';
  }
  if(currentNote == -1){
    ctx.beginPath();
    ctx.moveTo(pos.xOffset-5,pos.yOffset-5);
    ctx.lineTo(pos.xOffset-5,pos.yOffset+pos.spaceSize*5);
    ctx.closePath();
    ctx.stroke();
  }
  drawStaff(pos); //draws a staff at an offset on y=0
  for(notes in song.tracks[currentInstrument].notes){
    if(notes == currentNote){//drawing current note indicator
      /*checks if its still on the screen*/
      if(pos.yOffset >= 200+canvas.parentElement.scrollTop && isPlaying){
        canvas.parentElement.scrollTop += 10
      }
      ctx.beginPath();
      ctx.moveTo(pos.xOffset+10,pos.yOffset-5);
      ctx.lineTo(pos.xOffset+10,pos.yOffset+pos.spaceSize*5);
      ctx.closePath();
      ctx.stroke();
    }
    if(notes == copyStart || notes == copyEnd){

      ctx.beginPath();
      ctx.arc(pos.xOffset, pos.yOffset-15, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.closePath();
    }


    if(song.tracks[currentInstrument].notes[notes].length.includes(".")){
      pos.barCounter += 1/Number(song.tracks[currentInstrument].notes[notes].length.replace("n.",""))*1.5; //dotted notes are 1.5
    } else{ //doesnt contain a dot
      pos.barCounter += 1/Number(song.tracks[currentInstrument].notes[notes].length.replace("n",""));
    }
    if(pos.barCounter == 1){ //note that ends the bar
      pos.barCounter = 0;
      drawBar(pos);
      drawNote(song.tracks[currentInstrument].notes[notes],pos,notes);
    } else if(pos.barCounter > 1){ //note needs to be tied

      let leftOver = 1/(pos.barCounter-1);
      let tempNote = song.tracks[currentInstrument].notes[notes];
      drawBar(pos);
      let lengthDotted = 1/(1/(Number(tempNote.length.replace("n","").replace(".","")))*1.5-1/leftOver)+"n";
      let lengthNotDotted = 1/(1/(Number(tempNote.length.replace("n","").replace(".","")))-1/leftOver)+"n";
      if(tempNote.length.includes(".")){

        if(lengthDotted.includes(".")){ //draws normal note dont know how to deal with given notes
          switch(Number(lengthDotted.replace("n",""))){ //finds what the note value is
            case 8/3:
              drawTiedNotes(notes,"4n.",leftOver+"n",pos);
              break
            case 8/6:
              drawTiedNotes(notes,"2n.",leftOver+"n",pos);
              break;
            case 16/3:
              drawTiedNotes(notes,"8n.",leftOver+"n",pos);
              break;
            case 16/3:
              drawTiedNotes(notes,"8n.",leftOver+"n",pos);
              break;
            case 32/3:
              drawTiedNotes(notes,"16n.",leftOver+"n",pos);
              break;
            default:
              drawNote(song.tracks[currentInstrument].notes[notes],pos,notes);
              break;
          }

        }else if((""+leftOver).includes(".")){
          switch(leftOver){
            case 8/3:
              drawTiedNotes(notes,lengthDotted,"4n.",pos);
              break
            case 8/6:
              drawTiedNotes(notes,lengthDotted,"2n.",pos);
              break;
            case 16/3:
              drawTiedNotes(notes,lengthDotted,"8n.",pos);
              break;
            case 16/3:
              drawTiedNotes(notes,lengthDotted,"8n.",pos);
              break;
            case 32/3:
              drawTiedNotes(notes,lengthDotted,"16n.",pos);
              break;
            default:
              drawNote(song.tracks[currentInstrument].notes[notes],pos,notes);
              break;
          }
        } else {
          drawTiedNotes(notes,lengthDotted,leftOver+"n",pos);
        }

      } else{
        if(lengthNotDotted.includes(".")){ //draws normal note dont know how to deal with given notes
          switch(Number(lengthNotDotted.replace("n",""))){ //finds what the note value is
            case 8/3:
              drawTiedNotes(notes,"4n.",leftOver+"n",pos);
              break
            case 8/6:
              drawTiedNotes(notes,"2n.",leftOver+"n",pos);
              break;
            case 16/3:
              drawTiedNotes(notes,"8n.",leftOver+"n",pos);
              break;
            case 16/3:
              drawTiedNotes(notes,"8n.",leftOver+"n",pos);
              break;
            case 32/3:
              drawTiedNotes(notes,"16n.",leftOver+"n",pos);
              break;
            default:
              drawNote(song.tracks[currentInstrument].notes[notes],pos,notes);
              break;
          }

        }else if((""+leftOver).includes(".")){
          switch(leftOver){
            case 8/3:
              drawTiedNotes(notes,lengthNotDotted,"4n.",pos);
              break
            case 8/6:
              drawTiedNotes(notes,lengthNotDotted,"2n.",pos);
              break;
            case 16/3:
              drawTiedNotes(notes,lengthNotDotted,"8n.",pos);
              break;
            case 16/3:
              drawTiedNotes(notes,lengthNotDotted,"8n.",pos);
              break;
            case 32/3:
              drawTiedNotes(notes,lengthNotDotted,"16n.",pos);
              break;
            default:
              drawNote(song.tracks[currentInstrument].notes[notes],pos,notes);
              break;
          }
        } else {
          drawTiedNotes(notes,lengthNotDotted,leftOver+"n",pos);
        }
      }
    } else { //normal note
      drawNote(song.tracks[currentInstrument].notes[notes],pos,notes);
    }


    pos.xOffset += pos.noteSpacing; //adds space for next note
    if(pos.xOffset >= (width-80)){
      pos.xOffset = 60;
      //creates new staff
      pos.yOffset += pos.spaceSize*5 + 75;
      if(pos.yOffset+50 > height){ //increase canvas size.
        resizeCanvas(0,pos.yOffset+pos.spaceSize*5+50);
      }
      drawStaff(pos);

    }
  }

  if(isClicked){
    isClicked = false;
  }

}

/*draws ties over bars and returns the new value of barCounter;*/
function drawTiedNotes(notes,length1,length2,pos){
  let tempNote = song.tracks[currentInstrument].notes[notes];

  let noteOffset = drawNote({name:tempNote.name,length:length1},pos,notes) //draws first note in tie
  drawTie(pos,noteOffset) //draws the tie

  //adds spacing for new note
  pos.xOffset += pos.noteSpacing
  drawNote({name:tempNote.name,length:length2},pos,notes) //draws second note in tie

  pos.barCounter = 1/length2.replace(".","").replace("n","");
}
function drawTie(pos,noteOffset){
    ctx.beginPath()
    ctx.moveTo(pos.xOffset+10,pos.yOffset+noteOffset)
    ctx.quadraticCurveTo(5+pos.xOffset+pos.noteSpacing/2,pos.yOffset+noteOffset-pos.noteSpacing/4, pos.xOffset+10+pos.noteSpacing,pos.yOffset+noteOffset);
    ctx.stroke();
}
/**draws a barline*/
function drawBar(pos){

    ctx.beginPath()
    ctx.moveTo(pos.xOffset + 30,pos.yOffset);
    ctx.lineTo(pos.xOffset + 30,pos.yOffset + pos.spaceSize*4);
    ctx.stroke();
    ctx.closePath();
}
/**Draws a staff with the offset of y=offset*/
function drawStaff(pos){

  if(song.tracks[currentInstrument].clef === "Treble"){
    ctx.drawImage(spriteSheet,160,0,64,64,-10,pos.yOffset-10,64,64);
  } else {
    ctx.drawImage(spriteSheet,224,0,64,64,-20,pos.yOffset-10,64,64);
  }
  for(let y = pos.yOffset; y < pos.yOffset + pos.spaceSize*5; y += pos.spaceSize  ){
    ctx.beginPath();
    ctx.moveTo(40,y);
    ctx.lineTo(width - 30 ,y);
    ctx.stroke();
    ctx.closePath();
  }

}

/**Draws note given by index note in song in the current track.*/
function drawNote(note,pos,noteIndex){
  let noteOffset = 0; //how much to shift the y offset for the note.
  let noteType = 0;  //the shift in the spriteSheet needed for note type.
  let isDotted = false;
  let isRest = 0; //if its a rest it will be shifted 32 pixels down in the sprite sheet
  //gets note offsets
  for(let i = 0;i < note.name.length;i++){
    let noteLetter = note.name[i];
    if(i == 0){
      noteOffset = getNoteLetterOffset(noteLetter);
    } else if([0,1,2,3,4,5,6,7].includes(Number(noteLetter))){

      noteOffset += getOctaveOffset(noteLetter);


    }

  }
  if(note.name == "r"){
    isRest = 1;
    noteOffset = 5;
  } else if(note.name.includes("#")){
    drawSymbol("#", pos,noteOffset)
  } else if(note.name.includes("b")){
    drawSymbol("b", pos, noteOffset)
  }

  //gets note type
  switch(note.length){
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
      isDotted=true;
      break;
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
      isDotted = true;
      break;
    case "16n":
      noteType = Notes.sixteenthNote;
      break;
    case "16n.":
      noteType = Notes.sixteenthNote;
      isDotted = true;
      break;
  }
  //draw lines for note if its off the staff
  if(noteOffset < -5){
    for(let lines = -10; lines >= noteOffset+25; lines -= 10){
      ctx.beginPath();
      ctx.moveTo(pos.xOffset,pos.yOffset+lines);
      ctx.lineTo(pos.xOffset+25,pos.yOffset+lines);
      ctx.stroke();
      ctx.closePath();
    }
  }
  else if(noteOffset > 20){
    for(let lines = 40; lines <= noteOffset+30; lines += 10){
      ctx.beginPath();
      ctx.moveTo(pos.xOffset-5,pos.yOffset+lines);
      ctx.lineTo(pos.xOffset+20,pos.yOffset+lines);
      ctx.stroke();
      ctx.closePath();
    }

  }

  if(isDotted){//if the note is dotted draws the dot
    ctx.beginPath();
    ctx.arc(pos.xOffset+25, pos.yOffset+25 + noteOffset, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
  }

  if(noteOffset <= -5 && isRest != 1){ //flips notes if above middle line
    isRest= 2
    noteOffset += 18
  }
  ctx.drawImage(spriteSheet,noteType,32*isRest,32,32,pos.xOffset+1,pos.yOffset + 1+ noteOffset,32,32);

  /**checks if it was clicked on*/
  if(isClicked){
    if((pos.xOffset-10 <= mouseX && mouseX <= pos.xOffset+32) &&
       (pos.yOffset-32 <= mouseY && mouseY <= pos.yOffset+64)){

        currentNote = noteIndex

         isClicked = false;
        }
  }
  return noteOffset
}

/**draws the symbol symbol beside the note to the left*/
function drawSymbol(symbol, pos,noteShift){
  ctx.font = "12px Arial";   //default font.
  ctx.textAlign = "center";

  ctx.fillText(symbol,pos.xOffset-5,pos.yOffset+noteShift+25);
}

/**returns the offset needed for given note*/
function getNoteLetterOffset(noteLetter){
  let noteOffset;
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
  return noteOffset;
}

/**gets the offset for the octave*/
function getOctaveOffset(noteLetter){
  let offsets = [140,105,70,35,0,-35,-70]

  noteOffset = offsets[Number(noteLetter)];
  if(song.tracks[currentInstrument].clef == "Bass"){
    noteOffset -= 25
    //bass is an octave down plus shift
  }
  return noteOffset
}
/*********************GRAPHICS************************/
//plays the song when play is clicked or stops it if its already playing
function play(event){ //plays the song or stops it.
  if(song.tracks.length == 0){ //makes sure there is a track
    return;
  }
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
  synth = new tone.PolySynth(6).toMaster();
}
/*Gets the BPM*/
function getBPM(){
  return BPM;
  /*Sets the BPM to local var and to the synth*/
}
function setBPM(bpm){

  pushOperation({name:"bpm",data:{old:BPM,new:bpm}}) //used for undoing and redoing
  BPM = bpm
  song.bpm = bpm;
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
  if(currentNote == -1){
    currentNote=0;
  }
  if(isCountOn){
    for(let i = 0; i < 8; i++)
    synth.triggerAttackRelease("C7","32n",tone.Time("4n")*i,1);
  }
  //loops through and syncs tracks
  if(currentNote >= song.tracks[currentInstrument].notes.length){
    currentNote = -1;
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
        synth.triggerAttackRelease("C7","32n",delta,1);
        delta += tone.Time("4n"); //add offset
      }
  }
  for(time in timeoutOffsets){ //sets the timer for changing notes
    currentTimeouts.push(setTimeout( () => {
      currentNote++;
      if(currentNote == song.tracks[currentInstrument].notes.length){
        stopPlay();
        currentNote = -1;
        canvas.parentElement.scrollTop = 0;
      }


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
  shiftButtonColour(metronome,metronomeBtn)
}

/*toggles the solo boolean  also changing colour of button*/
function soloToggle(){
  isSolo = (isSolo) ? false : true;
  shiftButtonColour(isSolo,soloBtn)
}

/*toggle the count boolean also changing colour of button*/
function countToggle(){
  isCountOn = (isCountOn) ? false : true;
  shiftButtonColour(isCountOn,countBtn);
  //if it is playing it stops and restarts the song with the new feature

}

/**shifts the button colour to based on given boolean and button*/
function shiftButtonColour(condition,btn){
  if(condition){
    btn.style.background="#4b81a6"
  } else {
    if(isDarkMode){
      btn.style.background="#00008b"
    } else{
      btn.style.background="lavender";
    }
  }
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
    loadTracks();

  })
}
/******************FILE IO************************/

/*****************DOCUEMNT interaction************/
function setTitle(title){
  pushOperation({name:"title",data:{old:song.title,new:title}})
  let titleText = document.getElementById("title");
  titleText.innerText = title
}


/*if the canvas was clicked*/
function canvasClick(event){

  let canvasRect = canvas.getBoundingClientRect();
  let x = event.clientX - canvasRect.left;
  let y = event.clientY - canvasRect.top;

  changeCurrentNote(x,y)
}


/**changes the current note based on mouse input*/
function changeCurrentNote(x,y){
  mouseX = x;
  mouseY = y;
  isClicked = true;
  console.log("X: "+ mouseX +" y "+ mouseY)
  drawMusic();
  if(isPlaying){
    play(null);
    play(null);
  }
}


/**triggers when the screen is resized*/
function resize(event){
   resizeCanvas(canvas.parentElement.offsetWidth,10);
   canvas.parentElement.style.height = Math.floor(window.innerHeight*0.85 ) + "px";

   if(canvas.height < Number(canvas.parentElement.style.height.replace("px",""))){
     resizeCanvas(0,Number(canvas.parentElement.style.height.replace("px","")));

   }
}


/**if the track was changed*/
function changeTrack(event){
  track = trackDropdown.selectedIndex;
  currentInstrument = Number(track);
  currentNote = -1;
  if(isPlaying){
    stopPlay(); //stops playing if it current playing
  }
}

/**loads the current tracks into the dropdown*/
function loadTracks(){
  trackDropdown.options.length = 0; //clears all tracks
  currentInstrument = 0;//goes back to current instrument
  //loads new tracks
  song.tracks.forEach( track => {
    option = document.createElement("option");
    option.text = track.name;
    trackDropdown.options.add(option)
  })

}

electron.remote.getCurrentWindow().on("close", () => {
  tone.Transport.stop();
  synth.unsync();
  synth.dispose()
})

/**Pushes a operation onto the stack;*/
function pushOperation(obj){

  //overwrites all data ontop of the  index of the stack.
  console.log(obj)
  if(!ignoreOperation){
    operationIndex++;
    operation.push(obj); //pushes obj onto the stack
    operation.length = operationIndex;
  }
}

//gets the item at the stack and lowers the stack but does not delete it
function popOperation(){
  if(operation.length == 0 || operationIndex < 0 ){
    return null;
  }
  operationIndex--; //goes down an index
  return operation[operationIndex+1];
}

//gets the item above in the stack and pushes it on
function pullOperation(){
  if(operation.length < operationIndex+1 || operation.length == 0){
    return null;
  }
  operationIndex++
  return operation[operationIndex-1];
}

/*undos last operation*/
function undo(event){
  do{
    op = popOperation()
  } while(typeof op == "undefined");

  ignoreOperation = true;
  if(op != null){ //no operation to undo
      switch(op.name){
        case "bpm": //undo bpm change
          BPM = op.data.old;
          song.bpm = op.data.old;
          tone.Transport.bpm.value=op.data.old;
          break;
        case "title":
          let title = op.data.old
          let titleText = document.getElementById("title");
          titleText.innerText = title
          song.title = title
          break;
        case "note":
          let tempNote = currentNote;
          currentNote = op.data.index;
          delNote(null);
          break;
        case "flat":
          currentNote = op.data.index;
          flat(null);
          break;
        case "sharp":
          currentNote = op.data.index;
          sharp(null);
          break;
        case "dot":
          currentNote = op.data.index;
          dot(null);
          break;
        case "delete-track":
          song.tracks.splice(op.data.index,0,op.data.track);
          loadTracks();
          currentInstrument = op.data.index;
          trackDropdown.value = op.data.track.name;
          break;
        case "new-track":
          currentInstrument = song.tracks.length-1;
          delTrack(null);
          currentInstrument = song.tracks.length-1;
          break;
        case "noteUp":
          currentNote =op.data.index
          moveDown(null);
          break;
        case "noteDown":
          currentNote =op.data.index
          moveUp(null);
          break;
        case "delNote":
          currentNote = op.data.index;
          song.tracks[currentInstrument].notes.splice(Number(currentNote)+1,0,op.data.note);
          if(song.tracks[currentInstrument].notes.length != 1 ){
            currentNote++;
          } else { //makes sure it selects first note
            currentNote = 0;
          }
          break;
      }
  }
  ignoreOperation = false;
}

/*undos last operation*/
function redo(event){
  do{
    op = pullOperation()
  } while(typeof op == "undefined");
  ignoreOperation = true;

  if(op != null){ //no operation to undo
      switch(op.name){
        case "bpm": //undo bpm change
          BPM = op.data.new;
          song.bpm = op.data.new;
          tone.Transport.bpm.value=op.data.new;
          break;
        case "title":
          let title = op.data.new
          let titleText = document.getElementById("title");
          titleText.innerText = title
          song.title = title
          break;
        case "note":
          currentNote = op.data.index;
          song.tracks[currentInstrument].notes.splice(Number(currentNote)+1,0,op.data.note);
          if(song.tracks[currentInstrument].notes.length != 1 ){
            currentNote++;
          } else { //makes sure it selects first note
            currentNote = 0;
          }

          break;
        case "flat":
          currentNote = op.data.index;
          flat(null);

          break;
        case "sharp":
          currentNote = op.data.index;
          sharp(null);
          break;
        case "dot":
          currentNote = op.data.index;
          dot(null);
          break;
        case "delete-track":
          song.tracks.splice(op.data.index,1);
          loadTracks();
          currentInstrument = 0;

          break;
        case "new-track":
          currentInstrument = song.tracks.length-1;
          song.tracks.splice(currentInstrument,0,op.data.track);
          currentInstrument = song.tracks.length-1;
          break;

        case "noteUp":
          currentNote =op.data.index
          moveUp(null);
          break;
        case "noteDown":
          currentNote =op.data.index
          moveDown(null);
          break;
        case "paste-one":
          break;
        case "paste-set":
          break;
      }
  }
  ignoreOperation = false;
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

ipcRenderer.on("send-title", (event,title) => { //changes bpm to new given bpm
  setTitle(title);
  song.title = title;
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
});

ipcRenderer.on("new-track", newTrack);
function newTrack(event,newTrack){
  pushOperation({name:"new-track",data:{track:newTrack}})
  song.tracks.push(newTrack);
  loadTracks();
  currentInstrument = trackDropdown.options.length-1;
  trackDropdown.value = newTrack.name

}

ipcRenderer.on("delete-track", delTrack);
function delTrack(event){
  pushOperation({name:"delete-track",data:{index:currentInstrument,track:song.tracks[currentInstrument]}});
  song.tracks.splice(currentInstrument,1);
  loadTracks();
}

ipcRenderer.on("new-note",(event,noteLength) =>{

  let newNote = null;
  if(song.tracks[currentInstrument].clef == "Bass"){
    newNote = {name:"D3",length:noteLength};
  } else {
    newNote = {name:"B3",length:noteLength};
  }
  song.tracks[currentInstrument].notes.splice(Number(currentNote)+1,0,newNote);
  if(song.tracks[currentInstrument].notes.length != 1 ){
    currentNote++;
  } else { //makes sure it selects first note
    currentNote = 0;
  }
  pushOperation({name:"note",data:{index:currentNote,note:newNote}});
})

//adds a new rest at curentnote
ipcRenderer.on("new-rest",(event,noteLength) =>{
  let newRest = {name:"r",length:noteLength};

  song.tracks[currentInstrument].notes.splice(Number(currentNote)+1,0,newRest);
  if(song.tracks[currentInstrument].notes.length != 1 ){
    currentNote++;
  } else {
    currentNote = 0;
  }
  pushOperation({name:"note",data:{index:currentNote,note:newRest}});
})

/*deletes the current note*/
ipcRenderer.on("del-note",delNote);
function delNote(event) {

  if(song.tracks[currentInstrument].notes.length == 0){
    return;
  }
  let note = song.tracks[currentInstrument].notes[Number(currentNote)];
  song.tracks[currentInstrument].notes.splice(Number(currentNote),1);
  if(song.tracks[currentInstrument].notes.length-1 < currentNote){
    currentNote--;
  }
  pushOperation({name:"delNote",data:{index:currentNote,note:note}})
}

/*Toggles the sharp on the current note*/
ipcRenderer.on("sharp", sharp);
function sharp(event){
  if(song.tracks[currentInstrument].notes.length == 0 ||song.tracks[currentInstrument].notes[currentNote].name == "r" ){
    return;
  }
  if(song.tracks[currentInstrument].notes[currentNote].name.includes("#")){
    //get ride of sharp
      song.tracks[currentInstrument].notes[currentNote].name =
        song.tracks[currentInstrument].notes[currentNote].name.replace("#","");
  } else if(song.tracks[currentInstrument].notes[currentNote].name.includes("b")){
    //replace flat
      song.tracks[currentInstrument].notes[currentNote].name =
        song.tracks[currentInstrument].notes[currentNote].name.replace("b","#");
  } else{
    //no sharp
    song.tracks[currentInstrument].notes[currentNote].name =
      song.tracks[currentInstrument].notes[currentNote].name[0] + "#" +
      song.tracks[currentInstrument].notes[currentNote].name[1];
  }
  pushOperation({name:"sharp",data:{index:currentNote}})

}

/*Toggles the flat on the current note*/
ipcRenderer.on("flat",flat);
function flat(event){
  if(song.tracks[currentInstrument].notes.length == 0 ||song.tracks[currentInstrument].notes[currentNote].name == "r"){
    return;
  }
  if(song.tracks[currentInstrument].notes[currentNote].name.includes("b")){
    //get ride of flat
      song.tracks[currentInstrument].notes[currentNote].name =
        song.tracks[currentInstrument].notes[currentNote].name.replace("b","");
  } else if(song.tracks[currentInstrument].notes[currentNote].name.includes("#")){
    //replace sharp
      song.tracks[currentInstrument].notes[currentNote].name =
        song.tracks[currentInstrument].notes[currentNote].name.replace("#","b");
  } else{
    //no flat
    song.tracks[currentInstrument].notes[currentNote].name =
      song.tracks[currentInstrument].notes[currentNote].name[0] + "b" +
      song.tracks[currentInstrument].notes[currentNote].name[1];
  }
    pushOperation({name:"flat",data:{index:currentNote}})
}

/*Toggles the flat on the current note*/
ipcRenderer.on("dot",dot);
function dot(event){
  if(song.tracks[currentInstrument].notes.length == 0){
    return;
  }
  if(song.tracks[currentInstrument].notes[currentNote].length.includes(".")){

    //get ride of dot
    song.tracks[currentInstrument].notes[currentNote].length =
      song.tracks[currentInstrument].notes[currentNote].length.replace(".","");
  } else{
    //no dot
    song.tracks[currentInstrument].notes[currentNote].length += ".";
  }
    pushOperation({name:"dot",data:{index:currentNote}})
}

/**Repeates last note*/
ipcRenderer.on("repeat",repeat);
function repeat(event){
  if(song.tracks[currentInstrument].notes.length == 0){
    return; //no note to repeat
  }
  let note = {
    name: song.tracks[currentInstrument].notes[currentNote].name,
    length: song.tracks[currentInstrument].notes[currentNote].length
  }

  song.tracks[currentInstrument].notes.splice(Number(currentNote)+1,0,note);
  currentNote++;
  pushOperation({name:"note",data:{index:currentNote,note:note}});
}

/*shifts current note up one*/
ipcRenderer.on("move-note-up",moveUp);
function moveUp(event){
  if(song.tracks[currentInstrument].notes.length == 0){
    return;
  }
  let noteName = song.tracks[currentInstrument].notes[currentNote].name;
  if(noteName == "r"){
    return;
  }

  numbers = [0,1,2,3,4,5,6,7];
  switch(noteName[0]){
    case "A":
      noteName = noteName.replace("A","B")
      break;
    case "B": //special case add one to octave too
      let change = 0;
      noteName = noteName.replace("B","C")
      if(numbers.includes(Number(noteName[1]))){
        change = (Number(noteName[1])+1)
        noteName = noteName[0] + (Number(noteName[1])+1)

      }else{ //if there is a sharp or flat
        change = (Number(noteName[2])+1)
        noteName = noteName[0] + noteName[1] + (Number(noteName[2])+1)
      }

      if(song.tracks[currentInstrument].clef == "Bass"){
        if(change > 4){ //too high
          return;
        }
      } else if( change > 5){
        return
      }
      break;
    case "C":
      noteName = noteName.replace("C","D")
      break;
    case "D":
      noteName = noteName.replace("D","E")
      break;
    case "E":
      noteName = noteName.replace("E","F")
      break;
    case "F":
      noteName = noteName.replace("F","G")
      break;
    case "G":
      noteName = noteName.replace("G","A")
      break;
  }
  //make changes;
  song.tracks[currentInstrument].notes[currentNote].name = noteName;
  pushOperation({name:"noteUp",data:{index:currentNote}});
}

/*shifts current note up one*/
ipcRenderer.on("move-note-down",moveDown);
function moveDown(event){
  if(song.tracks[currentInstrument].notes.length == 0){
    return;
  }
  let noteName = song.tracks[currentInstrument].notes[currentNote].name;
  if(noteName == "r"){
    return;
  }
  numbers = [0,1,2,3,4,5,6,7];
  switch(noteName[0]){
    case "A":
      noteName = noteName.replace("A","G")
      break;
    case "B": //special case add one to octave too
      noteName = noteName.replace("B","A")
      break;
    case "C": //go an ocavte down
      let change = 0;
      noteName = noteName.replace("C","B")
      if(numbers.includes(Number(noteName[1]))){
        change = (Number(noteName[1])-1);
        noteName = noteName[0] + (Number(noteName[1])-1)
      }else{ //if there is a sharp or flat
        change = (Number(noteName[2])-1)
        noteName = noteName[0] + noteName[1] + (Number(noteName[2])-1)
      }

      if(song.tracks[currentInstrument].clef == "Bass"){
        if(change < 1 ){
          return;
        }
      } else if( change < 2){
        return;
      }

      break;


    case "D":
      noteName = noteName.replace("D","C")
      break;
    case "E":
      noteName = noteName.replace("E","D")
      break;
    case "F":
      noteName = noteName.replace("F","E")
      break;
    case "G":
      noteName = noteName.replace("G","F")
      break;
  }
  //make changes;
  song.tracks[currentInstrument].notes[currentNote].name = noteName;
  pushOperation({name:"noteDown",data:{index:currentNote}});
}

ipcRenderer.on("move-right", (event) => {
  if(currentNote < song.tracks[currentInstrument].notes.length -1){
    currentNote++;
  }
  if(isPlaying){
    play(event);
    play(event);
  }
})

ipcRenderer.on("move-left", (event) => {
  if(currentNote > -1){
    currentNote--;
  }
  if(isPlaying){
    play(event);
    play(event);
  }
})

ipcRenderer.on("copy",copy);
ipcRenderer.on("paste",paste);
ipcRenderer.on("undo",undo);
ipcRenderer.on("redo",redo);
/********************IPC COMMUNICATIONS*************************/


/*****keyboard shortcuts************/
electron.remote.getCurrentWindow().webContents.on('before-input-event', (event, input) => {


  if(input.type == "keyDown"){
    console.log(input.code)
    if(shortcutHandler(input,config.shortcuts.play)){
      play(event)
    } else if(shortcutHandler(input, config.shortcuts.bpm)){
      ipcRenderer.send("open-bpm-window");
    } else if(shortcutHandler(input, config.shortcuts.solo)){
      soloToggle()
    } else if(shortcutHandler(input, config.shortcuts.metronome)){
      metronomeToggle();
    } else if(shortcutHandler(input, config.shortcuts.count)){
      countToggle();
    } else if(shortcutHandler(input, config.shortcuts.currentNoteLeft)){
      if(currentNote > -1){
        currentNote--;
      }
      if(isPlaying){
        play(event);
        play(event);
      }
    } else if(shortcutHandler(input, config.shortcuts.currentNoteRight)){
      if(currentNote < song.tracks[currentInstrument].notes.length -1){
        currentNote++;
      }
      if(isPlaying){
        play(event);
        play(event);
      }
    } else if(shortcutHandler(input, config.shortcuts.shiftUp)){
      moveUp(null);
    } else if(shortcutHandler(input, config.shortcuts.shiftDown)){
      moveDown(null);
    } else if(shortcutHandler(input, config.shortcuts.dot) || shortcutHandler(input,config.shortcuts.dot2)){
      dot(null)
   } else if(shortcutHandler(input, config.shortcuts.del) || shortcutHandler(input,config.shortcuts.del2)){
     delNote(null)
   } else if(shortcutHandler(input, config.shortcuts.repeatLastNote)){
     repeat(null)
   } else if(shortcutHandler(input, config.shortcuts.copy)){
     copy(null);
   } else if(shortcutHandler(input, config.shortcuts.paste)){
     paste(null);
   } else if(shortcutHandler(input, config.shortcuts.save)){
     ipcRenderer.send("save");
   } else if(shortcutHandler(input, config.shortcuts.sharp)){
     sharp(null)
   } else if(shortcutHandler(input, config.shortcuts.flat)){
     flat(null)
   } else if(shortcutHandler(input, config.shortcuts.undo)){
     undo(null)
   } else if(shortcutHandler(input, config.shortcuts.redo)){
     redo(null)
   }
  }

})

/*prevents scrolling with arrowkeys and spacebar*/
window.onkeydown = (event) => {
  if(event.key == "ArrowUp" || event.key == "ArrowDown"){

    event.view.event.preventDefault();
  }
  if(event.key == "Space"){
    event.view.event.preventDefault();
  }
}

/**Returns if the event is true*/
function shortcutHandler(input,keyCombo){

  return (input.code == keyCombo.key
     && input.shift == keyCombo.shift
     && input.alt == keyCombo.Alt
     && input.control == keyCombo.Ctrl
     )
}
/*******keyboard shortcuts*********/


function copy(event){
  if(copyStart == -1){
    copyStart = currentNote;
    copyTrack = currentInstrument;
  } else if(copyEnd == -1 && currentInstrument == copyTrack){

    copyEnd = currentNote
  } else{
    copyStart = -1;
    copyEnd = -1;
    copyStart = currentNote;
    copyTrack = currentInstrument;
  }

}

function paste(event){
  if(copyStart != -1 && copyEnd == -1){//only copies 1 note
    let copyNote = {name:song.tracks[copyTrack].notes[copyStart].name,
                    length:song.tracks[copyTrack].notes[copyStart].length}
    song.tracks[currentInstrument].notes.splice(Number(currentNote)+1,0,copyNote);
    if(song.tracks[currentInstrument].notes.length != 1 ){
      currentNote++;
    } else {
      currentNote = 0;
    }
    pushOperation({name:"paste-one",data:{index:currentNote,data:copyNote}})
  } else if(copyStart != -1 && copyEnd != -1){ //copies section

    let copiedNotes = []
    pushOperation({name:"paste-set",data:{index:currentNote+1,set:copiedNotes}})
    let copyNote;
    if(copyStart > copyEnd){
      let temp = copyStart;
      copyStart = copyEnd;
      copyEnd = temp;
    }
    for(let x = copyStart; x <= copyEnd; x++){
      copyNote = {name:song.tracks[copyTrack].notes[x].name,
                    length:song.tracks[copyTrack].notes[x].length}
      song.tracks[currentInstrument].notes.splice(Number(currentNote)+1,0,copyNote);
      copiedNotes.push(copyNote);
      if(song.tracks[currentInstrument].notes.length != 1 ){
        currentNote++;
      } else {
        currentNote = 0;
      }
    }

  }
}
