
const TESTING_MODE = true; // Set to true to bypass the date check for testing purposes
const birthdayDate = new Date("2026-07-17T00:00:00+03:00").getTime();

const flowerIntro=document.getElementById("flowerIntro");
const countdownScreen=document.getElementById("countdownScreen");
const surpriseScreen=document.getElementById("surpriseScreen");
const openBtn=document.getElementById("openBtn");
const lockedMessage=document.getElementById("lockedMessage");
const musicBtn=document.getElementById("musicBtn");
const daysEl=document.getElementById("days");
const hoursEl=document.getElementById("hours");
const minutesEl=document.getElementById("minutes");
const secondsEl=document.getElementById("seconds");

let audioContext,masterGain,musicOn=false,loopTimer;
let globalMusicForcedOff=false;
let mainMusicTemporarilyMuted=false;
const normalMusicVolume=.42;

function isUnlocked(){return TESTING_MODE||Date.now()>=birthdayDate}
function pad(v){return String(v).padStart(2,"0")}

function showCountdown(){
flowerIntro.classList.add("hidden");
countdownScreen.classList.remove("hidden");
}

function showSurprise(){
flowerIntro.classList.add("hidden");
countdownScreen.classList.add("hidden");
surpriseScreen.classList.remove("hidden");
burstHearts();
startMusic();
setTimeout(()=>window.scrollTo({top:0,behavior:"smooth"}),100);
}

function tryOpen(){
if(isUnlocked())showSurprise();
else lockedMessage.classList.remove("hidden");
}

function updateCountdown(){
const distance=birthdayDate-Date.now();
if(distance<=0){
daysEl.textContent=hoursEl.textContent=minutesEl.textContent=secondsEl.textContent="00";
return;
}
daysEl.textContent=pad(Math.floor(distance/(1000*60*60*24)));
hoursEl.textContent=pad(Math.floor((distance/(1000*60*60))%24));
minutesEl.textContent=pad(Math.floor((distance/(1000*60))%60));
secondsEl.textContent=pad(Math.floor((distance/1000)%60));
}

/* New gentle birthday music
   Longer, slower, warmer: soft music-box + piano chords.
   It loops every 72 seconds.
*/
const NOTE={
C3:130.81,D3:146.83,E3:164.81,F3:174.61,G3:196,A3:220,B3:246.94,
C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,B4:493.88,
C5:523.25,D5:587.33,E5:659.25,F5:698.46,G5:783.99,A5:880
};

const melody=[
["C5",0,1.2],["B4",1.5,1.0],["A4",3.0,1.4],["G4",5.0,1.2],
["A4",7.0,1.0],["C5",8.5,1.6],["D5",11.0,1.4],
["E5",14.0,1.2],["D5",15.6,1.0],["C5",17.2,1.4],["A4",19.5,1.5],
["G4",22.0,1.8],
["E4",26.0,1.2],["G4",27.5,1.2],["A4",29.2,1.6],["C5",32.0,1.7],
["B4",35.0,1.2],["A4",36.6,1.4],["G4",39.0,1.8],
["A4",43.0,1.2],["C5",44.5,1.4],["E5",47.0,1.7],["D5",50.0,1.2],
["C5",52.0,1.4],["A4",54.5,1.6],["G4",57.5,1.8],
["E4",62.0,1.4],["G4",64.0,1.4],["C5",66.5,3.2]
];

const chords=[
[["C4","E4","G4"],0,5.5],
[["A3","C4","E4"],6,5.5],
[["F3","A3","C4"],12,5.5],
[["G3","B3","D4"],18,5.5],
[["C4","E4","G4"],25,6],
[["A3","C4","E4"],32,6],
[["F3","A3","C4"],39,6],
[["G3","B3","D4"],46,6],
[["C4","E4","G4"],55,10]
];

const sparkleNotes=[
["E5",9,.5],["G5",20,.5],["C5",34,.5],["E5",48,.5],["G5",60,.5],["C5",68,.7]
];

function initAudio(){
if(!audioContext||audioContext.state==="closed"){
  audioContext=new(window.AudioContext||window.webkitAudioContext)();
  masterGain=null;
}

if(!masterGain){
masterGain=audioContext.createGain();
masterGain.gain.value=mainMusicTemporarilyMuted ? .0001 : normalMusicVolume;

const filter=audioContext.createBiquadFilter();
filter.type="lowpass";
filter.frequency.value=2600;

masterGain.connect(filter);
filter.connect(audioContext.destination);
}
audioContext.resume();
}

function tone(freq,start,duration,volume,type="sine"){
const osc=audioContext.createOscillator();
const gain=audioContext.createGain();

osc.type=type;
osc.frequency.value=freq;

gain.gain.setValueAtTime(.0001,start);
gain.gain.linearRampToValueAtTime(volume,start+.18);
gain.gain.exponentialRampToValueAtTime(.0001,start+duration);

osc.connect(gain);
gain.connect(masterGain);

osc.start(start);
osc.stop(start+duration+.12);
}

function softPiano(freq,start,duration,volume){
tone(freq,start,duration,volume,"triangle");
tone(freq*2,start+.03,duration*.55,volume*.14,"sine");
}

function musicBox(freq,start,duration,volume){
tone(freq,start,duration,volume,"sine");
tone(freq*2.005,start+.02,duration*.45,volume*.18,"sine");
}

function scheduleSong(){
if(!musicOn||globalMusicForcedOff||!audioContext||audioContext.state==="closed"||!masterGain)return;
const now=audioContext.currentTime+.08;

melody.forEach(([n,t,d])=>musicBox(NOTE[n],now+t,d,.042));

chords.forEach(([notes,t,d])=>{
notes.forEach((n,i)=>softPiano(NOTE[n],now+t+i*.05,d,.016));
});

sparkleNotes.forEach(([n,t,d])=>musicBox(NOTE[n],now+t,d,.024));
}

function startMusic(){
if(musicOn)return;

globalMusicForcedOff=false;
musicOn=true;
musicBtn.textContent="♫ Music on";

initAudio();

if(masterGain&&audioContext&&audioContext.state!=="closed"){
  try{
    masterGain.gain.setTargetAtTime(mainMusicTemporarilyMuted ? .0001 : normalMusicVolume,audioContext.currentTime,.04);
  }catch(e){
    masterGain.gain.value=mainMusicTemporarilyMuted ? .0001 : normalMusicVolume;
  }
}

clearInterval(loopTimer);
scheduleSong();
loopTimer=setInterval(()=>{
  if(!musicOn||globalMusicForcedOff)return;
  scheduleSong();
},72000);
}

function stopMusic(){
globalMusicForcedOff=true;
musicOn=false;
mainMusicTemporarilyMuted=false;
musicBtn.textContent="♫ Music off";
clearInterval(loopTimer);

// Close the Web Audio context to cancel any notes that were already scheduled.
// Suspending only pauses them, which can make them return duplicated later.
if(audioContext){
  const oldContext=audioContext;
  audioContext=null;
  masterGain=null;
  try{oldContext.close();}catch(e){}
}
}

function toggleMusic(){musicOn?stopMusic():startMusic()}

