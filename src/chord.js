const electron = require("electron");
const path = require("path");
const ipcRenderer = electron.ipcRenderer;
const remote = require('electron').remote;
//configs
var config = ipcRenderer.sendSync("getConfig");
var isDarkMode = config.darkMode;
if(isDarkMode == "true"){
  document.getElementById("style").setAttribute("href","../res/css/stylesDark.css")
}
const canvas = document.getElementById("chord"); //render
canvas.addEventListener("click",canvasClick);
//Setting up graphics
var ctx = canvas.getContext("2d");
var height = canvas.height; //length and width of canvas
var width = canvas.width;
var mouseX = 0;
var mouseY = 0;
var isClicked = false;
var currentNote = 0;
//enum for where notes are located in spritesheet;
var Notes = {
  wholeNote: 0,
  halfNote: 32,
  quarterNote: 64,
  eigthNote: 96,
  sixteenthNote: 128,
}
var clef = "Bass"

var mainWinID = ipcRenderer.sendSync("getMainID");
//requests for clef

ipcRenderer.sendTo(mainWinID,"getClef",remote.getCurrentWindow().webContents.id);

//setting up spriteSheet containing music notes and symbols
var spriteSheet = new Image;
if(isDarkMode == "true"){
  spriteSheet.src = "../res/images/musicNotesDark.png";
}
else{
  spriteSheet.src = "../res/images/musicNotes.png";
}
if(isDarkMode == "true"){
  ctx.fillStyle  = "#808080";
  ctx.strokeStyle = '#808080';
} else{
  ctx.fillStyle = "#000000";
  ctx.strokeStyle = '#000000';
}
chord = {name:"chord",chord:["C4","C#3","D3"],length:"4n"}
var pos = {xOffset:60,yOffset:100,noteSpacing:15,spaceSize:10,barCounter:0};
drawChord()
setInterval(drawChord,16);
/**Draws a staff with the offset of y=offset*/
function drawStaff(){
  if(clef === "Treble"){
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
function drawNote(note,noteIndex,tiedNote){

  let noteInfo = {noteOffset:0, //how much to shift the y offset for the note.
                  noteType:0, //the shift in the spriteSheet needed for note type.
                  isDotted:false, //if the note is dotted
                  isRest:0, //if its a rest it will be shifted 32 pixels down in the sprite sheet
                  isUpsideDown:false} //if the note is filled or not
  //gets note offsets
  getOffset(note,noteInfo);

  getIsRest(note,noteInfo)

  //draw sharp/flat
  if(note.name.includes("#")){
    drawSymbol("#",noteInfo.noteOffset)
  } else if(note.name.includes("b")){
    drawSymbol("b", noteInfo.noteOffset)
  }

  getNoteType(note,noteInfo)
  drawExtraNotion(noteInfo,pos)

  getUpsideDown(noteInfo)

  ctx.drawImage(spriteSheet,noteInfo.noteType,32*noteInfo.isRest,32,32,pos.xOffset+1,pos.yOffset + 1+ noteInfo.noteOffset,32,32);

  //checks if it was selected
  checkIfClicked(noteIndex);

  return noteInfo.noteOffset
}
/**draws chords*/
function drawChord(){
  //Paints Screen\
  if(isDarkMode == "true"){
    fillScreen("#031a40")
  }else{

    fillScreen("#d3d3d3")
  }
  if(isDarkMode == "true"){
    ctx.fillStyle  = "#808080";
    ctx.strokeStyle = '#808080';
  } else{
    ctx.fillStyle = "#000000";
    ctx.strokeStyle = '#000000';
  }
  drawStaff()
  pos = {xOffset:60,yOffset:100,noteSpacing:30,spaceSize:10,barCounter:0}
  let noteIndex = 0;
  for(note in chord.chord){
    if(note == currentNote){//drawing current note indicator
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

    drawNote({name:chord.chord[note],length:chord.length},noteIndex,false)
    //adds space for next note
    pos.xOffset += pos.noteSpacing;
    noteIndex++;
  }
}

/**checks if its upsideDown*/
function getUpsideDown(noteInfo){
  if(noteInfo.noteOffset <= -5 && noteInfo.isRest != 1){ //flips notes if above middle line
    noteInfo.isRest= 2
    noteInfo.noteOffset += 18
    noteInfo.isUpsideDown = true
  }
}
/**checks if its a rest or note*/
function getIsRest(note,noteInfo){
  if(note.name == "r"){
    noteInfo.isRest = 1;
    noteInfo.noteOffset = 5;
    return true
  } else return false
}
/**gets the note type of given note*/
function getNoteType(note,noteInfo){
  //gets note type
  switch(note.length){
    case "1n":
      noteInfo.noteType = Notes.wholeNote;
      break;
    case "1n.":
      noteInfo.noteType = Notes.wholeNote;
      noteInfo.isDotted = true;
      break;
    case "2n":
      noteInfo.noteType = Notes.halfNote;
      break;
    case "2n.":
      noteInfo.noteType = Notes.halfNote;
      noteInfo.isDotted=true;
      break;
    case "4n":
      noteInfo.noteType = Notes.quarterNote;
      break;
    case "4n.":
      noteInfo.noteType = Notes.quarterNote;
      noteInfo.isDotted = true;
      break;
    case "8n":
      noteInfo.noteType = Notes.eigthNote;
      break;
    case "8n.":
      noteInfo.noteType = Notes.eigthNote;
      noteInfo.isDotted = true;
      break;
    case "16n":
      noteInfo.noteType = Notes.sixteenthNote;
      break;
    case "16n.":
      noteInfo.noteType = Notes.sixteenthNote;
      noteInfo.isDotted = true;
      break;
  }
}
/**draws the extra notation for the note*/
function drawExtraNotion(noteInfo){
  //draw lines for note if its off the staff
  if(noteInfo.noteOffset < -5){
    for(let lines = -10; lines >= noteInfo.noteOffset+25; lines -= 10){
      ctx.beginPath();
      ctx.moveTo(pos.xOffset,pos.yOffset+lines);
      ctx.lineTo(pos.xOffset+25,pos.yOffset+lines);
      ctx.stroke();
      ctx.closePath();
    }
  }
  else if(noteInfo.noteOffset > 20){
    for(let lines = 40; lines <= noteOffset+30; lines += 10){
      ctx.beginPath();
      ctx.moveTo(pos.xOffset-5,pos.yOffset+lines);
      ctx.lineTo(pos.xOffset+20,pos.yOffset+lines);
      ctx.stroke();
      ctx.closePath();
    }
  }
  if(noteInfo.isDotted){//if the note is dotted draws the dot
    ctx.beginPath();
    ctx.arc(pos.xOffset+25, pos.yOffset+25 + noteInfo.noteOffset, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
  }
}

/**checks if the current note is clicked*/
/**checks if it was clicked on*/
function checkIfClicked(note){
  if(isClicked){
    if((pos.xOffset-10 <= mouseX && mouseX <= pos.xOffset+32) &&
       (pos.yOffset-32 <= mouseY && mouseY <= pos.yOffset+64)){

         currentNote = note;
         isClicked = false;
        }
  }
}

/**draws the symbol symbol beside the note to the left*/
function drawSymbol(symbol,noteShift){
  ctx.font = "12px Arial";   //default font.
  ctx.textAlign = "center";
  ctx.fillStyle = "#808080"
  ctx.fillText(symbol,pos.xOffset-5,pos.yOffset+noteShift+25);


}


/*gets the notes offset*/
function getOffset(note,noteInfo){

  for(let i = 0;i < note.name.length;i++){
    let noteLetter = note.name[i];
    if(i == 0){
      noteInfo.noteOffset = getNoteLetterOffset(noteLetter);
    } else if([0,1,2,3,4,5,6,7].includes(Number(noteLetter))){

      noteInfo.noteOffset += getOctaveOffset(noteLetter);
    }
  }
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
fillScreen
/**gets the offset for the octave*/
function getOctaveOffset(noteLetter){
  let offsets = [140,105,70,35,0,-35,-70]

  noteOffset = offsets[Number(noteLetter)];
  if(clef == "Bass"){
    noteOffset -= 25
    //bass is an octave down plus shift
  }
  return noteOffset
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
  drawChord()
}

/**fills the screen with colour colour*/
function fillScreen(colour){
  ctx.fillStyle = colour; //fill screen
  ctx.fillRect(0,0,canvas.width,canvas.height);
}

function wholeNote(){
  chord.length = "1n"
}

function halfNote(){
  chord.length = "2n"
}

function quarterNote(){
  chord.length = "4n"
}
function eigthNote(){
  chord.length = "8n"
}

function sixteenthNote(){
  chord.length = "16n"
}

function addNote(){
  chord.chord.splice(currentNote,0,"D3");
}
function delNote(){
  chord.chord.splice(currentNote,1);
}

function moveUp(){
  let noteName = chord.chord[currentNote];



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

      if(clef == "Bass"){
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
  chord.chord[currentNote] = noteName;

}

function moveDown(){
  let noteName = chord.chord[currentNote];

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

      if(clef == "Bass"){
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
  chord.chord[currentNote] = noteName;

}


function sharp(){
  if(chord.chord[currentNote].includes("#")){
    //get ride of sharp
      chord.chord[currentNote] =
        chord.chord[currentNote].replace("#","");
  } else if(chord.chord[currentNote].includes("b")){
    //replace flat
      chord.chord[currentNote] =
        chord.chord[currentNote].replace("b","#");
  } else{
    //no sharp
    chord.chord[currentNote] =
      chord.chord[currentNote][0] + "#" +
      chord.chord[currentNote][1];
  }
}

function flat(){

  if(chord.chord[currentNote].includes("b")){
    //get ride of flat
      chord.chord[currentNote] =
        chord.chord[currentNote].replace("b","");
  } else if(chord.chord[currentNote].includes("#")){
    //replace sharp
      chord.chord[currentNote] =
        chord.chord[currentNote].replace("#","b");
  } else{
    //no flat
    chord.chord[currentNote] =
      chord.chord[currentNote][0] + "b" +
      chord.chord[currentNote][1];
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

//shortcut keys
electron.remote.getCurrentWindow().webContents.on('before-input-event', (event, input) => {


  if(input.type == "keyDown"){
    console.log(input.code)
    if(shortcutHandler(input, config.shortcuts.currentNoteLeft)){
      if(currentNote > -1){
        currentNote--;
      }
    } else if(shortcutHandler(input, config.shortcuts.currentNoteRight)){
      if(currentNote < chord.chord.length -1){
        currentNote++;
      }
    } else if(shortcutHandler(input, config.shortcuts.shiftUp)){
      moveUp();
    } else if(shortcutHandler(input, config.shortcuts.shiftDown)){
      moveDown();
    } else if(shortcutHandler(input, config.shortcuts.dot) || shortcutHandler(input,config.shortcuts.dot2)){
      dot()
   } else if(shortcutHandler(input, config.shortcuts.del) || shortcutHandler(input,config.shortcuts.del2)){
     delNote()
   } else if(shortcutHandler(input, config.shortcuts.sharp)){
     sharp()
   } else if(shortcutHandler(input, config.shortcuts.flat)){
     flat()
   }
  }

})

function dot(){
  if(chord.chord.length == 0){
    return;
  }
  if(chord.length.includes(".")){

    //get ride of dot
    chord.length =
      chord.length.replace(".","");
  } else{
    //no dot
    chord.length += ".";
  }
}
function cancel(){
  remote.getCurrentWindow().close();
}

function add(){
  ipcRenderer.sendTo(mainWinID,"addChord",chord);
}

//gets the new clef
ipcRenderer.on("getClef",(event,newClef) =>{
  clef = newClef;
});