function burstHearts(){
for(let i=0;i<40;i++){
const h=document.createElement("div");
h.textContent=["💗","💕","✨","🌸","🌷"][Math.floor(Math.random()*5)];
h.style.position="fixed";
h.style.left=Math.random()*100+"vw";
h.style.top="100vh";
h.style.fontSize=18+Math.random()*22+"px";
h.style.pointerEvents="none";
h.style.animation=`fly ${2.5+Math.random()*2}s ease-out forwards`;
document.body.appendChild(h);
setTimeout(()=>h.remove(),5000);
}
}

const style=document.createElement("style");
style.textContent=`@keyframes fly{to{transform:translateY(-115vh) rotate(360deg);opacity:0}}`;
document.head.appendChild(style);

const observer=new IntersectionObserver(entries=>{
entries.forEach(entry=>{
if(entry.isIntersecting)entry.target.classList.add("visible");
});
},{threshold:.18});

document.querySelectorAll(".reveal-on-scroll").forEach(el=>observer.observe(el));

openBtn.addEventListener("click",tryOpen);
musicBtn.addEventListener("click",toggleMusic);
flowerIntro.addEventListener("click",()=>{
showCountdown();
});

updateCountdown();
setInterval(updateCountdown,1000);


// v19: tiny floating heart when hovering/clicking the fashion dress cards
function floatTinyHeart(x,y){
  const heart=document.createElement("div");
  heart.textContent=["♡","💗","✨"][Math.floor(Math.random()*3)];
  heart.style.position="fixed";
  heart.style.left=x+"px";
  heart.style.top=y+"px";
  heart.style.pointerEvents="none";
  heart.style.zIndex="999";
  heart.style.fontSize="22px";
  heart.style.animation="tinyHeartFloat 1.35s ease-out forwards";
  document.body.appendChild(heart);
  setTimeout(()=>heart.remove(),1500);
}

const tinyHeartStyle=document.createElement("style");
tinyHeartStyle.textContent=`@keyframes tinyHeartFloat{to{transform:translateY(-70px) scale(1.25) rotate(18deg);opacity:0}}`;
document.head.appendChild(tinyHeartStyle);

document.querySelectorAll(".dress-card").forEach(card=>{
  card.addEventListener("click",event=>floatTinyHeart(event.clientX,event.clientY));
});


function burstLetterCute(){
  const shell=document.getElementById("fashionLetterShell");
  if(!shell)return;
  const rect=shell.getBoundingClientRect();
  for(let i=0;i<26;i++){
    const item=document.createElement("div");
    item.textContent=["♡","💗","🌸","✿","✨"][Math.floor(Math.random()*5)];
    item.style.position="fixed";
    item.style.left=(rect.left+rect.width/2+(Math.random()*220-110))+"px";
    item.style.top=(rect.top+rect.height*.34+(Math.random()*80-40))+"px";
    item.style.pointerEvents="none";
    item.style.zIndex="999";
    item.style.fontSize=(18+Math.random()*18)+"px";
    item.style.animation=`letterCutePop ${1.6+Math.random()*1.2}s ease-out forwards`;
    document.body.appendChild(item);
    setTimeout(()=>item.remove(),3200);
  }
}

function spawnSand(intensity=1){
  const count=Math.floor(220*intensity);
  const colors=["rgba(210,170,100,.85)","rgba(230,185,110,.8)","rgba(190,150,85,.75)","rgba(245,205,130,.82)","rgba(175,135,75,.7)"];
  for(let i=0;i<count;i++){
    setTimeout(()=>{
      const p=document.createElement("div");
      p.className="sand-particle";
      const size=2.5+Math.random()*6.5;
      const left=Math.random()*100;
      const duration=2.4+Math.random()*3.2;
      const drift=(Math.random()*110-55)+"px";
      p.style.cssText=`left:${left}vw;width:${size}px;height:${size}px;background:${colors[Math.floor(Math.random()*colors.length)]};animation-duration:${duration}s;--sand-drift:${drift}`;
      document.body.appendChild(p);
      setTimeout(()=>p.remove(),(duration+0.4)*1000);
    },Math.random()*3200);
  }
}

function spawnFallingIcons(icons, options={}){
  const {
    count=44,
    durationMin=3,
    durationMax=5.4,
    spreadDelay=2200,
    sizeMin=20,
    sizeMax=34,
    drift=120,
    rotate=true
  }=options;
  if(!icons||!icons.length)return;

  for(let index=0;index<count;index++){
    setTimeout(()=>{
      const item=document.createElement("div");
      item.className="falling-icon-piece";
      item.textContent=icons[Math.floor(Math.random()*icons.length)];
      const size=sizeMin+Math.random()*(sizeMax-sizeMin);
      const duration=durationMin+Math.random()*(durationMax-durationMin);
      const left=Math.random()*100;
      const xDrift=(Math.random()*drift-drift/2)+"px";
      const rotation=rotate?(Math.random()*520-260)+"deg":"0deg";
      item.style.cssText=`left:${left}vw;font-size:${size}px;animation-duration:${duration}s;--fall-drift:${xDrift};--fall-rotate:${rotation}`;
      document.body.appendChild(item);
      setTimeout(()=>item.remove(),(duration+.3)*1000);
    },Math.random()*spreadDelay);
  }
}

function spawnCelebrationPaper(options={}){
  const {
    count=80,
    durationMin=2.6,
    durationMax=4.8,
    spreadDelay=1800,
    widthMin=6,
    widthMax=14,
    heightMin=12,
    heightMax=22,
    drift=140
  }=options;
  const colors=["#ff7aa8","#ffd166","#8ecae6","#cdb4db","#f28482","#84dcc6"];

  for(let index=0;index<count;index++){
    setTimeout(()=>{
      const item=document.createElement("div");
      item.className="celebration-paper-piece";
      const width=widthMin+Math.random()*(widthMax-widthMin);
      const height=heightMin+Math.random()*(heightMax-heightMin);
      const duration=durationMin+Math.random()*(durationMax-durationMin);
      const left=Math.random()*100;
      const xDrift=(Math.random()*drift-drift/2)+"px";
      const rotation=(Math.random()*720-360)+"deg";
      item.style.cssText=`left:${left}vw;width:${width}px;height:${height}px;background:${colors[Math.floor(Math.random()*colors.length)]};animation-duration:${duration}s;--fall-drift:${xDrift};--fall-rotate:${rotation}`;
      document.body.appendChild(item);
      setTimeout(()=>item.remove(),(duration+.3)*1000);
    },Math.random()*spreadDelay);
  }
}

const letterCutePopStyle=document.createElement("style");
letterCutePopStyle.textContent=`@keyframes letterCutePop{to{transform:translateY(-130px) translateX(var(--x, 20px)) rotate(320deg) scale(1.35);opacity:0}}`;
document.head.appendChild(letterCutePopStyle);

// v40: keep the Fashion icon note closed until she clicks it, then reveal the
// note, scroll to it, pause the normal song, and start the runway moment.
const fashionLetterShell=document.getElementById("fashionLetterShell");
const fashionLetterToggle=document.getElementById("fashionLetterToggle");
let fashionLetterOpened=false;

function openFashionLetter(){
  if(!fashionLetterShell||!fashionLetterToggle)return;
  fashionLetterShell.classList.remove("is-closed");
  fashionLetterShell.classList.add("is-open");
  fashionLetterToggle.setAttribute("aria-expanded","true");
  fashionLetterOpened=true;
  burstLetterCute();
  spawnCelebrationPaper({count:96,spreadDelay:2400,durationMin:2.8,durationMax:5.2});

  setTimeout(()=>{
    const stage=document.getElementById("fashionRunwayStage")||document.getElementById("fashionLetterCard")||fashionLetterShell;
    stage.scrollIntoView({behavior:"smooth", block:"center"});
  },140);

  // Start audio immediately inside the click gesture so browsers do not block it,
  // but reveal the theater after the envelope begins opening.
  startFashionRunway();
}

if(fashionLetterShell&&fashionLetterToggle){
  fashionLetterToggle.addEventListener("click",openFashionLetter);
}


// v23: cute pop for the Kuwait travel/candid cards
function travelMemoryPop(x,y){
  const icons=["✈","♡","🌸","✨","🥤","✈️","☁️","🧳"];
  for (let i = 0; i < 13; i++) {
    const item = document.createElement("div");
    const angle = Math.random() * Math.PI * 2;
    const startRadius = 18 + Math.random() * 42;
    const endRadius = 90 + Math.random() * 95;

    const startX = Math.cos(angle) * startRadius;
    const startY = Math.sin(angle) * startRadius;

    const endX = Math.cos(angle) * endRadius;
    const endY = Math.sin(angle) * endRadius - 55;

    item.textContent = icons[Math.floor(Math.random() * icons.length)];
    item.style.position = "fixed";
    item.style.left = (x + startX) + "px";
    item.style.top = (y + startY) + "px";
    item.style.pointerEvents = "none";
    item.style.zIndex = "9999";
    item.style.fontSize = (17 + Math.random() * 15) + "px";
    item.style.setProperty("--travel-x", endX + "px");
    item.style.setProperty("--travel-y", endY + "px");
    item.style.setProperty("--travel-rotate", (Math.random() * 520 - 260) + "deg");
    item.style.animation = `travelMemoryFloat ${1.25 + Math.random() * .75}s ease-out forwards`;

    document.body.appendChild(item);
    setTimeout(() => item.remove(), 2300);
  }
}

const travelMemoryStyle=document.createElement("style");
travelMemoryStyle.textContent=`@keyframes travelMemoryFloat{to{transform:translateY(-85px) translateX(22px) rotate(260deg) scale(1.2);opacity:0}}`;
document.head.appendChild(travelMemoryStyle);

document.querySelectorAll(".travel-pop-card").forEach(card=>{
  card.addEventListener("click",event=>travelMemoryPop(event.clientX,event.clientY));
});

// v25: school, career, and hangout cute click bursts
function themedMemoryPop(x,y,theme="cute"){
  const sets={
    school:["📚","✏️","♡","⭐","🍎"],
    career:["💼","✨","♡","📎","⭐"],
    hangout:["🎡","🎟️","✨","♡","🏹"]
  };
  const icons=sets[theme]||sets.cute||["♡","✨"];
  for(let i=0;i<14;i++){
    const item=document.createElement("div");
    item.textContent=icons[Math.floor(Math.random()*icons.length)];
    item.style.position="fixed";
    item.style.left=(x+(Math.random()*110-55))+"px";
    item.style.top=(y+(Math.random()*80-40))+"px";
    item.style.pointerEvents="none";
    item.style.zIndex="999";
    item.style.fontSize=(18+Math.random()*16)+"px";
    item.style.animation=`themedMemoryFloat ${1.75+Math.random()*.85}s ease-out forwards`;
    document.body.appendChild(item);
    setTimeout(()=>item.remove(),3000);
  }
}

const themedMemoryStyle=document.createElement("style");
themedMemoryStyle.textContent=`@keyframes themedMemoryFloat{to{transform:translateY(-132px) translateX(68px) rotate(280deg) scale(1.25);opacity:0}}`;
document.head.appendChild(themedMemoryStyle);

document.querySelectorAll(".school-pop-card").forEach(card=>card.addEventListener("click",event=>themedMemoryPop(event.clientX,event.clientY,"school")));
document.querySelectorAll(".career-nawy-section .memory-pop-card").forEach(card=>card.addEventListener("click",event=>themedMemoryPop(event.clientX,event.clientY,"career")));
document.querySelectorAll(".hangouts-section .memory-pop-card").forEach(card=>card.addEventListener("click",event=>themedMemoryPop(event.clientX,event.clientY,"hangout")));


// v26: cute classroom burst for Miss. Lily school photos
function schoolBurstFromElement(el){
  const icons=["📚","✏️","💗","⭐","🍎","♡","📝"];
  const rect=el.getBoundingClientRect();
  const cx=rect.left+rect.width/2;
  const cy=rect.top+rect.height/2;
  for(let i=0;i<30;i++){
    const piece=document.createElement("span");
    piece.className="school-float-piece";
    piece.textContent=icons[Math.floor(Math.random()*icons.length)];
    piece.style.left=cx+"px";
    piece.style.top=cy+"px";
    piece.style.setProperty("--dx",(Math.random()*380-190)+"px");
    piece.style.setProperty("--dy",(-120-Math.random()*250)+"px");
    document.body.appendChild(piece);
    setTimeout(()=>piece.remove(),2400);
  }
}

document.querySelectorAll(".school-pop-card").forEach(card=>{
  card.addEventListener("click",()=>schoolBurstFromElement(card));
});


// v27: special chapter open animations for travel and career sections
function chapterBurstFromElement(el, icons, count=28){
  if(!el)return;
  const rect=el.getBoundingClientRect();
  const cx=rect.left+rect.width/2;
  const cy=rect.top+rect.height/2;
  for(let i=0;i<count;i++){
    const piece=document.createElement("span");
    piece.className="school-float-piece";
    piece.textContent=icons[Math.floor(Math.random()*icons.length)];
    piece.style.left=cx+"px";
    piece.style.top=cy+"px";
    piece.style.setProperty("--dx",(Math.random()*440-220)+"px");
    piece.style.setProperty("--dy",(-120-Math.random()*270)+"px");
    document.body.appendChild(piece);
    setTimeout(()=>piece.remove(),2500);
  }
}

const journeyPlaneTicket=document.getElementById("journeyPlaneTicket");
if(journeyPlaneTicket){
  journeyPlaneTicket.addEventListener("click",()=>{
    const section=journeyPlaneTicket.closest(".kuwait-journey-section");
    section&&section.classList.add("trip-open");
    chapterBurstFromElement(journeyPlaneTicket,["✈️","☁️","♡","💕","🧳","✨","📍","🛂","🗺️","🎟️"],42);
    spawnFallingIcons(["☁️","🧳","🎟️","🗺️","📍","✈️"],{count:56,spreadDelay:2400,durationMin:3.1,durationMax:5.8,sizeMin:22,sizeMax:38,drift:150,rotate:false});
    // Keep the reveal in place so the ticket flies the chapter into the center without jumping the page.
  });
}

const careerBriefcaseCard=document.getElementById("careerBriefcaseCard");
if(careerBriefcaseCard){
  careerBriefcaseCard.addEventListener("click",()=>{
    const section=careerBriefcaseCard.closest(".career-nawy-section");
    section&&section.classList.add("career-open");
    chapterBurstFromElement(careerBriefcaseCard,["💼","📎","✨","♡","⭐","📄"],32);
    spawnFallingIcons(["💼","📄","📊","📎","🗂️","💻"],{count:52,spreadDelay:2200,durationMin:3,durationMax:5.3,sizeMin:20,sizeMax:34,drift:120,rotate:true});
    // Keep the reveal in place so the suitcase opens naturally without jumping the page.
  });
}

// v33 real final: open/close the "remember how special you are" envelope
const specialEnvelopeToggle=document.getElementById("specialEnvelopeToggle");
const specialReminderEnvelope=document.getElementById("specialReminderEnvelope");
if(specialEnvelopeToggle&&specialReminderEnvelope){
  specialEnvelopeToggle.addEventListener("click",event=>{
    const isOpen=specialReminderEnvelope.classList.toggle("open");
    specialEnvelopeToggle.setAttribute("aria-expanded",String(isOpen));
    const rect=specialEnvelopeToggle.getBoundingClientRect();
    chapterBurstFromElement(specialEnvelopeToggle,["♡","💕","🌸","✨","💌","⭐"],isOpen?36:16);
    if(isOpen)spawnFallingIcons(["💗","💕","💖","💘","♡","♥"],{count:90,spreadDelay:2600,durationMin:3.2,durationMax:5.8,sizeMin:22,sizeMax:38,drift:135,rotate:false});
  });
}

// v34: Love With KDD robust loader.
// Tries MP4 first like the Effortlessly Elegant card, then falls back to GIF filename variants.
(function(){
  const video=document.querySelector('.adaptive-kdd-video');
  const gif=document.querySelector('.adaptive-kdd-gif');
  if(!video||!gif)return;

  const gifCandidates=[];

  function showGif(index=0){
    if(index>=gifCandidates.length){
      video.classList.remove('hidden');
      gif.classList.add('hidden');
      return;
    }
    gif.onload=()=>{
      video.pause&&video.pause();
      video.classList.add('hidden');
      gif.classList.remove('hidden');
    };
    gif.onerror=()=>showGif(index+1);
    gif.src=gifCandidates[index];
  }

  video.addEventListener('loadeddata',()=>{
    gif.classList.add('hidden');
    video.classList.remove('hidden');
    video.play&&video.play().catch(()=>{});
  },{once:true});

  video.addEventListener('error',()=>showGif(0),{once:true});

  setTimeout(()=>{
    if(video.readyState<2)showGif(0);
  },1200);
})();

// v40: Fashion icon runway sequence.
// Add your song file at: image3/Britney Manson - FASHION.mp3
// Normal birthday music pauses while the Fashion icon section is active.
const fashionRunwayStage=document.getElementById("fashionRunwayStage");
const fashionRunwayAudio=document.getElementById("fashionRunwayAudio");
const runwayImage=document.getElementById("runwayImage");
const runwayBeatText=document.getElementById("runwayBeatText");
const fashionRunwayReplayButtons=[...document.querySelectorAll('#fashionRunwayReplay,[data-fashion-action="replay"]')];
const fashionRunwayMuteButtons=[...document.querySelectorAll('#fashionRunwayMute,[data-fashion-action="mute"]')];
const fashionRunwayCloseButtons=[...document.querySelectorAll('#fashionRunwayClose,[data-fashion-action="close"]')];
let fashionRunwayTimers=[];
let fashionRunwayActive=false;
let fashionModeActive=false;
let mainMusicWasOnBeforeRunway=false;

const fashionRunwaySequence=[
  {src:"./image3/Normal-1.jpeg", label:"Before the spotlight", kind:"normal", variant:"normal-a", duration:3366},
  {src:"./image4/Normal-2.jpeg", label:"A tiny spin", kind:"normal", variant:"normal-b", duration:3366},
  {src:"./image4/Normal-3.jpeg", label:"Runway ready", kind:"normal", variant:"normal-c", duration:3368},
  {src:"./image3/Birthday-white-dress.jpeg", label:"Fashion", kind:"dress", variant:"dress-a", duration:3200},
  {src:"./image3/Black-Dress.jpeg", label:"Fashion", kind:"dress", variant:"dress-b", duration:3200},
  {src:"./image4/Blue-Dress.jpeg", label:"Fashion", kind:"dress", variant:"dress-c", duration:3200},
  {src:"./image4/Event-Dress.jpeg", label:"Fashion", kind:"dress", variant:"dress-d", duration:3200},
  {src:"./image3/Red-Dress.jpeg", label:"Fashion", kind:"dress", variant:"dress-e", duration:3200},
  {src:"./image3/White-Dress.jpeg", label:"Fashion", kind:"dress", variant:"dress-f", duration:3200},
  {src:"./image3/graduation-dress.jpeg", label:"Fashion", kind:"dress", variant:"dress-g", duration:3200},
  {src:"./image4/Event-Black-dress.jpeg", label:"Fashion", kind:"dress", variant:"dress-h", duration:3200},
  {src:"./image3/Crimson-Dress.jpeg", label:"Crimson dress", kind:"dress", variant:"dress-i", duration:3200}
];

function clearFashionRunwayTimers(){
  fashionRunwayTimers.forEach(timer=>clearTimeout(timer));
  fashionRunwayTimers=[];
}

function playFashionCameraClick(){
  // Camera shutter sound removed.
  // Visual flashes are kept so the runway still feels cinematic.
}

function triggerRunwayCameraFlash(){
  if(!fashionRunwayStage)return;
  fashionRunwayStage.classList.remove("camera-flash-now");
  void fashionRunwayStage.offsetWidth;
  fashionRunwayStage.classList.add("camera-flash-now");
  setTimeout(()=>fashionRunwayStage.classList.remove("camera-flash-now"),520);
}

function showFashionRunwayItem(item){
  if(!runwayImage||!runwayBeatText)return;
  runwayImage.className="runway-image";
  void runwayImage.offsetWidth;
  runwayImage.src=item.src;
  runwayBeatText.textContent=item.label;
  runwayImage.classList.add(item.kind==="dress"?"dress-enter":"normal-enter", item.variant);
  triggerRunwayCameraFlash();
  playFashionCameraClick();
}

function hideFashionRunwayVisuals(){
  fashionRunwayActive=false;
  clearFashionRunwayTimers();
  document.body.classList.remove("fashion-runway-active");
  fashionRunwayStage&&fashionRunwayStage.classList.remove("active");
  fashionLetterShell&&fashionLetterShell.classList.remove("runway-playing");
}

function stopFashionMode({restoreMain=true, forceMainStart=false}={}){
  if(!fashionModeActive&&!fashionRunwayActive)return;
  fashionModeActive=false;
  hideFashionRunwayVisuals();
  if(fashionRunwayAudio){
    fashionRunwayAudio.pause();
    fashionRunwayAudio.currentTime=0;
  }

  // Do not call startMusic() here. The normal song may already have scheduled
  // Web Audio notes; restarting it can create duplicated normal music.
  if(restoreMain&&mainMusicWasOnBeforeRunway&&musicOn&&!globalMusicForcedOff){
    restoreMainBirthdayMusicAfterFashion();
  }

  mainMusicWasOnBeforeRunway=false;
}

function muteMainBirthdayMusicForFashion(){
  mainMusicTemporarilyMuted=true;
  if(masterGain&&audioContext&&audioContext.state!=="closed"){
    try{masterGain.gain.setTargetAtTime(.0001,audioContext.currentTime,.04)}catch(e){masterGain.gain.value=.0001}
  }
}

function restoreMainBirthdayMusicAfterFashion(){
  mainMusicTemporarilyMuted=false;
  if(musicOn&&masterGain&&audioContext&&audioContext.state!=="closed"){
    try{masterGain.gain.setTargetAtTime(normalMusicVolume,audioContext.currentTime,.08)}catch(e){masterGain.gain.value=normalMusicVolume}
  }
}

function startFashionRunway(){
  if(!fashionRunwayStage||!runwayImage||!fashionLetterOpened)return;
  stopFashionMode({restoreMain:false});
  fashionModeActive=true;
  fashionRunwayActive=true;
  mainMusicWasOnBeforeRunway=musicOn&&!globalMusicForcedOff;
  if(mainMusicWasOnBeforeRunway){
    // Temporarily mute the normal birthday music instead of stopping it.
    // This prevents queued Web Audio notes from restarting on top of each other.
    muteMainBirthdayMusicForFashion();
  }

  document.body.classList.add("fashion-runway-active");
  fashionRunwayStage.classList.add("active");
  fashionLetterShell&&fashionLetterShell.classList.add("runway-playing");

  if(fashionRunwayAudio){
    fashionRunwayAudio.loop=false;
    fashionRunwayAudio.muted=false;
    fashionRunwayMuteButtons.forEach(btn=>btn.textContent="♫ Mute");
    fashionRunwayAudio.currentTime=0;
    fashionRunwayAudio.volume=.2;
    fashionRunwayAudio.play().catch(()=>{
      runwayBeatText&&(runwayBeatText.textContent="Add image3/Britney Manson - FASHION.mp3");
    });
  }

  let offset=0;
  fashionRunwaySequence.forEach(item=>{
    fashionRunwayTimers.push(setTimeout(()=>showFashionRunwayItem(item),offset));
    offset+=item.duration;
  });

  // The overlay finishes after the runway sequence, but the normal song only returns
  // after she scrolls away from the Fashion icon section.
  fashionRunwayTimers.push(setTimeout(()=>hideFashionRunwayVisuals(),offset+450));
}


fashionRunwayCloseButtons.forEach(btn=>{
  btn.addEventListener("click",()=>{
    stopFashionMode({restoreMain:true});
  });
});

fashionRunwayReplayButtons.forEach(btn=>{
  btn.addEventListener("click",()=>{
    fashionLetterOpened=true;
    const stage=document.getElementById("fashionRunwayStage")||fashionLetterShell;
    if(stage)stage.scrollIntoView({behavior:"smooth", block:"center"});
    setTimeout(()=>startFashionRunway(),180);
  });
});

fashionRunwayMuteButtons.forEach(btn=>{
  btn.addEventListener("click",()=>{
    if(!fashionRunwayAudio)return;
    fashionRunwayAudio.muted=!fashionRunwayAudio.muted;
    const label=fashionRunwayAudio.muted?"♫ Unmute":"♫ Mute";
    fashionRunwayMuteButtons.forEach(muteBtn=>muteBtn.textContent=label);
  });
});

if(fashionRunwayAudio){
  fashionRunwayAudio.addEventListener("ended",()=>{
    // Restore the existing normal song volume only; do not restart it.
    if(fashionModeActive)stopFashionMode({restoreMain:true});
  });
}

// If she scrolls away from the Fashion icon section, stop the fashion song and return to the normal birthday music.
if(fashionLetterShell){
  const fashionSectionObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(fashionModeActive && !entry.isIntersecting){
        stopFashionMode({restoreMain:true});
      }
    });
  },{threshold:.04, rootMargin:"120px 0px 120px 0px"});
  fashionSectionObserver.observe(fashionLetterShell);
}


// v51: Egyptian temple reveal + cute temple click bursts
const templeOpenBtn=document.getElementById("templeOpenBtn");
const templeGallery=document.getElementById("templeGallery");
const egyptTemplesSection=document.getElementById("egyptTemplesSection");
function templeMemoryPop(x,y){
  const icons=["🏛","🇪🇬","✨","♡","🔺","🌊","🏺"];
  for(let i=0;i<18;i++){
    const item=document.createElement("div");
    item.textContent=icons[Math.floor(Math.random()*icons.length)];
    item.style.position="fixed";
    item.style.left=(x+(Math.random()*120-60))+"px";
    item.style.top=(y+(Math.random()*80-40))+"px";
    item.style.pointerEvents="none";
    item.style.zIndex="9999";
    item.style.fontSize=(18+Math.random()*18)+"px";
    item.style.animation=`templeMemoryFloat ${1.8+Math.random()*.9}s ease-out forwards`;
    document.body.appendChild(item);
    setTimeout(()=>item.remove(),3200);
  }
}
const templeMemoryFloatStyle=document.createElement("style");
templeMemoryFloatStyle.textContent=`@keyframes templeMemoryFloat{to{transform:translateY(-145px) translateX(60px) rotate(300deg) scale(1.25);opacity:0}}`;
document.head.appendChild(templeMemoryFloatStyle);

if(templeOpenBtn&&templeGallery&&egyptTemplesSection){
  templeOpenBtn.addEventListener("click",event=>{
    templeGallery.classList.toggle("hidden");
    const isOpen=!templeGallery.classList.contains("hidden");
    egyptTemplesSection.classList.toggle("is-open",isOpen);
    egyptTemplesSection.classList.toggle("is-closed",!isOpen);
    templeOpenBtn.setAttribute("aria-expanded",String(isOpen));
    templeOpenBtn.querySelector("span:nth-child(2)").textContent=isOpen?"Close the temple memories":"Click to open the temple memories";
    templeMemoryPop(event.clientX,event.clientY);
    if(isOpen){
      spawnSand(1.3);
      setTimeout(()=>templeGallery.scrollIntoView({behavior:"smooth",block:"start"}),120);
    }
  });
}

document.querySelectorAll(".temple-pop-card").forEach(card=>{
  card.addEventListener("click",event=>templeMemoryPop(event.clientX,event.clientY));
});

// v53 College Days certificate reveal
const collegeDaysSection=document.getElementById("collegeDaysSection");
const collegeCertificateToggle=document.getElementById("collegeCertificateToggle");
const collegeDaysContent=document.getElementById("collegeDaysContent");
if(collegeDaysSection&&collegeCertificateToggle&&collegeDaysContent){
  collegeCertificateToggle.addEventListener("click",()=>{
    const isOpen=collegeDaysSection.classList.toggle("is-open");
    collegeDaysSection.classList.toggle("is-closed",!isOpen);
    collegeDaysContent.classList.toggle("hidden",!isOpen);
    collegeCertificateToggle.setAttribute("aria-expanded",String(isOpen));
    collegeCertificateToggle.innerHTML=isOpen
      ? '<span>📜</span><span>Close the college memories</span><span>🎓</span>'
      : '<span>📜</span><span>Open the college memories</span><span>🎓</span>';
    if(isOpen){
      spawnFallingIcons(["🏆","🎓","📜","📚","✏️","⭐","✨"],{count:70,spreadDelay:2200,durationMin:2.6,durationMax:5.2,sizeMin:18,sizeMax:34});
      spawnCelebrationPaper({count:70,spreadDelay:1800,durationMin:2.4,durationMax:4.6});
      setTimeout(()=>collegeDaysSection.scrollIntoView({behavior:"smooth",block:"start"}),120);
    }
  });
}


// v55: Hangouts special opening animation
const hangoutsSection=document.getElementById("hangoutsSection");
const hangoutsOpenBtn=document.getElementById("hangoutsOpenBtn");
const hangoutsRevealContent=document.getElementById("hangoutsRevealContent");
if(hangoutsSection&&hangoutsOpenBtn&&hangoutsRevealContent){
  hangoutsOpenBtn.addEventListener("click",()=>{
    const isOpen=hangoutsSection.classList.toggle("is-open");
    hangoutsSection.classList.toggle("is-closed",!isOpen);
    hangoutsRevealContent.classList.toggle("hidden",!isOpen);
    hangoutsOpenBtn.setAttribute("aria-expanded",String(isOpen));
    hangoutsOpenBtn.innerHTML=isOpen
      ? '<span>🎟️</span><span>Close the hangout memories</span><span>🎡</span>'
      : '<span>🎟️</span><span>Open the hangout memories</span><span>🎡</span>';
    if(isOpen){
      chapterBurstFromElement(hangoutsOpenBtn,["🎟️","🎡","✨","♡","🎀","🏹","📸"],46);
      spawnFallingIcons(["🎟️","🎡","✨","♡","🎀","🏹"],{count:64,spreadDelay:2100,durationMin:2.8,durationMax:5.2,sizeMin:22,sizeMax:38,drift:150});
      setTimeout(()=>hangoutsSection.scrollIntoView({behavior:"smooth",block:"start"}),120);
    }
  });
}

// v55: add extra certificate-themed shower on College Days open
if(collegeDaysSection&&collegeCertificateToggle){
  collegeCertificateToggle.addEventListener("click",()=>{
    if(collegeDaysSection.classList.contains("is-open")){
      spawnFallingIcons(["🏆","🎓","📜","📜","📚","✏️","🏅","✨"],{count:92,spreadDelay:2600,durationMin:3,durationMax:5.6,sizeMin:20,sizeMax:40,drift:170});
    }
  });
}

// v57: Snow envelope reveal with heavy snow, snowmen, and Snowman.MP3 music
const snowMemorySection=document.getElementById("snowMemorySection");
const snowEnvelopeToggle=document.getElementById("snowEnvelopeToggle");
const snowMemoryContent=document.getElementById("snowMemoryContent");
const snowMemoryAudio=document.getElementById("snowMemoryAudio");
const snowMemoryMuteBtn=document.getElementById("snowMemoryMuteBtn");
let snowMusicActive=false;
let mainMusicWasOnBeforeSnow=false;

function snowShower(){
  const icons=["❄","❅","❆","✻","✼","☃️","⛄","🐧"];
  for(let i=0;i<180;i++){
    setTimeout(()=>{
      const item=document.createElement("div");
      item.className="snow-fall-piece";
      item.textContent=icons[Math.floor(Math.random()*icons.length)];
      const size=14+Math.random()*30;
      const duration=3.2+Math.random()*4.2;
      const drift=(Math.random()*180-90)+"px";
      const rotate=(Math.random()*720-360)+"deg";
      item.style.left=(Math.random()*100)+"vw";
      item.style.fontSize=size+"px";
      item.style.animationDuration=duration+"s";
      item.style.setProperty("--snow-drift",drift);
      item.style.setProperty("--snow-rotate",rotate);
      document.body.appendChild(item);
      setTimeout(()=>item.remove(),(duration+0.4)*1000);
    },Math.random()*3200);
  }
}

function setSnowMusicButtonState(){
  if(!snowMemoryMuteBtn)return;
  if(snowMusicActive){
    snowMemoryMuteBtn.textContent="♫ Mute snow song";
    snowMemoryMuteBtn.classList.remove("is-muted");
    snowMemoryMuteBtn.setAttribute("aria-pressed","false");
  }else{
    snowMemoryMuteBtn.textContent="♫ Re-enable snow song";
    snowMemoryMuteBtn.classList.add("is-muted");
    snowMemoryMuteBtn.setAttribute("aria-pressed","true");
  }
}

function startSnowMemoryMusic(){
  if(!snowMemoryAudio)return;

  if(typeof stopFashionMode==="function"){
    stopFashionMode({restoreMain:false});
  }

  mainMusicWasOnBeforeSnow=musicOn&&!globalMusicForcedOff;
  if(mainMusicWasOnBeforeSnow){
    // Same rule as Fashion: mute the normal song, do not stop/restart it.
    muteMainBirthdayMusicForFashion();
  }

  snowMusicActive=true;
  snowMemoryAudio.loop=true;
  snowMemoryAudio.muted=false;
  snowMemoryAudio.volume=.4;
  if(snowMemoryAudio.paused || snowMemoryAudio.ended){
    snowMemoryAudio.currentTime=0;
  }
  setSnowMusicButtonState();

  snowMemoryAudio.play().catch(()=>{
    if(snowMemoryMuteBtn){
      snowMemoryMuteBtn.textContent="Add Snowman.MP3";
      snowMemoryMuteBtn.classList.add("is-muted");
    }
  });
}

function stopSnowMemoryMusic({restoreMain=true}={}){
  if(!snowMemoryAudio)return;
  snowMusicActive=false;
  snowMemoryAudio.pause();
  snowMemoryAudio.currentTime=0;
  setSnowMusicButtonState();

  // Restore the already-running normal song only if it was on before Snow started.
  // Do not call startMusic(), because that can duplicate scheduled notes.
  if(restoreMain&&mainMusicWasOnBeforeSnow&&musicOn&&!globalMusicForcedOff){
    restoreMainBirthdayMusicAfterFashion();
  }

  mainMusicWasOnBeforeSnow=false;
}

if(snowMemorySection&&snowEnvelopeToggle&&snowMemoryContent){
  snowEnvelopeToggle.addEventListener("click",()=>{
    const isOpen=snowMemorySection.classList.toggle("is-open");
    snowMemorySection.classList.toggle("is-closed",!isOpen);
    snowMemoryContent.classList.toggle("hidden",!isOpen);
    snowEnvelopeToggle.setAttribute("aria-expanded",String(isOpen));
    if(isOpen){
      snowShower();
      startSnowMemoryMusic();
      setTimeout(()=>snowMemorySection.scrollIntoView({behavior:"smooth",block:"start"}),120);
    }else{
      stopSnowMemoryMusic({restoreMain:true});
    }
  });
}

if(snowMemoryMuteBtn){
  snowMemoryMuteBtn.addEventListener("click",()=>{
    if(snowMusicActive){
      stopSnowMemoryMusic({restoreMain:true});
    }else{
      startSnowMemoryMusic();
    }
  });
}

if(snowMemorySection){
  const snowSectionObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(snowMusicActive && !entry.isIntersecting){
        stopSnowMemoryMusic({restoreMain:true});
      }
    });
  },{threshold:.04, rootMargin:"120px 0px 120px 0px"});
  snowSectionObserver.observe(snowMemorySection);
}


// v71: Happy memories envelope reveal with camera-themed falling animation
const happyDaysSection=document.getElementById("happyDaysSection");
const happyEnvelopeToggle=document.getElementById("happyEnvelopeToggle");
const happyMemoryContent=document.getElementById("happyMemoryContent");

function launchHappyMemoryRain(){
  spawnFallingIcons(["📸","📷","💕","✨","♡","🎞️"],{
    count:54,
    durationMin:3.2,
    durationMax:5.8,
    spreadDelay:2400,
    sizeMin:18,
    sizeMax:34,
    drift:140,
    rotate:true
  });
  spawnCelebrationPaper({
    count:64,
    durationMin:2.8,
    durationMax:4.9,
    spreadDelay:1800,
    drift:150
  });
}

if(happyDaysSection&&happyEnvelopeToggle&&happyMemoryContent){
  happyEnvelopeToggle.addEventListener("click",()=>{
    const isOpen=happyDaysSection.classList.toggle("is-open");
    happyDaysSection.classList.toggle("is-closed",!isOpen);
    happyMemoryContent.classList.toggle("hidden",!isOpen);
    happyEnvelopeToggle.setAttribute("aria-expanded",String(isOpen));
    if(isOpen){
      launchHappyMemoryRain();
      setTimeout(()=>happyDaysSection.scrollIntoView({behavior:"smooth",block:"start"}),120);
    }
  });
}


// v58: final special envelope Loved outline heart animation
(function(){
  const heart=document.getElementById("lovedOutlineHeart");
  if(!heart)return;

  const points=[];
  // Keep the animated word-heart inside narrow phone screens.
  const availableHeartWidth=Math.min(760,Math.max(260,window.innerWidth-56));
  const scale=Math.min(15.5,Math.max(6.5,(availableHeartWidth-48)/32));

  for(let i=0;i<96;i++){
    const t=(Math.PI*2*i)/96;
    const x=16*Math.pow(Math.sin(t),3);
    const y=-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t));
    points.push({x:x*scale,y:y*scale-12});
  }

  points.forEach((p,index)=>{
    const el=document.createElement("div");
    el.className="loved-outline-heart-word is-visible";
    el.textContent="Loved";

    const rotate=((index%8)-4)*4;

    el.style.setProperty("--x",p.x.toFixed(2));
    el.style.setProperty("--y",p.y.toFixed(2));
    el.style.setProperty("--r",rotate+"deg");

    heart.appendChild(el);
  });

  const items=[...heart.querySelectorAll(".loved-outline-heart-word")];

  const hiddenCount=6;
  let hiddenQueue=[];

  for(let i=items.length-hiddenCount;i<items.length;i++){
    hiddenQueue.push(i);
  }

  function applyHidden(showIndex=null){
    items.forEach((item,index)=>{
      item.classList.remove("is-hidden","is-visible");

      if(hiddenQueue.includes(index)){
        item.classList.add("is-hidden");
      }else{
        item.classList.add("is-visible");
      }
    });
  }

  let nextToHide=0;

  function loop(){
    hiddenQueue.shift();
    hiddenQueue.push(nextToHide);

    nextToHide=(nextToHide+1)%items.length;

    while(hiddenQueue.includes(nextToHide)){
      nextToHide=(nextToHide+1)%items.length;
    }

    applyHidden();
  }

  applyHidden();
  setInterval(loop,120);
})();


// v72: main music control is defined near the top.
// It closes the Web Audio context on manual Music Off, and Fashion/Snow only
// mute/restore the normal song so queued notes are not duplicated.


// v61: Japan anime section open interaction
(function(){
  const section=document.getElementById("japanAnimeSection");
  const btn=document.getElementById("animeOpenBtn");
  const gallery=document.getElementById("japanAnimeGallery");
  if(!section || !btn || !gallery)return;

  btn.addEventListener("click",()=>{
    const isHidden=gallery.classList.contains("hidden");
    if(isHidden){
      gallery.classList.remove("hidden");
      section.classList.add("is-open");
      btn.setAttribute("aria-expanded","true");
      btn.innerHTML='<span class="anime-btn-icon">🌸</span> Close the Japan corner <span class="anime-btn-icon">⛩️</span>';

      if(typeof spawnFallingIcons==="function"){
        spawnFallingIcons(["🌸","✿","✨","♡","⛩️"],{
          count:46,
          durationMin:2.6,
          durationMax:4.8,
          spreadDelay:1600,
          sizeMin:18,
          sizeMax:32,
          drift:120
        });
      }

      setTimeout(()=>gallery.scrollIntoView({behavior:"smooth",block:"center"}),120);
    }else{
      gallery.classList.add("hidden");
      section.classList.remove("is-open");
      btn.setAttribute("aria-expanded","false");
      btn.innerHTML='<span class="anime-btn-icon">⛩️</span> Open the Japan corner <span class="anime-btn-icon">🌸</span>';
    }
  });
})();


// v67: Sakura petals when JP section opens
function spawnSakuraPetals(options={}){
  const {
    count=72,
    spreadDelay=2200,
    durationMin=3.2,
    durationMax=5.8,
    sizeMin=28,
    sizeMax=48,
    drift=180
  } = options;

  for(let i=0;i<count;i++){
    setTimeout(()=>{
      const petal=document.createElement("img");
      petal.className="falling-sakura-petal";
      petal.src="./image4/petals-Icon.png";
      petal.alt="Sakura Petal";

      const size=sizeMin+Math.random()*(sizeMax-sizeMin);
      const duration=durationMin+Math.random()*(durationMax-durationMin);
      const left=Math.random()*100;
      const xDrift=(Math.random()*drift-drift/2)+"px";
      const rotation=(Math.random()*720-360)+"deg";

      petal.style.left=left+"vw";
      petal.style.setProperty("--petal-size",size+"px");
      petal.style.setProperty("--petal-duration",duration+"s");
      petal.style.setProperty("--petal-drift",xDrift);
      petal.style.setProperty("--petal-rotate",rotation);

      document.body.appendChild(petal);
      setTimeout(()=>petal.remove(),(duration+.4)*1000);
    },Math.random()*spreadDelay);
  }
}

(function(){
  const btn=document.getElementById("animeOpenBtn");
  const gallery=document.getElementById("japanAnimeGallery");
  if(!btn || !gallery || btn.dataset.sakuraReady==="true")return;
  btn.dataset.sakuraReady="true";

  btn.addEventListener("click",()=>{
    setTimeout(()=>{
      if(!gallery.classList.contains("hidden")){
        spawnSakuraPetals({count:80,spreadDelay:2600});
      }
    },80);
  });
})();


// v74: Shared click animation for Japan, University Journey, Snow, and Happy Days.
// Same idea as travelMemoryPop: floating icons only, no image/card movement.
function createMemoryClickBurst(x,y,icons,options={}){
  const pool=(icons&&icons.length)?icons:["♡","✨","🌸"];
  const count=options.count||12;
  const spreadX=options.spreadX||120;
  const spreadY=options.spreadY||80;
  const durationMin=options.durationMin||1.1;
  const durationMax=options.durationMax||1.75;

  for(let i=0;i<count;i++){
    const item=document.createElement("div");
    item.className="memory-click-burst";
    item.textContent=pool[Math.floor(Math.random()*pool.length)];
    item.style.left=(x+(Math.random()*spreadX-spreadX/2))+"px";
    item.style.top=(y+(Math.random()*spreadY-spreadY/2))+"px";
    item.style.fontSize=(18+Math.random()*16)+"px";
    item.style.setProperty("--burst-x",(Math.random()*130-65)+"px");
    item.style.setProperty("--burst-y",(-55-Math.random()*80)+"px");
    item.style.setProperty("--burst-r",(Math.random()*460-230)+"deg");
    item.style.animationDuration=(durationMin+Math.random()*(durationMax-durationMin))+"s";
    item.style.animationDelay=(Math.random()*.08)+"s";
    document.body.appendChild(item);
    setTimeout(()=>item.remove(),2200);
  }
}

function addMemoryClickAnimation(selector,icons,options={}){
  document.querySelectorAll(selector).forEach(el=>{
    if(el.dataset.memoryClickReady==="true")return;
    el.dataset.memoryClickReady="true";

    el.addEventListener("click",event=>{
      // No memory-click-pop class here.
      // The media/card stays still; only the floating icons animate.
      createMemoryClickBurst(event.clientX,event.clientY,icons,options);
    });
  });
}

addMemoryClickAnimation(
  ".split-japan-card img, .anime-memory-card img",
  ["🌸","✿","♡","✨","⛩️"],
  {count:14}
);

addMemoryClickAnimation(
   ".university-journey-section .university-full-card, .family-warmth-section .photo-memory, .proud-graduation-section",
  ["🎓","📚","📜","🏆","⭐","✨","♡","💕"],
  {count:16,spreadX:150,spreadY:95}
);

addMemoryClickAnimation(
  ".snow-card img",
  ["❄","☃️","🐧","♡","✨"],
  {count:14}
);

addMemoryClickAnimation(
  ".happy-days-section .happy-feature-card img, .happy-days-section .happy-double-memory-media img, .happy-days-section .happy-triple-memory-media img, .happy-days-section .happy-single-memory-card img, .happy-days-section .happy-meme-side img, .happy-days-section .happy-placeholder-media, .happy-days-section .happy-video-frame",
  ["💕","✨","♡","🌸","📸"],
  {count:14}
);


// v80: Birthday + Lilies edit players.
// Both videos use the same focused modal treatment and temporarily mute the
// background birthday music while they are playing.
const birthdayEditOpen=document.getElementById("birthdayEditOpen");
const birthdayEditModal=document.getElementById("birthdayEditModal");
const birthdayEditClose=document.getElementById("birthdayEditClose");
const birthdayEditVideo=document.getElementById("birthdayEditVideo");
const liliesEditOpen=document.getElementById("liliesEditOpen");
const liliesEditModal=document.getElementById("liliesEditModal");
const liliesEditClose=document.getElementById("liliesEditClose");
const liliesEditVideo=document.getElementById("liliesEditVideo");

const editPlayers=[
  {trigger:birthdayEditOpen, modal:birthdayEditModal, close:birthdayEditClose, video:birthdayEditVideo},
  {trigger:liliesEditOpen, modal:liliesEditModal, close:liliesEditClose, video:liliesEditVideo}
].filter(player=>player.trigger&&player.modal&&player.close&&player.video);

// The birthday page is an isolated, very long layout. Moving each dialog to
// <body> keeps its fixed positioning tied to the viewport in every browser.
editPlayers.forEach(player=>{
  if(player.modal.parentElement!==document.body){
    document.body.appendChild(player.modal);
  }
});

let activeEditPlayer=null;
let mainMusicWasOnBeforeBirthdayEdit=false;
let birthdayEditPreviousBodyOverflow="";

function muteMainBirthdayMusicForEdit(){
  mainMusicTemporarilyMuted=true;
  if(masterGain&&audioContext&&audioContext.state!=="closed"){
    try{
      masterGain.gain.setTargetAtTime(.0001,audioContext.currentTime,.04);
    }catch(e){
      masterGain.gain.value=.0001;
    }
  }
}

function restoreMainBirthdayMusicAfterEdit(){
  mainMusicTemporarilyMuted=false;
  if(musicOn&&masterGain&&audioContext&&audioContext.state!=="closed"){
    try{
      masterGain.gain.setTargetAtTime(normalMusicVolume,audioContext.currentTime,.08);
    }catch(e){
      masterGain.gain.value=normalMusicVolume;
    }
  }
}

function openEditPlayer(player){
  if(!player||activeEditPlayer===player)return;
  if(activeEditPlayer){
    closeEditPlayer({restoreMain:false});
  }

  // Avoid overlapping any special-section soundtrack with either edit.
  if(typeof stopFashionMode==="function"){
    stopFashionMode({restoreMain:false});
  }
  if(typeof stopSnowMemoryMusic==="function"){
    stopSnowMemoryMusic({restoreMain:false});
  }

  mainMusicWasOnBeforeBirthdayEdit=musicOn&&!globalMusicForcedOff;
  if(mainMusicWasOnBeforeBirthdayEdit){
    muteMainBirthdayMusicForEdit();
  }

  activeEditPlayer=player;
  birthdayEditPreviousBodyOverflow=document.body.style.overflow;
  document.body.classList.add("birthday-edit-open");
  player.modal.classList.remove("hidden");
  player.modal.setAttribute("aria-hidden","false");

  player.video.currentTime=0;
  player.video.muted=false;
  player.video.volume=.9;
  player.video.play().catch(()=>{
    // Native controls remain available if a browser blocks the first play attempt.
  });

  setTimeout(()=>player.close.focus({preventScroll:true}),0);
}

function closeEditPlayer({restoreMain=true,resetVideo=true}={}){
  const player=activeEditPlayer;
  if(!player)return;

  player.video.pause();
  if(resetVideo)player.video.currentTime=0;

  activeEditPlayer=null;
  player.modal.classList.add("hidden");
  player.modal.setAttribute("aria-hidden","true");
  document.body.classList.remove("birthday-edit-open");
  document.body.style.overflow=birthdayEditPreviousBodyOverflow;

  if(restoreMain&&mainMusicWasOnBeforeBirthdayEdit&&musicOn&&!globalMusicForcedOff){
    restoreMainBirthdayMusicAfterEdit();
  }

  mainMusicWasOnBeforeBirthdayEdit=false;
  setTimeout(()=>player.trigger.focus({preventScroll:true}),0);
}

editPlayers.forEach(player=>{
  player.trigger.addEventListener("click",()=>openEditPlayer(player));
  player.close.addEventListener("click",()=>closeEditPlayer());

  player.modal.addEventListener("click",event=>{
    if(event.target===player.modal){
      closeEditPlayer();
    }
  });

  player.video.addEventListener("ended",()=>closeEditPlayer());
});

document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&activeEditPlayer){
    closeEditPlayer();
  }
});


// v79: nested "50 things I love about you" envelope under the Loved heart.
const qualitiesEnvelope=document.getElementById("qualitiesEnvelope");
const qualitiesEnvelopeToggle=document.getElementById("qualitiesEnvelopeToggle");
if(qualitiesEnvelope&&qualitiesEnvelopeToggle){
  qualitiesEnvelopeToggle.addEventListener("click",()=>{
    const isOpen=qualitiesEnvelope.classList.toggle("open");
    qualitiesEnvelopeToggle.setAttribute("aria-expanded",String(isOpen));

    if(typeof chapterBurstFromElement==="function"){
      chapterBurstFromElement(
        qualitiesEnvelopeToggle,
        ["💌","💗","♡","✨","🌸","💎","🎀"],
        isOpen?50:18
      );
    }

    if(isOpen&&typeof spawnFallingIcons==="function"){
      spawnFallingIcons(
        ["💌","💗","💕","♡","✨","💎","🎀"],
        {count:72,spreadDelay:2400,durationMin:2.8,durationMax:5.4,sizeMin:18,sizeMax:34,drift:130,rotate:true}
      );

      // Keep the page exactly where she opened the envelope.
      // The letter expands underneath without jumping to the section header.
    }
  });
}
