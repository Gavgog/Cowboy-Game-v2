const framerate = 60;
const canvas = document.getElementById("gameCanvas");
const board = canvas.getContext('2d');
canvas.focus();
canvas.tabIndex = 0;

let key = {};
const gameComplexity = 10;

const xDiff = 400;
const yDiff = 300;

let cameraMode = "Player";
let messager = {text:"", timer:0,urgent:true};

let camera = {xPos:xDiff,yPos:yDiff,yVel:0,xVel:0};
let player = {xPos:20,yPos:20,yVel:0,xVel:0,shoottimer:0,width:20,height:30};
let playerInfo = {coins:100, attackCoolDown:0,attack:10,health:100,maxHealth:100,weapon:null};
let playerInv = [];

let mousex = 0;
let mousey = 0;
let pointerx = 0;
let pointery = 0;

let eOn = false;
let eRel = false;

let drawArrayA = [];

function tree(xPos, yPos){
  this.xpos = xPos;
  this.ypos = yPos
}

let buildItems = [["Apple Tree",15],["Oak Tree",7],["Maple Tree",10],["Box",1],["Loot Box",10],["Treasure Tree",50]];
let buildingNow = [];
let menuDetails = {type:"",items:[],index:0};

let mapbounds = 600;

let timeNow = 0;
let ticker = 0;

let cointemplate = {xpos:100,ypos:100,xvel:0,ypos:0,value:1, type:'Static', sType:"Coin", color:"#FDD835",width:10,height:10};

class Keyboard{
    constructor(){
        this.key = {};
        this.keyRel = {};
        this.keyHold = {};
        this.keyOn = {};
        this.ph = {};
    }

    keyIsPressed(num) {
        if (this.keyOn[num]){
            this.keyOn[num] = false;
            return true;
        }
        return false;
    }

    keyIsDown(num) {
        if (this.key[num]){
            return true;
        }
        return false;
    }

    keyDown(num){
        this.stateChange(num);
    }

    keyUp(num){
        this.keyRel[num] = true;
        this.stateChange(num);
    }

    stateChange(num){
        this.keyRel[num] = !this.key[num] && this.keyHold[num];

        this.keyHold[num] = (this.key[num] && this.keyOn[num]) || (this.key[num] && this.keyHold[num]);

        this.keyOn[num] = this.key[num] && !this.keyHold[num];
    }

}

let keyboard = new Keyboard();


class weapon{
    constructor(name,damage,fireRate){
        this.name = name;
        this.type = "weapon";
        this.style = "";
        this.damage = damage;
        this.fireRate = fireRate;
        this.coolDown = 0;
    }

    attack(){

    }
}

class gun extends weapon{
    constructor(name,damage,fireRate){
        super(name,damage,fireRate);
        this.name = name;
        this.type = "weapon";
        this.style = "range";
        this.damage = damage;
        this.fireRate = fireRate;
        this.coolDown = -1;
        this.bulletVelocity = 5;
    }

    attack(author,x,y,xdir,ydir){
        if (this.coolDown < 0){
            this.coolDown = this.fireRate;
            let bullet = new Bullet(author,x,y,xdir*this.bulletVelocity,ydir*this.bulletVelocity,this.damage);
            drawArrayA.push(bullet);
        }
        this.coolDown -= framerate/1000;
    }
}

class Bullet{
    constructor(author,xpos,ypos,xvel,yvel,damage){
        this.type = "bullet";
        this.xpos = xpos;
        this.ypos = ypos;
        this.xvel = xvel;
        this.yvel = yvel;
        this.life = 10;
        this.damage = damage;
        this.width = Math.max(3,damage/5);
        this.height = Math.max(3,damage/5);
        this.color = "#000000";
        this.fName = "bullet";
        this.friction = 1;
        this.author = author;
    }

    checkCollisions(){
        for (let i = 0;i < drawArrayA.length;i++){
            let block = drawArrayA[i];
            if (block.type === "AI"){
                if (collidesWith(this,block)){
                    if (block === this.author)continue;
                    block.hit(this.damage);
                    this.life = 0;
                }
            }
        }
        if (this.author !== "player" &&collidesWithPlayer(this)){
            hitPlayer(this.damage,this.xvel,this.yvel);
            this.life = 0;
        }
    }

    move(){
        this.life -= framerate/1000;
        this.xpos += this.xvel;
        this.ypos += this.yvel;

        this.checkCollisions();

        return this.life > 0
    }

}

class NPC{
    constructor(){
        let gender = "M";
        if (getRandomInt(1) == 1) gender = "F";
        this.type = "AI";
        this.xpos = getRandomInt(mapbounds*2)-mapbounds;
        this.ypos = getRandomInt(mapbounds*2)-mapbounds;
        this.xvel = 0;
        this.yvel = 0;
        this.speed = 1;
        this.xdest = getRandomInt(mapbounds*2)-mapbounds;
        this.ydest = getRandomInt(mapbounds*2)-mapbounds;
        this.xwait = getRandomInt(50);
        this.ywait = getRandomInt(50);
        this.width = 20;
        this.height = 30;
        this.gender = gender;
        this.color = "#b20f5c";
        this.fName = generateName();
        this.lName = generateName();
        this.hovered = 0;
        this.likes = 0;
        this.fear = 0;
        this.money = getRandomInt(100);
        this.talkQueue = [];
        this.introduced = false;
        this.hostileTo = [];
        this.health = 20+getRandomInt(20);
        this.weapon = null;
    }

    mug(){

        if (this.fear > 20){
            //successful mugging
            this.say("Please dont hurt me");
            let amount = Math.floor(this.money/2);
            spawncoins(this.xpos,this.ypos,amount);
            this.money -= amount;
            this.likes -= 30;
            this.fear += 10;
        }else if (this.fear < 0){
            this.say("Im not afraid of you");
            this.makeHostile();
        }else{
            this.say("Im not afraid of you");
            this.likes -= 30;
        }
    }

    chat(){

        if (this.likes <= -50){
            notify('NPC dislikes you too much to talk');
        }
        if (this.fear > 50){
            notify('NPC is too afraid to talk');
        }
        openMenu("chat")
    }

    info(){
        this.talk("Hi Player")
    }

    banter(){

        if (this.likes > -50){
            if (this.fear < 10) this.likes += 2;
            else this.likes += 1;
        }
        if (this.likes > 0){
            if (this.fear < 10) this.likes += 5;
            else this.likes += 1;
            if (this.fear > 0) this.fear -= 1
        }
    }

    intimidate(){

        if (this.likes > 50)this.likes -= 2;
        else this.fear += 5;
    }

    sayHi(){
        if (this.introduced) {
            this.talk(this.say("Hi player"));
            this.introduced = true;
        }
    }

    sayBye(){
        if (!this.introduced) {
            this.talk(this.say("Bye player"));
            this.introduced = false;
        }
    }

    barter(){

        if (this.likes <= -50){
            notify('NPC dislikes you too much to trade');
        }
        if (this.fear > 50){
            notify('NPC is too afraid of you to trade');
        }
    }

    duel(){
        closeMenu();
        this.makeHostile();
        this.inDuel = true;
        this.holt = true;
        startDuel(this);
    }

    talk(){
        if (this.hovered < 0){
            if (this.talkQueue.length > 0){
                this.talkQueue.splice(0,1);
                this.hovered = 3;
            }
        }
        if (this.talkQueue.length > 0) this.words = this.talkQueue[0];
    }

    interupt(whatToSay){
        this.talkQueue = [whatToSay];
        this.hovered = 3;
    }

    say(whatToSay){
        if (this.hostileTo.length > 0) return;
        if (this.talkQueue[this.talkQueue.length-1] !== whatToSay) {
            this.talkQueue.push(whatToSay);
        }
    }

    taunt(){
        if (this.fear > 50){
            this.interupt("I dont know about this")
        }else if (this.fear > 10){
            this.interupt("I hope this goes well")
        }else{
            this.interupt("Its over")
        }
    }

    makeHostile(){
        this.hostileTo.push("player");
        this.speed = 1.6;
        this.color = "#ff3333"
    }

    act() {

        if (this.countDownTimer > 0){
            this.countDownTimer -= framerate/1000;
            return
        }

        if (this.hostileTo.length === 0) this.roam();
        else this.combat();
    }

    combat(){
        if (this.hostileTo.indexOf("player") >= 0){
            //attacking player
            if (this.weapon === null) {
                //attack melee
                this.MeleePlayer()

            }else if (this.weapon.style === "range") {
                //attack with ranged weapon
                this.moveToShootPlayer();
                this.shootPlayer();
            }
        }
    }

    MeleePlayer(){
        this.setTarget(player.xPos, player.yPos);
        this.moveTowardsTarget();
        if (collidesWithPlayer(this)){
            hitPlayer(5,this.xvel,this.yvel);
            this.xvel = -this.xvel*2
            this.yvel = -this.yvel*2
        }
    }

    moveToShootPlayer(){
        let xdiff = this.xpos - player.xPos;
        let ydiff = this.ypos - player.yPos;

        if (Math.abs(xdiff) < Math.abs(ydiff)){
            if (xdiff < -15) this.xvel = this.speed;
            else if (xdiff > 15) this.xvel = -this.speed;
        }else{
            if (ydiff < -15) this.yvel = this.speed;
            else if (ydiff > 15) this.yvel = -this.speed;
        }
    }

    shootPlayer(){
        let xdiff = this.xpos - player.xPos;
        let ydiff = this.ypos - player.yPos;

        let xdir = 0;
        let ydir = 0;

        if (xdiff > 50) xdir = -1;
        else if (xdiff < -50) xdir = 1;

        if (ydiff > 50) ydir = -1;
        else if (ydiff < -50) ydir = 1;

        if (xdir * ydir !== 0)return;


        this.weapon.attack(this,this.xpos,this.ypos,xdir,ydir);
    }


    setTarget(x,y){
        this.xdest = x;
        this.ydest = y;
    }

    moveTowardsTarget(){
        if (Math.abs(this.ydest - this.ypos) > 1) this.yvel = this.speed * ((this.ydest - this.ypos) / Math.abs(this.ydest - this.ypos));
        if (Math.abs(this.xdest - this.xpos) > 1) this.xvel = this.speed *((this.xdest - this.xpos) / Math.abs(this.xdest - this.xpos));

        if (Math.abs(this.ydest - this.ypos) < 1) this.ypos = this.ydest;
        if (Math.abs(this.xdest - this.xpos) < 1) this.xpos = this.xdest;
    }

    roam(){
        if (this.ywait < 0 && Math.abs(this.ydest - this.ypos) < 1) this.ywait = getRandomInt(50); //create random wait time
        if (this.ywait >= 0 && (Math.abs(this.ydest - this.ypos) < 1)){//if standing
            this.ywait -= framerate/1000;//wait
            if (this.ywait < 0) this.ydest = getRandomInt(mapbounds*2)-mapbounds;//if wait time is up get new destination
        }

        if (this.xwait < 0 && Math.abs(this.xdest - this.xpos) < 1) this.xwait = getRandomInt(50); //create random wait time
        if (this.xwait >= 0 && (Math.abs(this.xdest - this.xpos) < 1)){//if standing
            this.xwait -= framerate/1000;//wait
            if (this.xwait < 0) this.xdest = getRandomInt(mapbounds*2)-mapbounds;//if wait time is up get new destination
        }

        if (this.holt === true){
            if (isInInteractionRange(this.xpos,this.ypos) === false){
                this.holt = false;
                this.sayBye();
                closeMenu()
            }
        } else {
            this.moveTowardsTarget();
        }
    }

    die(){
        this.alive = false;
        spawncoins(this.xpos,this.ypos,this.money);

    }

    hit(damage){
        this.health -= damage;
        this.attacked = 3;
        if (this.attacked % 3 === 0)  this.xvel -= this.attacked/8.5;
        this.xpos += this.attacked;
        if (this.attacked % 3 === 0)  this.yvel += this.attacked/8.5;
        this.ypos -= this.attacked;
        if (this.health < 0)this.die();
    }
}

class FloatingItem {
    constructor(x,y){
        this.xpos = x;
        this.ypos = y;
        this.xvel = 0;
        this.yvel = 0;
        this.value = 0;
        this.type = 'floating';
        this.sType = "Coin";
        this.color = "#FF0000";
        this.width = 10;
        this.height = 10;
    }

    floatTowardsPlayer(){
        let xdiff = this.xpos - player.xPos;
        let ydiff = this.ypos - player.yPos;
        let maxDraw = 80;
        let xSpeed = (maxDraw - Math.abs(xdiff))/40;
        let ySpeed = (maxDraw - Math.abs(ydiff))/40;


        if (xdiff > 5) this.xvel = -xSpeed;
        else if (xdiff < -5) this.xvel = xSpeed;

        if (ydiff > 5) this.yvel = -ySpeed;
        else if (ydiff < -5)this.yvel = ySpeed;
    }

    checkCollected(i){
        let xdiff = this.xpos - player.xPos;
        let ydiff = this.ypos - player.yPos;
        if(Math.abs(xdiff) < 10 && Math.abs(ydiff) < 10){
            playerInfo.coins += this.value;
            drawArrayA.splice(i,1);
        }
    }
}

class Coin extends FloatingItem{
    constructor(value,x,y){
        super(x,y);
        this.xpos = x;
        this.ypos = y;
        this.xvel = 0;
        this.yvel = 0;
        this.value = value;
        this.type = 'Static';
        this.sType = "Coin";
        this.color = "#FDD835";
        this.width = 10;
        this.height = 10;
    }
}


class Block {
    constructor(x,y,name){
        this.sType = "block";
        this.xpos = x;
        this.ypos = y;
        this.width = 20;
        this.height = 20;
        this.viewcolor = false;
        this.color = "#0F0F0F";
        this.fName = name;
        this.lName = "";
        this.words = "";
        this.stage = 1;
        this.life = timeNow;
        this.health = 100;
        this.hovered = 0;
        this.alive = true;
    };
    hit(){
        this.health -= playerInfo.attack;
        this.attacked = 3;
        if (this.attacked % 3 === 0)  this.xvel -= this.attacked/8.5;
        this.xpos += this.attacked;
        if (this.attacked % 3 === 0)  this.yvel += this.attacked/8.5;
        this.ypos -= this.attacked;
        if (this.health < 0)this.die();
    }
    interact(){
    }

    die(){
        this.alive = false;
    }
}

class Tree extends Block{
    constructor(x,y,name,value){
        super(x,y,name);
        this.sType = "tree";
        this.xpos = x;
        this.ypos = y;
        this.xvel = 0;
        this.yvel = 0;
        this.width = 20;
        this.height = 20;
        this.viewcolor = false;
        this.color = "#7FEF7F";
        this.fName = name;
        this.lName = "";
        this.words = "";
        this.value = value;
        this.stage = 1;
        this.life = timeNow;
        this.health = 100;
        this.hovered = 0;
    };

    grow(){
        if(timeNow - this.life > this.stage * 60) {
            this.stage += 1;
        }
    }

    interact(){
        this.hovered = 1;
        this.words = "[e] to chop " + this.fName;
        if (playerInfo.attackCoolDown <= 0){
            if(keyboard.keyIsDown(69)){
                this.hit();
                playerInfo.attackCoolDown = 2;
            }
        }
    }
}

class Chest extends Block{
    constructor(x,y,name,value){
        super(x,y,name);
        this.sType = "chest";
        this.xpos = x;
        this.ypos = y;
        this.xvel = 0;
        this.yvel = 0;
        this.width = 20;
        this.height = 20;
        this.viewcolor = false;
        this.color = "#7FEF7F";
        this.fName = name;
        this.lName = "";
        this.words = "";
        this.value = value;
        this.stage = 1;
        this.life = timeNow;
        this.health = 100;
        this.hovered = 0;
    };

    interact(){
        this.hovered = 1;
        this.words = "[e] to open " + this.fName;
        if (playerInfo.attackCoolDown <= 0){
            if(keyboard.keyIsDown(69)) {
                this.hit();
                playerInfo.attackCoolDown = 2;
            }
        }
    }
}

class Box extends Block{
    constructor(x,y,name){
        super(x,y,name);
        this.sType = "box";
        this.xpos = x;
        this.ypos = y;
        this.xvel = 0;
        this.yvel = 0;
        this.width = 20;
        this.height = 20;
        this.viewcolor = false;
        this.color = "#795548";
        this.fName = name;
        this.lName = "";
        this.words = "";
        this.value = getRandomInt(10);
        this.stage = 1;
        this.life = timeNow;
        this.health = getRandomInt(15);
        this.hovered = 0;
        this.alive = true;
    };

    interact(){
        this.hovered = 1;
        this.words = "[e] to break " + this.fName;
        if (playerInfo.attackCoolDown <= 0){
            if(keyboard.keyIsDown(69)) {
                this.hit();
                playerInfo.attackCoolDown = 2;
            }
        }
    }

    die(){
        this.alive = false;
        spawncoins(this.xpos,this.ypos,this.value);
    }
}



let itemDictionary = [
    {name:"Apple Tree",   value:15, str:5,  sType:"tree", stage:0, life:0,  health:100},
    {name:"Oak Tree",     value:7,  str:5,  sType:"tree", stage:0, life:0,  health:100},
    {name:"Maple Tree",   value:10, str:5,  sType:"tree", stage:0, life:0,  health:100},
    {name:"Treasure Tree",value:50, str:5,  sType:"tree", stage:0, life:0,  health:100},

    {name:"Loot Box",     value:10, str:15, sType:"chest",  health:50},
    {name:"Box",          value:1,  str:1,  sType:"chest",  health:50}
]
/*
let mNamesNP = [{'Aaron':'AronRonRonnieRonny'},{'Abel':'AbeAbie'},{'Abner':'AbAbbie'},{'Abraham':'AbramAbeAbieBram'},{'Adam':'AdAddieAddyAde'},{'Adelbert':'AdalbertAdAdeAlBertBertieDel'},{'Adrian':'Ade'},{'Alan':'AllanAllenAl'},{'Albert':'AlBertBertie'},{'Alexander':'AlAlexAlecAleckLexSandySander'},{'Alfred':'AlAlfAlfieFredFreddieFreddy'},{'Algernon':'AlgieAlgyAlger'},{'Alister':'AllisterAlistairAlastairAlasterAl'},{'Alonso':'AlonzoAlLonLonnieLonny'},{'Alphonso':'AlfonsoAlAlfAlfieAlonsoLon'},{'Alva':'AlvahAlvanAl'},{'Alvin':'AlwinAlwynAlVinVinnyWin'},{'Ambrose':'AmbieBrose'},{'Amos':''},{'Andrew':'AndyDrew'},{'Angus':'Gus'},{'Anselm':'AnselAnse'},{'Anthony':'AntonyAntonTony'},{'Archibald':'ArchArchieBaldie'},{'Arnold':'Arnie'},{'Arthur':'ArtArtie'},{'Augustus':'AugustAugieGusGussyGustGustus'},{'Augustine':'AugustinAugieAustinGusGussyGust'},{'Austin':'(seeAugustine)'},{'Avery':'Avy'},{'Baldwin':'BaldieWin'},{'Barrett':'BarryBarrie'},{'Bartholomew':'BartBartyBartlettBartleyBatBatty'},{'Basil':'BazBasie'},{'Benedict':'BenBennieBenny'},{'Benjamin':'BenBennieBennyBenjyBenjie'},{'Bennet':'BennettBenBennieBenny'},{'Bernard':'BarnardBernieBerneyBarneyBarnie'},{'Bert':'Bertie(seeAlbertAdelbertBertramDelbertEgbertElbertGilbertHerbertHubertLambertOsbertRobertWilbert)'},{'Berthold':'BertBertie'},{'Bertram':'BertrandBertBertie'},{'Bill':'BillyBillie(SeeWilliamWillis)'},{'Blair':''},{'Blake':''},{'Boris':''},{'Bradford':'BradFord'},{'Bradley':'Brad'},{'Brady':''},{'Brandon':'BrandenBrandBrandy'},{'Brenton':'Brent'},{'Bret':'Brett'},{'Brian':'BryanBryant'},{'Broderick':'BrodieBrodyBradyRickRicky'},{'Bruce':''},{'Bruno':''},{'Burton':'Burt'},{'Byron':'RonRonnieRonny'},{'Caleb':'Cal'},{'Calvin':'CalVinVinny'},{'Cameron':'CamRonRonny'},{'Carey':'CaryCarry'},{'Carl':'Karl'},{'Carol':'CarrolCarroll'},{'Casey':'Kasey'},{'Caspar':'CasperCasCass'},{'Cassius':'CasCass'},{'Cecil':'Cis'},{'Cedric':'CedRickRicky'},{'Charles':'CharlieCharleyChuckChadChas'},{'Chester':'Chet'},{'Christian':'ChrisChristyKit'},{'Christopher':'KristopherChrisKrisCrisChristyKitKesterKristofTophTopher'},{'Clarence':'ClareClair'},{'Clare':'Clair'},{'Clark':'Clarke'},{'Claude':'Claud'},{'Clayton':'Clay'},{'Clement':'Clem'},{'Clifford':'CliffFord'},{'Clinton':'Clint'},{'Clive':''},{'Clyde':''},{'Cody':''},{'Colin':'CollinCole'},{'Conrad':'ConConnieConny'},{'Corey':'Cory'},{'Cornelius':'ConnieConnyCornyCorneyCory'},{'Craig':''},{'Curtis':'Curt'},{'Cyril':'Cy'},{'Cyrus':'Cy'},{'Dale':''},{'Daniel':'DanDanny'},{'Darrell':'DarrelDarrylDarylDarry'},{'David':'DaveDaveyDavieDavy'},{'Dean':'Deane'},{'Delbert':'DelBertBertie'},{'Dennis':'DenisDenDenny'},{'Derek':'DerrickDerryRickRicky'},{'Desmond':'Des'},{'Dexter':'Dex'},{'Dominic':'DominickDomenicDomenickDomNickNicky'},{'Don':'DonnieDonny'},{'Donald':'DonDonnieDonny'},{'Donovan':'DonDonnieDonny'},{'Dorian':''},{'Douglas':'DouglassDoug'},{'Doyle':''},{'Drew':'(seeAndrew)'},{'Duane':'Dwayne'},{'Dudley':'DudDuddy'},{'Duke':''},{'Duncan':'DunnyDunk'},{'Dustin':'Dusty'},{'Dwight':''},{'Dylan':'Dillon'},{'Earl':'Earle'},{'Edgar':'EdEddieEddyNed'},{'Edmund':'EdmondEdEddieEddyNedTed'},{'Edward':'EdEddieEddyNedTedTeddy'},{'Edwin':'EdEddieEddyNed'},{'Egbert':'BertBertie'},{'Elbert':'ElBertBertie'},{'Eldred':'El'},{'Elijah':'EliasEliLige'},{'Elliot':'ElliottEl'},{'Ellis':'El'},{'Elmer':'El'},{'Elton':'AltonElAl'},{'Elvin':'ElwinElwynElVinVinnyWin'},{'Elvis':'El'},{'Elwood':'ElWoody'},{'Emery':'EmmeryEmoryEm'},{'Emil':'EmileEm'},{'Emmanuel':'EmanuelImmanuelManuelMannyMannie'},{'Emmet':'EmmettEm'},{'Eric':'ErikErickRickRicky'},{'Ernest':'EarnestErnie'},{'Errol':''},{'Ervin':'ErwinIrvinIrvineIrvingIrwinErvVinWin'},{'Ethan':''},{'Eugene':'Gene'},{'Eustace':'StacyStacey'},{'Evan':'Ev'},{'Everard':'Ev'},{'Everett':'Ev'},{'Fabian':'FabeFab'},{'Felix':'Lix'},{'Ferdinand':'FerdieFredFreddie'},{'Fergus':'FergusonFergie'},{'Floyd':'Floy(seeLloyd)'},{'Ford':'(seeBradfordCliffordSanford)'},{'Francis':'FrankFrankieFrankyFran'},{'Franklin':'FranklynFrankFrankieFranky'},{'Frederick':'FredericFredrickFredricFredFreddieFreddyRickRicky'},{'Fred':'Freddie(seeAlfredFrederickWilfredWinfred)'},{'Gabriel':'GabeGabby'},{'Garrett':'GarretGaryGarr'},{'Geoffrey':'JeffreyJefferyJeff'},{'George':'GeorgieGeordie'},{'Gerald':'GerardGerryJerry'},{'Gilbert':'GilBert'},{'Glenn':'Glen'},{'Gordon':'GordyDon'},{'Graham':''},{'Grant':''},{'Gregory':'GregorGregGregg'},{'Griffith':'GriffinGriff'},{'Guy':''},{'Harold':'HalHarry'},{'Harris':'HarrisonHarry'},{'Harvey':'Harve'},{'Hector':''},{'Henry':'HarryHankHal'},{'Herbert':'HerbBertBertie'},{'Herman':'MannyMannie'},{'Hilary':'HillaryHillHillieHilly'},{'Homer':''},{'Horace':'Horatio'},{'Howard':'Howie'},{'Hubert':'HughBertBertieHube'},{'Hugh':'HughieHugo'},{'Humphrey':'HumphryHumph'},{'Ian':''},{'Ignatius':'IggyNate'},{'Immanuel':'MannyMannie(seeEmmanuel)'},{'Irvin':'IrvineIrvingIrwin(seeErvin)'},{'Isaac':'IsaakIke'},{'Isidore':'IsidorIsadoreIsadorIzzy'},{'Ivor':''},{'Jack':'JackieJacky(seeJohn)'},{'Jacob':'JakeJay'},{'James':'JimJimmyJimmieJamieJem'},{'Jared':'Jerry'},{'Jarvis':'JervisJerry'},{'Jason':'Jay'},{'Jasper':'Jay'},{'Jefferson':'Jeff'},{'Jeffrey':'JefferyGeoffreyJeff'},{'Jeremy':'JeremiahJerry'},{'Jerome':'Jerry'},{'Jesse':'JessJessieJessy'},{'Joel':'Joe'},{'John':'JackJackieJackyJohnny'},{'Jonathan':'JonJonny'},{'Joseph':'JoeJoeyJoJosJody'},{'Joshua':'Josh'},{'Judson':'JudSonny'},{'Julian':'JuliusJuleJules'},{'Justin':'JusJust'},{'Karl':'Carl'},{'Keith':''},{'Kelly':'Kelley'},{'Kelvin':'KelKelly'},{'Kendall':'KenKenny'},{'Kendrick':'KenKennyRickRicky'},{'Kenneth':'KenKenny'},{'Kent':'KenKenny'},{'Kevin':'Kev'},{'Kirk':''},{'Kristopher':'KristoferKrisKitKester(seeChristopher)'},{'Kurt':'Curt'},{'Kyle':''},{'Lambert':'Bert'},{'Lamont':'MontyMonte'},{'Lancelot':'LauncelotLance'},{'Laurence':'LawrenceLorenceLorenzoLarryLarsLaurieLawrieLorenLauren'},{'Lee':'Leigh'},{'Leo':'LeonLee'},{'Leonard':'LeoLeonLenLennyLennie'},{'Leopold':'LeoPoldie'},{'Leroy':'LeeroyLeeRoy'},{'Leslie':'LesleyLes'},{'Lester':'Les'},{'Lewis':'LewLewie'},{'Lincoln':'LinLincLynn'},{'Lindon':'LyndonLinLynn'},{'Lindsay':'LindseyLinLynn'},{'Linus':''},{'Lionel':'LeoLeon'},{'Llewellyn':'LlewLyn'},{'Lloyd':'LoydLoydeFloydLoyFloy'},{'Logan':''},{'Lonnie':'Lonny(seeAlonso)'},{'Louis':'LouLouie'},{'Lowell':'Lovell'},{'Lucian':'LuciusLuLuke'},{'Luke':'LucasLuke'},{'Luther':'LootLuth'},{'Lyle':'Lyall'},{'Lynn':''},{'Malcolm':'MalMalcMac'},{'Manuel':'MannyMannie(seeEmmanuel)'},{'Marion':''},{'Mark':'MarcMarcusMarkMarc'},{'Marshall':'Marshal'},{'Martin':'MartMarty'},{'Marvin':'MervinMarvMerv'},{'Matthew':'MattMatMattyMattie'},{'Matthias':'MattMatMattyMattie'},{'Maurice':'MorrisMorryMoreyMoe'},{'Maximilian':'Max'},{'Maxwell':'Max'},{'Maynard':''},{'Melvin':'Mel'},{'Merlin':'Merle'},{'Merrill':'MerrilMerill'},{'Michael':'MikeMikeyMickMickeyMicky'},{'Miles':'MylesMilo'},{'Milo':''},{'Milton':'Milt'},{'Mitchell':'Mitch'},{'Monroe':'Munroe'},{'Montague':'MontyMonte'},{'Montgomery':'MontyMonte'},{'Morgan':'Mo'},{'Mortimer':'MortMorty'},{'Morton':'MortMorty'},{'Moses':'MoMoeMoseMoss'},{'Murray':'Murry'},{'Nathan':'NathanielNatNateNatty'},{'Neal':'Neil'},{'Nelson':'NelNellNels'},{'Nevill':'NevilNevileNevilleNev'},{'Newton':'Newt'},{'Nicholas':'NicolasNickNickyNicolColeColin'},{'Nigel':'Nige'},{'Noah':''},{'Noel':'Nowell'},{'Norbert':'Bert'},{'Norris':'NorNorrie'},{'Norman':'NormNormieNorNorrie'},{'Norton':'Nort'},{'Oliver':'OllieNollNollieNolly'},{'Orson':''},{'Orville':'OrvOllie'},{'Osbert':'OssyOzzieOzzyBert'},{'Osborn':'OsborneOssyOzzieOzzy'},{'Oscar':'OsOssy'},{'Osmond':'OsmundOssyOzzieOzzy'},{'Oswald':'OswoldOsOssyOzOzzieOzzy'},{'Otis':''},{'Owen':''},{'Patrick':'PatPaddyPatsy'},{'Paul':'Pauly'},{'Percival':'PercevalPercyPerce'},{'Perry':''},{'Peter':'PetePetiePetey'},{'Philip':'PhillipPhilPip'},{'Preston':''},{'Quentin':'QuintinQuentonQuintonQuinn'},{'Quincy':'QuinceyQuinn'},{'Ralph':'RaffRafeRalphy'},{'Randall':'RandalRandRandy'},{'Randolph':'RandRandyDolph'},{'Raphael':'RafaelRaffRafe'},{'Raymond':'RaymundRay'},{'Reginald':'RegReggieRennyRex'},{'Rene':''},{'Reuben':'RubenRubinRubeRuby'},{'Reynold':'Ray'},{'Richard':'DickRickRickyRichRichie'},{'Rick':'Ricky(seeCedricDerekEricFrederickRichardRodericBroderickKendrick)'},{'Robert':'BobBobbieBobbyDobRobRobbieRobbyRobinBert'},{'Roderic':'RoderickRodRoddyRickRicky'},{'Rodney':'RodRoddy'},{'Roger':'RodgerRodRoddyRodgeRoge'},{'Roland':'RowlandRollyRolyRowlyOrlando'},{'Rolph':'RolfRolfe(seeRudolph)'},{'Roman':'RomRomy'},{'Ronald':'RonRonnieRonny'},{'Ron':'RonnieRonny(seeAaronByronCameronRonald)'},{'Roscoe':'Ross'},{'Ross':''},{'Roy':''},{'Rudolph':'RudolfRudyRolfRolphDolphDolf'},{'Rufus':'Rufe'},{'Rupert':''},{'Russell':'RusselRuss'},{'Ryan':''},{'Samson':'SampsonSamSammy'},{'Samuel':'SamSammy'},{'Sanford':'SandyFord'},{'Saul':''},{'Scott':'Scotty'},{'Sean':'ShaunShawnShane'},{'Sebastian':'SebBass'},{'Serge':''},{'Seth':''},{'Seymour':'MoreySy'},{'Shannon':'Shanon'},{'Sheldon':'ShellyShelDon'},{'Shelley':'ShellyShellieShel'},{'Sherman':''},{'Shelton':'ShellyShelTony'},{'Sidney':'SydneySidSyd'},{'Silas':'SiSy'},{'Silvester':'SylvesterSylVester'},{'Simeon':'SimSimieSimmy'},{'Simon':'SiSySimSimieSimmy'},{'Solomon':'SolSollySal'},{'Sonny':'Son'},{'Spencer':''},{'Stacy':'Stacey(seeEustace)'},{'Stanley':'Stan'},{'Stephen':'StevenStephanSteffanStefanSteveStevieStephSteffStef'},{'Stuart':'StewartStuStew'},{'Terence':'TerrenceTerranceTerry'},{'Thaddeus':'ThadeusTadThad'},{'Theodore':'TheodorTedTeddyTheoTerry'},{'Thomas':'TomTommy'},{'Timothy':'TimTimmy'},{'Tobias':'TobyTobiTobie'},{'Todd':''},{'Tony':'(seeAnthony)'},{'Tracy':'Tracey'},{'Travis':'Trav'},{'Trenton':'Trent'},{'Trevor':'Trev'},{'Tristram':'TristamTristanTris'},{'Troy':''},{'Tyler':'Ty'},{'Tyrone':'TyronTy'},{'Ulysses':'UlyUliLyss'},{'Uriah':'UriasUriUria'},{'Valentine':'ValentinVal'},{'Valerian':'ValeriusVal'},{'Van':''},{'Vance':'Van'},{'Vaughan':'Vaughn'},{'Vernon':'VernVerne'},{'Victor':'VicVick'},{'Vincent':'VinceVinVinny'},{'Virgil':'VergilVirge'},{'Wallace':'WallisWallyWallie'},{'Waldo':''},{'Walter':'WaltWallyWallie'},{'Warren':''},{'Wayne':''},{'Wesley':'Wes'},{'Wendell':'DellDel'},{'Wilbert':'WillWillieWillyBert'},{'Wilbur':'WilberWillWillieWilly'},{'Wiley':'WillWillieWilly'},{'Wilfred':'WilfridWillWillieWillyFredFreddieFreddy'},{'Willard':'WillWillieWilly'},{'William':'BillBillyBillieWillWillieWillyLiam'},{'Willis':'BillBillyBillieWillWillieWilly'},{'Wilson':'WillWillieWilly'},{'Winfred':'WinfridWinWinnieWinnyFredFreddieFreddy'},{'Winston':'WinWinnieWinny'},{'Woodrow':'WoodWoody'},{'Xavier':'Zave'},{'Zachary':'ZachariahZachariasZackZackyZac'}]
let fNamesNP = [{'Abigail':'AbbieAbbyGailNabby'},{'Ada':'Adie'},{'Adelaide':'AddieAdelaDellDellaHeidi'},{'Adele':'AdelleAdelaAddieDellDella'},{'Adeline':'AdelinaAdalineAddieAlineDellDella'},{'Adrienne':'AdrianaAdie'},{'Agatha':'Aggie'},{'Agnes':'AggieNessNessie'},{'Aileen':'EileenAleneAllieLena'},{'Alana':'AllieLana'},{'Alberta':'AllieBertie'},{'Albertina':'AlbertineAllieBertieTina'},{'Alexandra':'AlexandriaAlexAlixAlexaAllaAllieAliLexySandraSandy'},{'Alexis':'Alex'},{'Alfreda':'AlfieAlfyFriedaFredaFreddieFreddy'},{'Alice':'AliciaAlyceAlisaAlissaAlyssaAllieAllyAliElsieLisa'},{'Alison':'AllisonAlysonAllysonAllieAllyAli'},{'Alma':''},{'Althea':'Thea'},{'Alvina':'AlvenaVinaVinnieVinny'},{'Amabel':'MabelMabMabsMabbie(seeMabel)'},{'Amanda':'Mandy'},{'Amber':''},{'Amelia':'AmaliaAmyMillieMilly'},{'Amy':'AimeeAmie'},{'Anastasia':'AnaStacyStacey'},{'Andrea':'Andy'},{'Angela':'AngelicaAngelinaAngelineAngelAngie'},{'Anita':'AnaNita'},{'Anna':'AnnAnneAnnAnnieNancyNancieNanceNanNanaNannyNanetteNannetteNina'},{'Annabel':'AnnabelleAnabelAnnAnnaBelBelleBell'},{'Annette':'AnnettaAnnieNettaNettieNetty'},{'Anthea':'Thea'},{'Antoinette':'NettieNettyNetNettaToniTonyToyToi'},{'Antonia':'ToniTonyTonyaTonia'},{'April':''},{'Arabella':'ArabelArabelleBelBellBelleBella'},{'Arlene':'ArlineArleenArlyneLenaArlyLynn'},{'Ashley':'Ash'},{'Audrey':'AudraAudieDee'},{'Augusta':'AggyAugieGussieGustaGusty'},{'Augustina':'AggyAugieGussieGustaGustyInaTina'},{'Aurora':'OrrieRori'},{'Ava':''},{'Barbara':'BabBabsBabbieBarbieBabette'},{'Beatrice':'BeatrixBeaBeeBeattieTrixieTrissieTrissy'},{'Belinda':'BelBellBelleLindaLindyLinLynn'},{'Belle':'BellBelBella(seeAnnabelArabellaIsabelRosabelBelinda)'},{'Berenice':'BerniceBernie'},{'Bertha':'BertaBertie'},{'Betty':'(seeElizabeth)'},{'Beverly':'BeverleyBev'},{'Blair':'Blaire'},{'Blanche':'Blanch'},{'Blythe':'Blithe'},{'Bonnie':'Bonny'},{'Brenda':'BrendieBrandy'},{'Brett':'BretBretta'},{'Bridget':'BridgetteBrigidBrigitBiddieBiddyBridieBrideyBrieBreeBrita'},{'Brittany':'BrittneyBritneyBritBrittBritaBrie'},{'Camille':'CamillaCamileCamilaCammieCammyMillie'},{'Candace':'CandiceCandy'},{'Caren':'CarinCarynCarrie'},{'Carla':'CarlieCarly(seeCaroline)'},{'Carlotta':'CarlotaLottaLottieLotty(seeCharlotte)'},{'Carmen':''},{'Carol':'CaroleCarrolCarrollKarolCarrieCarry(seeCaroline)'},{'Caroline':'CarolynCarolinaCarlyneCarlineKarolineCarrieCarryCaddieCaddyCarlieCarlyCallieCallyCarolLynnLynneLinLina'},{'Cassandra':'CassCassieCasseyCaseySandraSandy'},{'Catherine':'CathrynCatherynCatharineCathleenCatCattieCattyCathieCathyCassieKitKittyKittie'},{'Cecilia':'CecilliaCeceliaCecileCecilyCicelyCisCissySissyCelia'},{'Celeste':'CelieLessie'},{'Celestine':'CelestinaCelieLessieTina'},{'Celia':'CelieCel'},{'Celine':'Celina(seeSelina)'},{'Charity':'ChattieChattyCherry'},{'Charlene':'CharleenCharlineCharlyneCharlieLynn'},{'Charlotte':'LottaLottieLottyLolaLolitaChattieCharlie'},{'Cheryl':'CherieCheri'},{'Christine':'ChristinaChristianaChristianChrisChristyChristieChristaChrissieKitTina'},{'Clara':'ClaireClareClair'},{'Clarice':'ClarissaClaraClareClair'},{'Claudia':'ClaudineClaudetteClaudie'},{'Clemency':'ClemClemmie'},{'Clementine':'ClementinaClemClemmieTina'},{'Colleen':'ColeenLena'},{'Constance':'ConnieConnyConnee'},{'Cora':'CoriCorrieCoreyCory'},{'Cordelia':'CordyCoriDelia'},{'Corinne':'CorinnaCorynneCorrineCorineCorinaCoraCoriCorrieCory'},{'Cornelia':'ConnieConnyCornyCoriNellNellie'},{'Courtney':'CourtCourtie'},{'Crystal':'ChrystalCrysChris'},{'Cynthia':'Cindy'},{'Daisy':'Daysie'},{'Danielle':'DanielaDaniDanny'},{'Daphne':'DaphDaphie'},{'Darlene':'DarleenDarlyneLenaDarla'},{'Deborah':'DebbieDebbyDebra'},{'Delia':'DellDella'},{'Delilah':'DellDellaLila'},{'Dell':'Della(seeAdelaideAdeleAdelineDeliaDelilah)'},{'Denise':'DeniceDenyseDenny'},{'Diana':'DianeDianneDi'},{'Dinah':'DinaDi'},{'Dolores':'DeloresLolaLolita'},{'Dominique':'DominicaMinnieNickiNikki'},{'Donna':''},{'Dora':'DorrieDori(seeDorothy)'},{'Doreen':'DoreneDorrie'},{'Doris':'DorrisDorrie'},{'Dorothy':'DorotheaDoraDorrieDollDollyDodieDotDottieDottyDee'},{'Edith':'EdythEdytheEdieEdyeDee'},{'Edna':'Eddie'},{'Elaine':'AlaineHelaineEllieEllyLainie'},{'Eleanor':'ElinorEleonoraEleonoreElenoreEllaEllieEllyNellNellieNellyNoraLallyLallie'},{'Elisa':'ElizaElisiaElissaEliseElyseElsaElsie(seeElizabeth)'},{'Elizabeth':'ElisabethBettyBettieBetBettBetteBettaBetsyBetseyBetsiBethBessBessieBessyBettinaElsieElisaElsaElizaEllieEllyIlseLizLizzyLizzieLizaLisaLiseLisetteLizetteLisbetLizbethLibby'},{'Ella':'EllieEllyNellieNelly(seeEleanorElaineHelen)'},{'Ellen':'(seeHelen)'},{'Eloise':'HeloiseLois'},{'Elsie':'(seeAliceElizabeth)'},{'Elvina':'ElvineVinaVinnieVinny'},{'Elvira':'AlviraElvieElva'},{'Emily':'EmilieEmiliaEmEmmyEmmieMillieMilly'},{'Emma':'EmEmmEmmyEmmie'},{'Erica':'ErikaErickaRickyRickie'},{'Erin':''},{'Ernestine':'EarnestineErnaErnieTina'},{'Estella':'EstelleEssieEssyStella'},{'Esther':'EsterHesterEssieEssyEttieEttyHettieHettyHessy'},{'Ethel':'Eth'},{'Etta':'EttieEtty(seeHenriettaEstherLorettaMarietta)'},{'Eugenia':'EugenieGeneGenie'},{'Eulalia':'EulaLallyLallie'},{'Eunice':'EunyEunie'},{'Euphemia':'EuphemieEffieEffyEuphiePhemie'},{'Eustacia':'StacyStaceyStacia'},{'Eve':'EvaEvie'},{'Eveline':'EvelynEvelynneEveleenEvelinaEveEvieEvvieLynn'},{'Evangeline':'EvangelinaEveEvieAngieLynn'},{'Faith':'FaeFayFaye'},{'Felicia':'FelicityFeliceFeeFel'},{'Florence':'FloFloyFlossFlossieFlossyFloraFlorrie'},{'Frances':'FanFannieFannyFranFrannieFrannyFrancieFrancyFranceFrankieFranky'},{'Francesca':'FranciscaFranCesca'},{'Francine':'FanFannieFannyFranFrannieFrannyFrancieFrancyFranceFrankieFranky'},{'Frederica':'FrederikaFrederickaFredaFreddieFreddyRickyRickie'},{'Gabrielle':'GabrielaGabriellaGabbyGabiGaby'},{'Genevieve':'GeneGinnyJennyViv'},{'Georgina':'GeorgineGeorgieGina'},{'Geraldine':'GerryGerrieGerriJerryDina'},{'Gertrude':'GertieTrudieTrudy'},{'Gillian':'JillianJill'},{'Gina':'(seeReginaGeorgina)'},{'Gladys':'Glad'},{'Glenda':'Glen'},{'Gloria':'Glory'},{'Goldie':'Goldy'},{'Grace':'Gracie'},{'Gwendolen':'GwendolynGwenGwendaWendy'},{'Hannah':'HannaAnnAnnieNanaNanny'},{'Harriet':'HattieHatty'},{'Hazel':''},{'Heather':'HettieHetty'},{'Helen':'HelenaElenaEllenNellNellieNellyEllieEllyLenaLalaLallyLallie'},{'Helga':''},{'Henrietta':'EttaEttieEttyHettieHettyNettieNetty'},{'Hester':'(seeEsther)'},{'Hilary':'HillaryHillHillieHilly'},{'Hilda':'HyldaHildie'},{'Holly':''},{'Honora':'HonoriaHonorNoraNorahHoney'},{'Hope':''},{'Ida':''},{'Imogen':'ImogeneImmyImmie'},{'Ingrid':''},{'Irene':'RenieRena'},{'Iris':''},{'Irma':'Erma'},{'Isabel':'IsabelleIsabellaBelBellBelleBellaIssyIzzyTibbie'},{'Isadora':'IsidoraIssyIzzyDora'},{'Jacqueline':'JacquelynJackieJacky'},{'Jamesina':'JamieJaymeJaime'},{'Jane':'JanieJaneyJennyJennieJenJanet'},{'Janet':'JanetteJanettaJanNettieNettyNetta'},{'Janice':'JanisJeniceJan'},{'Jean':'JeanneJeanieJeannie'},{'Jeannette':'JeannettaJeanetteJeanieJeannieNettieNettyNetta'},{'Jemima':'JemJemmaMimaMimi'},{'Jennifer':'JenJennyJennieJenne'},{'Jenny':'(seeJaneJenniferVirginiaGenevieve)'},{'Jessica':'JessJessie'},{'Jill':'(seeGillian)'},{'Joanna':'JoanneJoannJohannaJoanJoJody'},{'Joceline':'JocelynJoLynn'},{'Josephine':'JosephaJoJosieJoseyJozyJodyPheny'},{'Joyce':'Joy'},{'Judith':'JudyJudieJudeJodyJodie'},{'Julia':'JulieJule'},{'Julianne':'JulianaJulieJule'},{'Juliet':'JulietteJulieJule'},{'June':''},{'Justina':'JustineTina'},{'Karen':'KarinKarynKariKarrie'},{'Katherine':'KatharineKathrynKathrineKathrynneKatrinaKateKathieKathyKatieKatyKayKattyKattieKitKittyKittie'},{'Kathleen':'KathleneKathlynKathlynneKathieKathyKatieKatyKattyKattie'},{'Kelly':'KellieKelliKelley'},{'Kimberly':'KimberleyKim'},{'Kristina':'KristinKristineKristenKrisKristiKristyKristieKrista'},{'Laura':'LaurieLauriLolly'},{'Laureen':'LaureneLaurenaLaurineLaurenLaurie'},{'Laurel':'Laurie'},{'Laverne':'LavernaVernaVerna'},{'Lavinia':'VinaVinnie'},{'Leah':'LeaLeeLeigh'},{'Leila':'LeilahLelaLila'},{'Lena':'(seeHelenAileenArleneDarleneMagdalene)'},{'Leona':'LeeLeonie'},{'Leonora':'LeonoreLenoraLenoreNora'},{'Leslie':'LesleyLes'},{'Leticia':'LetitiaLettieTisha'},{'Lillian':'LilianLilyLillyLiliLilliLilLillie'},{'Lily':'LillyLiliLilliLilLillie'},{'Linda':'LyndaLindyLinLynnLynne'},{'Lindsay':'LindseyLinLynn'},{'Lisa':'(seeAliceElizabethMelissa'},{'Lois':'(seeEloiseLouise)'},{'Lona':'LoniLonieLonnie'},{'Lora':'LoriLorieLorriLorrie'},{'Lorena':'LoreneLoreenLorineLoriLorieLorriLorrie'},{'Lorna':''},{'Loretta':'LoretteLoriLorrieEttaRetta'},{'Lorinda':'LaurindaLoriLorieLorrieLaurie'},{'Lorraine':'LorrainLoraineLoraLoriLorieLorrie'},{'Lottie':'LottyLotta(seeCharlotteCarlotta)'},{'Louise':'LouisaLouLuLuluLulaLois'},{'Lucille':'LucileLuLucyLucky'},{'Lucinda':'LuLucyLuckyCindy'},{'Lucy':'LucieLuciLuciaLuLuluLuceLucky(seeLucilleLucinda)'},{'Lydia':'LiddyLyddie'},{'Lynn':'Lynne(seeCarolineMarilynLindaArleneEvelynandothernameswith-line/lyn)'},{'Mabel':'MabelleMableMabMabsMabbie(seeAmabel)'},{'Madeleine':'MadelineMadelynMaddieMaddyMady'},{'Magdalene':'MagdalenMagdalenaMagdalineMagdaMagsieLena'},{'Marcia':'MarcieMarcyMarci'},{'Margaret':'MargaritaMargueriteMargretMaggieMargeMargieMarjorieMargeryMadgeMargotMargoMagsieMaisieDaisyMamieMaidieMaeMayMegMeganPeggyGretaGretchenRita'},{'Marianne':'MariannaMaryannMaryanneMarianMaryAnn'},{'Marilyn':'MarilynnMarylinMarleneMarlynMaryLynn'},{'Maribel':'MaribelleMaryBell'},{'Marietta':'MariettMarietteMaryEttaEttieEtty'},{'Marina':''},{'Marion':''},{'Marjorie':'MarjoryMargeryMargeMargie(seeMargaret)'},{'Martha':'MartaMartyMartieMatMattieMattyPatPattiePatty'},{'Martina':'MartineMartyMartie'},{'Mary':'MariaMarie'},{'Mary':'MaeMayMollMollyMolliePollyMamieMimiMinnie'},{'Matilda':'MathildaMatMattieMattyMaudMaudePattyPattieTildaTillieTilly'},{'Maud':'MaudeMaudieMaudy(seeMatilda)'},{'Maureen':'MaureneMauraMary'},{'Maxine':'MaxMaxie'},{'Megan':'Meg(seeMargaret)'},{'Melanie':'MelanyMelMellie'},{'Melinda':'MelMellieLindaMindy'},{'Melissa':'MelMellieMissieMissyLisaLissa'},{'Mercedes':'MercySadie'},{'Meredith':'Merry'},{'Michelle':'MicheleMickeyShelly'},{'Mildred':'MillieMilly'},{'Millicent':'MilicentMelicentMillieMilly'},{'Minnie':'MinnaMina(seeWilhelminaMary)'},{'Mirabel':'MirabellaMiraBella'},{'Miranda':'Randy'},{'Miriam':'MyriamMimiMiriMira'},{'Moira':'Moyra'},{'Molly':'MollieMollPolly(seeMary)'},{'Mona':''},{'Monica':'Nicki'},{'Morgan':''},{'Muriel':''},{'Myra':'Mira'},{'Myrtle':''},{'Nadine':'NadaDee'},{'Natalie':'NathalieNataliaNatashaNattieNatty'},{'Nancy':'(seeAnna)'},{'Nell':'NelleNellieNelly(seeEleanorHelenCornelia)'},{'Nettie':'NettyNetta(seeAnnetteAntoinetteHenriettaJanetJeannette)'},{'Nicki':'(seeDominiqueMonicaNicoleVeronica)'},{'Nicole':'NickyNickiNikkiNikky'},{'Nina':'(seeAnna)'},{'Noel':'NoelleElle'},{'Nora':'NorahNorrieNorry'},{'Nora':'(seeEleanorLeonoraNoreenHonora)'},{'Noreen':'NoreneNora'},{'Norma':'Normie'},{'Octavia':'TaveTavyTavia'},{'Olive':'OliviaOllieOllyNollieLivLivvyLivia'},{'Olympia':''},{'Ophelia':''},{'Pamela':'PamPammiePammy'},{'Pansy':''},{'Patricia':'PatPattyPattiPattiePatsyTriciaTrishaTrishTrissieTrissy'},{'Paula':'PaulinaPaulinePaulie'},{'Pearl':'Pearlie'},{'Peggy':'Peg(seeMargaret)'},{'Penelope':'PenPenny'},{'Phoebe':'PhebePheb'},{'Phyllis':'PhylPhylliePhil'},{'Polly':'(seeMaryMolly)'},{'Priscilla':'Prissy'},{'Prudence':'PrudiePrudyPruePru'},{'Rachel':'RachieRaeRayRache'},{'Raquel':'KellyKellie'},{'Rebecca':'RebekahBeckyBeckieBeccaBeckReba'},{'Regina':'ReggieRayGinaGinnyRena'},{'Renata':'NataNatieRennieRennyRenae'},{'Renee':'(seeRenata)'},{'Rhoda':'Rodie'},{'Rhonda':''},{'Roberta':'RobbieRobbyRobinRobynBobbieBobbyBertaBertie'},{'Rose':'RosaRosieRosy'},{'Rosabel':'RosabelleRosabellaRoseRosieRosyBell'},{'Rosalie':'RosaleeRoseRosieRosy'},{'Rosaline':'RosalynRoseRosieRosy'},{'Rosalind':'RosalindaRoseRosieRosyLinda'},{'Roseanna':'RosannaRosanneRoseRosieRosy'},{'Rosemary':'RosemarieRoseRosieRosy'},{'Rowena':'RonaRonie'},{'Roxanne':'RoxannaRoxanaRoxieRoxy'},{'Ruby':'RubinaRubyRubie'},{'Ruth':'Ruthie'},{'Sabrina':'BrinaSabby'},{'Samantha':'SamSammieSammy'},{'Sarah':'SaraSalSallySallieSadie'},{'Selina':'SelenaSeleneCelineCelinaCelenaLenaLina'},{'Selma':'Selmie'},{'Shannon':'Shanon'},{'Sharon':'SharronSharenSharynShariSharrie'},{'Shauna':'ShawnaSheena'},{'Sheila':''},{'Shelley':'ShellyShellie'},{'Shirley':'ShirleeShirlieShirl'},{'Sibyl':'SybilSibylleSybillSybleSibSibbieSibby'},{'Sidney':'SydneySidSyd'},{'Sonia':'Sonya'},{'Sophia':'SophieSophy'},{'Stacy':'StaceyStacieStaci(seeAnastasiaEustacia)'},{'Stephanie':'StephanyStephaniaStephanaStefanieStefaniaStefanaSteffanieStephStephieSteffSteffyStevie'},{'Stella':'(seeEstelle)'},{'Susan':'SusannaSusannahSusanneSuzanneSueSusieSusiSusySuzieSuzySukie'},{'Sylvia':'SilviaSylSylvie'},{'Tabitha':'Tabby'},{'Tamara':'TamarTammyTammie'},{'Tanya':'Tania'},{'Teresa':'TheresaThereseTerryTerriTeriTerrieTessTessaTessieTracyTrissieTrissy'},{'Theodora':'DoraTheo'},{'Thelma':''},{'Tiffany':'TiffTiffy'},{'Tina':'(seeChristineErnestineBettinaAlbertinaAugustinaClementinaJustina)'},{'Tracy':'TraceyTracieTraci(seeTeresa)'},{'Ulrica':'Ulrika'},{'Una':''},{'Ursula':'UrsaUrsieSulie'},{'Valentina':'ValVallie'},{'Valerie':'ValeryValeriaValVallie'},{'Vanessa':'VanVannieVannaNessaEssa'},{'Vera':''},{'Verna':'(seeLaverne)'},{'Veronica':'NickyNickiRonnieRonniRonny'},{'Victoria':'VicVickVickieVickyVickiVikiVikki'},{'Vida':''},{'Viola':'Vi'},{'Violet':'VioletteViolettaViLettie'},{'Virginia':'GingerGinnyJinnyJennyVirgie'},{'Vivian':'VivienViv'},{'Wanda':''},{'Wendy':'(seeGwendolen)'},{'Wilhelmina':'WillaWilmaWillieBillieMinaMinnie'},{'Wilma':''},{'Winifred':'WinnieFredaFreddie'},{'Yolanda':'Yolande'},{'Yvonne':'VonnieVonna'},{'Yvette':'VettieVetta'},{'Zoe':'Zoey'}]
*/
window.onload = function(){
  initGame();
  setInterval(game,1000/framerate);
};
/*
canvas.onkeyup = function(e){
  e = e || event;
  key[e.keyCode] = e.type === 'keydown';
};

canvas.onkeydown = function(e){
  e = e || event;
  key[e.keyCode] = e.type === 'keydown';
};
*/
canvas.onkeyup = function(e){
    e = e || event;
    keyboard.key[e.keyCode] = e.type === 'keydown';
    keyboard.keyUp(e.keyCode);
};



canvas.onkeydown = function(e){
    e = e || event;
    keyboard.key[e.keyCode] = e.type === 'keydown';
    keyboard.keyDown(e.keyCode);
};


canvas.addEventListener('mousemove', function(evt) {
  var mousePos = getMousePos(canvas, evt);

  mousex = mousePos.x;
  mousey = mousePos.y;
}, false);


function randName(gender){
	if (gender == "m") return Object.keys(mNamesNP[getRandomInt(mNamesNP.length)]);
  return "garry"
	//return Object.keys(fNamesNP[getRandomInt(fNamesNP.length)])
}

function collidesWith(object1,object2){
    let points = [];
    points.push([object1.xpos,object1.ypos]);
    points.push([object1.xpos+object1.width,object1.ypos]);
    points.push([object1.xpos,object1.ypos+object1.width]);
    points.push([object1.xpos+object1.width,object1.ypos+object1.width]);

    for (let a = 0; a < points.length;a ++){
        let point = points[a];
        if (pointInside(point,object2))return true;
    }
    return false;
}
function collidesWithPlayer(object1){
    let points = [];
    points.push([object1.xpos,object1.ypos]);
    points.push([object1.xpos+object1.width,object1.ypos]);
    points.push([object1.xpos,object1.ypos+object1.width]);
    points.push([object1.xpos+object1.width,object1.ypos+object1.width]);

    for (let a = 0; a < points.length;a ++){
        let point = points[a];
        if (pointInsidePlayer(point))return true;
    }
    return false;
}

function pointInsidePlayer(point){

    let xMin = player.xPos;
    let xMax = player.xPos+player.width;
    let result = between(point[0],xMin,xMax);

    let yMin = player.yPos;
    let yMax = player.yPos+player.height;

    return result && between(point[1],yMin,yMax);
}

function pointInside(point,object){

    let xMin = object.xpos;
    let xMax = object.xpos+object.width;
    let result = between(point[0],xMin,xMax);

    let yMin = object.ypos;
    let yMax = object.ypos+object.height;

    return result && between(point[1],yMin,yMax);
}

function between(point,left,right){
    return point >= left && point <= right;
}

function generateName(gender) {
  let name = "";
  let vowels = ['a','e','i','o','u'];
  nameLength = getRandomInt(11) + 3;
  if (nameLength > 7){return randName(gender)}

  for (let i = 0; i < nameLength; i ++){
    let letter;

    if (i === 0){
      letter = (String.fromCharCode(getRandomInt(25) + 65));
    } else if (i % 3 === 1){
      letter = vowels[getRandomInt(5)];
    } else {
      letter = (String.fromCharCode(getRandomInt(25) + 65)).toLowerCase();
    }

    if (name[i-1] === "q" || name[i-1] === "Q") letter = 'u';

    while ((name[i-1] === "i" && letter === "i") || (name[i-1] === "I" && letter === "i")){
      letter = (String.fromCharCode(getRandomInt(25) + 65)).toLowerCase();
    }

    while (i === nameLength-1 && ["i","u","v","j"].includes(letter)){
      letter = (String.fromCharCode(getRandomInt(25) + 65)).toLowerCase();
    }
    name += letter;
  }

  return name;
}

function getRandomInt(max){
  return Math.floor(Math.random() * Math.floor(max));
}

function coinFlip(){
    return Math.floor(Math.random() * Math.floor(2));
}

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

function initGame(){

    let pistol = new gun("Pistol",10,2);
    playerInfo.weapon = pistol;

    drawArrayA.push(new Coin(1,100,100));

    for (let i = 0; i < gameComplexity; i ++){
        let x = getRandomInt(mapbounds*2)-mapbounds;
        let y = getRandomInt(mapbounds*2)-mapbounds;
        let filler = new Box(x,y,'box');
        drawArrayA.push(filler);
    }

    for (let i = 0; i < gameComplexity/2; i ++){
        let NPCpistol = new gun("Pistol",5,3);
        let newNPC  = new NPC();
        if (coinFlip())newNPC.weapon = NPCpistol;

        drawArrayA.push(newNPC);
    }
}

function game(){
  move();
  draw(drawArrayA);
  timer();
  //mouse();
}


function startDuel(NPC){
    player.xPos = NPC.xpos;
    player.yPos = NPC.ypos;

    player.xVel = -20;
    NPC.xVel = 20;
    player.duelTimer = 8;
    NPC.countDownTimer = 8 + randWait();
}

function timer(){
  ticker += 1
  if (ticker > framerate/2) {
    timeNow = getTime()
    ticker = 0;
  }
}

function mouseInbounds(obj){
  if (pointerx > obj.xpos && pointerx <  obj.xpos + obj.width){
    if (pointery > obj.ypos && pointery <  obj.ypos + obj.height){
      return true;
    }
  }
return false;
}

function mouse(){
  pointerx = mousex - camera.xPos;
  pointery = mousey - camera.yPos;

  for (let i = 0; i < drawArrayA.length;i++){
    if (mouseInbounds(drawArrayA[i])){
      drawArrayA[i].hovered = 2;
    }
  }
}

function move(){
  moveNonStatic();
  moveStatic();
  if (cameraMode !== "Free") movePlayer();
  moveCamera();
  menu();
  processPlayer();
}

function processPlayer(){
  if (playerInfo.attackCoolDown > 0){
    playerInfo.attackCoolDown -= framerate/1000;
  }

}



let key81pressed = false;
let key69pressed = false;
let menuIndex = 0;
let startMenuIndex = 0;

function menu(){

  if (buildingNow !== [] && cameraMode === "Free"){//make it so it snaps to grid
    if(keyboard.key[69]){
        let newX = Math.ceil((0-camera.xPos+(canvas.width/2))/20)*20;
        let newY = Math.ceil((0-camera.yPos+(canvas.height/2))/20)*20;
        if (buildingNow.sType === "tree"){
            let toBuild = new Tree(newX,newY,buildingNow.name,buildingNow.value);
            drawArrayA.push(toBuild);
        }else{
            let toBuild = new Block(newX,newY);
            drawArrayA.push(toBuild);
        }
      cameraMode = "Player";
    }
  }

    if (menuDetails.type === "") {
        if (keyboard.keyIsPressed(81)) {
            toggleMenu('Build')
        }
    }

    if (menuDetails.type === "Build"){

        if (keyboard.keyIsPressed(69)){
      //close menu
        toggleMenu('Build');
        buildMode(menuDetails.index);
      }

    }


    if (menuDetails.type === "talk")if (keyboard.keyIsPressed(69))talkMenu();
    if (menuDetails.type === "chat")if (keyboard.keyIsPressed(69))chatMenu();


    if (menuDetails.type !== ""){

    if(keyboard.key[38]) {startMenuIndex = -1;}
    if(keyboard.key[40]) {startMenuIndex = 1;}

    if(!(keyboard.key[38] || keyboard.key[40])){
      if (startMenuIndex !== 0){
        menuDetails.index += startMenuIndex;//dont do anything
      }
      startMenuIndex = 0;
    }

    if(menuDetails.type === "Build"){
      if(menuDetails.index < 0 ) menuDetails.index = buildItems.length -1;
        menuDetails.index = menuDetails.index % buildItems.length;
    }

  }
}

function hitPlayer(damage,x,y){
    playerInfo.health -= damage;
    player.xVel += x;
    player.yVel += y;
    console.log("wow thats alot of damage");
    if (playerInfo.health < 0)playerDie()
}

function playerDie(){
    console.log("Player dead");
}

function talkMenu(){
    let selected = menuDetails.items[menuDetails.index][0];
    let NPC = menuDetails.person;
    if (selected === "Chat"){
        NPC.chat();
    }
    if (selected === "Barter"){
        NPC.barter()
    }
    if (selected === "Duel"){
        NPC.duel()
    }
    if (selected === "Mug"){
        NPC.mug();
    }
    if (selected === "Bye")closeMenu();
}

function chatMenu(){
    let selected = menuDetails.items[menuDetails.index][0];
    let NPC = menuDetails.person;
    if (selected === "Information"){
        chat(NPC);
    }
    if (selected === "Banter"){
        banter(NPC);
    }
    if (selected === "Intimidate"){
        intimidate(NPC);
    }
    if (selected === "Back")openMenu('talk');
}


function chat(NPC){

    if (NPC.likes <= -50){
        notify('NPC dislikes you too much to talk');
        return
    }
    if (NPC.fear > 50){
        notify('NPC is too afraid to talk');
        return
    }
    openMenu("chat")
}

function banter(NPC){

    if (NPC.likes > -50){
        if (NPC.fear < 10) NPC.likes += 2;
        else NPC.likes += 1;
    }
    if (NPC.likes > 0){
        if (NPC.fear < 10) NPC.likes += 5;
        else NPC.likes += 1;
        if (NPC.fear > 0) NPC.fear -= 1
    }
}

function intimidate(NPC){

    if (NPC.likes > 50)NPC.likes -= 2;
    else NPC.fear += 5;
}

function barterNPC(NPC){

    if (NPC.likes <= -50){
        notify('NPC dislikes you too much to trade');
    }
    if (NPC.fear > 50){
        notify('NPC is too afraid of you to trade');
    }
}

function displayMessage(text){//todo:upgrade to support multiple messages
  messager.text = text;
  messager.timer = 1;
}

function getItemFromList(name){
  for (let i = 0; i < itemDictionary.length; i++){
    if (itemDictionary[i].name == name) {
      return itemDictionary[i];
    }
  }
}

function buildMode(toBuild){
    let itemname = buildItems[toBuild][0];
    buildingNow = getItemFromList(itemname);
  if (0 > playerInfo.coins - buildingNow.value){
    displayMessage("you dont have enough coins");
    return;
  }
  playerInfo.coins -= buildingNow.value;
  cameraMode = "Free";

}

function toggleMenu(Type){
  if(menuDetails.type != ""){
      menuDetails.type = "";
  }else{
      menuDetails.type = Type;
  }
}

function moveNonStatic(){
  for (let i = 0; i < drawArrayA.length; i++){
    let NS = drawArrayA[i];

    if (NS.type === "AI"){
        actNPC(NS,i);
    } else if(NS.sType === "Coin"){
        actCoin(NS,i);
    }
    if (drawArrayA.length < 0) break;
  }
}

function actNPC(thing,i){

    thing.act();

    thing.talk();


    //interactions
    if (isInInteractionRange(thing.xpos,thing.ypos)){
        thing.say("Hi player");
        if(menuDetails.type === ""){
            if (keyboard.keyIsPressed(69))talkWithPlayer(thing);
        }
    }

    let interaction = interactionRangeNPC(thing,i);
    if (interaction === false) return;

    if (interaction.type === "AI"){
        thing.hovered = 2;
        thing.words = "Hello " + thing.fName + " " + thing.lName;
    }

    if (interaction.sType === "tree"){
        thing.hovered = 2;
        thing.words = "Nice " + interaction.fName;
    }

    if (interaction.sType === "box"){
        thing.hovered = 2;
        thing.words = "Nice " + interaction.fName;
    }
}

function talkWithPlayer(person){
    menuDetails.index = 0;
    person.xdest = person.xpos;
    person.ydest = person.ypos;
    person.holt = true;
    talkTo(person)
}

function talkTo(person){
    menuDetails.type = "talk";
    menuDetails.person = person;
    menuDetails.items = [['Chat'],['Barter'],['Duel'],['Mug'],['Bye']];
    openMenu("talk");
}

function openMenu(toOpen){
    menuDetails.type = toOpen;
}

function interactionRangeNPC(thing,i){
    for (let x = 0; x < drawArrayA.length; x++){//check distance to other NPCs
        let NSc = drawArrayA[x];
        if (i !== x){
            let xdiff = Math.abs(thing.xpos - NSc.xpos);
            let ydiff = Math.abs(thing.ypos - NSc.ypos);
            if (Math.sqrt((xdiff*xdiff) + (ydiff*ydiff)) < 50){
                return NSc;
            }
        }
    }
    return false;
}

function actCoin(thing,i){
    //coin float towards player
    if (isInCollectionRange(thing.xpos,thing.ypos)){
        thing.floatTowardsPlayer();
        thing.checkCollected(i);
    }
}

function moveStatic(){

  for (let i = 0; i < drawArrayA.length; i++){
    let thing = drawArrayA[i];
    if (thing.alive === false) drawArrayA.splice(i, 1);

	let friction = 1.1;
    if (thing.friction !== undefined) friction = thing.friction;
    if (thing.xvel !== undefined) thing.xpos += thing.xvel;
    if (thing.yvel !== undefined) thing.ypos += thing.yvel;

	if (thing.type === "bullet"){
        if (!thing.move())drawArrayA.splice(i,1);
		if (drawArrayA.length < 0) break;
	}

    if (Math.abs(thing.xvel) > 0.1){
      thing.xvel = thing.xvel/friction;
    }else if(thing.xvel !== 0){
      thing.xvel = 0;
    }

    if (Math.abs(thing.yvel) > 0.1){
      thing.yvel = thing.yvel/friction;
    }else if(thing.yvel !== 0){
      thing.yvel = 0;
    }


    if (thing.hovered > 0) thing.hovered -= framerate/1000;
    if (canInteract(thing)) {
        if (isInInteractionRange(thing.xpos, thing.ypos)) thing.interact();
        if (thing.sType === "tree") thing.grow();
        if (thing.alive === false) drawArrayA.splice(i, 1);
    }




    if (drawArrayA.length < 0) break;

  }
}

function canInteract(obj){
    if (typeof obj.interact === 'function'){
        return true;
    }
    return false
}

function isInInteractionRange(x,y){
    let xdiff = x - player.xPos;
    let ydiff = y - player.yPos;
    let maxDraw = 30;
    return Math.abs(xdiff) < maxDraw && Math.abs(ydiff) < maxDraw;

}

function isInCollectionRange(x,y){
    let xdiff = x - player.xPos;
    let ydiff = y - player.yPos;
    let maxDraw = 80;
    return Math.abs(xdiff) < maxDraw && Math.abs(ydiff) < maxDraw;
}

function getRandPlacement(pos){
  return Math.floor(Math.random() * Math.floor(40))-20  +pos;
}

function randWait(){
    return Math.random() * Math.floor(5);
}

function getRandShake(pos){
    return Math.floor(Math.random() * Math.floor(8))-4  +pos;
}

function hit(thing){
    if (thing.health !== undefined){
        thing.health -= playerInfo.attack;
    }
    thing.attacked = 3;
    if (thing.attacked % 3 === 0)  thing.xvel -= thing.attacked/8.5;
    thing.xpos += thing.attacked;
    if (thing.attacked % 3 === 0)  thing.yvel += thing.attacked/8.5;
    thing.ypos -= thing.attacked;
}

function kill(thing){//spawns whatever is needed when an item is destroyed
  let name = thing.name;
  let type = thing.sType;
  let reward = thing.stage*5;
  let x = thing.xpos;
  let y = thing.ypos;
  if (type === "tree"){
    spawncoins(x,y,reward);
  }
}

function spawncoins(x,y,value){
  let xpos = getRandPlacement(x);
  let ypos = getRandPlacement(y);
  if (value < 10){
      for (let i = 0; i < value; i ++){
          xpos = getRandPlacement(x);
          ypos = getRandPlacement(y);
          spawncoin(xpos,ypos,1)
      }
  }else{
      for (let i = 0; i < value/10; i ++){
          xpos = getRandPlacement(x);
          ypos = getRandPlacement(y);
          spawncoin(xpos,ypos,10)
      }
  }

}

function spawncoin(x,y,value){
  let newCoin = new Coin(value,x,y);
  drawArrayA.push(newCoin);
}

function getTime(){
  let date = new Date();
  let result = 0;
  let year = date.getFullYear();
  let month = date.getMonth();
  let day = date.getDay();
  let hour = date.getHours();
  let min = date.getMinutes();
  let second = date.getSeconds();
  result = year*3110400 + month*259200 + day*8640 + hour*3600 + min*60 + second;
  return result
}

function pointInObject(point,object) {
	let xMin = object.xpos;
	let xMax = object.xpos + object.width;
	let yMin = object.ypos;
	let yMax = object.ypos + object.height;

	if (point[0] > xMin && point[0] < xMax){
		if (point[1] > yMin && point[1] < yMax){
			return true;
		}
	}
	return false;
}



function movePlayer(){

	player.xPos += player.xVel;
  player.yPos += player.yVel;

	player.shoottimer -= 0.1;

  if (Math.abs(player.xVel) > 0.1){
    player.xVel = player.xVel/1.1;
  }else if(player.xVel !== 0){
    player.xVel = 0;
  }

  if (Math.abs(player.yVel) > 0.1){
    player.yVel = player.yVel/1.1;
  }else if(player.yVel !== 0){
    player.yVel = 0;
  }

  if(keyboard.key[87])player.yVel -=0.5;//W
  if(keyboard.key[65])player.xVel -=0.5;//A
  if(keyboard.key[83])player.yVel +=0.5;//S
  if(keyboard.key[68])player.xVel +=0.5;//D

  if (menuDetails.type === ""){
    if(keyboard.key[37])shoot(-1,0);//left
    if(keyboard.key[38])shoot(0,-1);//up
    if(keyboard.key[39])shoot(1,0);//right
    if(keyboard.key[40])shoot(0,1);//down
}
}


function moveCamera(){

  if (cameraMode === "Free") {
    //press e to exit
    camera.xPos += camera.xVel;
    camera.yPos += camera.yVel;

    if (Math.abs(camera.xVel) > 0.1) {
      camera.xVel = camera.xVel / 1.1;
    } else if (camera.xVel !== 0) {
      camera.xVel = 0;
    }

    if (Math.abs(camera.yVel) > 0.1) {
      camera.yVel = camera.yVel / 1.1;
    } else if (camera.yVel !== 0) {
      camera.yVel = 0;
    }

    if (keyboard.key[87]) camera.yVel += 1;//W
    if (keyboard.key[65]) camera.xVel += 1;//A
    if (keyboard.key[83]) camera.yVel -= 1;//S
    if (keyboard.key[68]) camera.xVel -= 1;//D

  } else if(cameraMode === "Player"){
    camera.xPos = -player.xPos + xDiff;
    camera.yPos = -player.yPos + yDiff;
  }

}

function shoot(shoot_xvel, shoot_yvel){
	let shootx = player.xPos + 5;
	let shooty = player.yPos + 10;

    playerInfo.weapon.attack('player',shootx,shooty,shoot_xvel,shoot_yvel);
}

function closeMenu(){
    menuDetails.type = "";
}

function drawMenu(){
    if (menuDetails.type === "") return;
    board.font = "22px VT323";
    let menuHeight = 5;
    let innerHeight = 5;
    if (menuDetails.type === "Build"){
      //display items
      menuDetails.items = buildItems;
        menuHeight += 35* menuDetails.items.length
    }

    if (menuDetails.type === "talk"){
        //display items
        board.font = "22px VT323";
        menuDetails.items = [['Chat'],['Barter'],['Duel'],['Mug'],['Bye']];

        menuHeight += 35* menuDetails.items.length + 90;
        innerHeight += 35* menuDetails.items.length;
    }

    if (menuDetails.type === "chat"){
        //display items
        board.font = "22px VT323";
        menuDetails.items = [['Information'],['Banter'],['Intimidate'],['Back']];

        menuHeight += 35* menuDetails.items.length + 90;
        innerHeight += 35* menuDetails.items.length;
    }

    board.fillStyle = "#424242";
    board.fillRect(canvas.width-210, 10, 200, menuHeight);

    board.fillStyle = "#000000";
    board.fillText("[e] select [q] exit" ,canvas.width-200,30+menuHeight);

    displayItems();

    if (menuDetails.type === 'talk')displayCharDetails(innerHeight);
    if (menuDetails.type === 'chat')displayCharDetails(innerHeight);
}

function displayCharDetails(innerHeight){
    board.fillStyle = "#FAFAFA";
    board.fillText(menuDetails.person.fName + " " + menuDetails.person.lName ,canvas.width-200, 30 + innerHeight);
    let disposition = menuDetails.person.likes;
    disposition = stringifyLike(disposition);
    board.fillText(disposition+' you' ,canvas.width-200, 60 + innerHeight);
    board.fillText('fear: ' + menuDetails.person.fear ,canvas.width-200, 90 + innerHeight);
}

function displayItems(){
    for (let i = 0; i < menuDetails.items.length; i++){
        if (menuDetails.index == i) {//if item is selected
            board.fillStyle = "#FFE082";
            board.fillRect(canvas.width - 207, 13 + 35 * i, 194, 34);

            board.fillStyle = "#FFA000";
            board.fillRect(canvas.width - 205, 15 + 35 * i, 190, 30);

            board.fillStyle = "#000000";

            if (menuDetails.items[i][1] === undefined) {
                board.fillText(menuDetails.items[i][0], canvas.width - 200, 35 + 35 * i);
            }else{
                board.fillText(menuDetails.items[i][0] + " - " + menuDetails.items[i][1], canvas.width - 200, 35 + 35 * i);}

        }else{
            board.fillStyle = "#BDBDBD";
            board.fillRect(canvas.width-205, 15+35*i, 190, 30);

            board.fillStyle = "#000000";

            if (menuDetails.items[i][1] === undefined) {
                board.fillText(menuDetails.items[i][0], canvas.width - 200, 35 + 35 * i);
            }else{
                board.fillText(menuDetails.items[i][0] + " - " + menuDetails.items[i][1], canvas.width - 200, 35 + 35 * i);}

        }
    }
}

function stringifyLike(amount){
    if (amount < -90){
        return 'Hates'
    }
    if (amount < -50){
        return 'Strongly dislikes'
    }
    if (amount < -20){
        return 'Dislikes'
    }
    if (amount < 20){
        return 'Unsure of'
    }
    if (amount < 540){
        return 'Likes'
    }
    if (amount < 90){
        return 'Strongly likes'
    }
    if (amount >= 90){
        return 'Loves'
    }
    return 'Unsure of'
}

function notify(message){
    messager.text = message;
    messager.timer = 5;
}

function drawOverlay(){

    board.font = "20px VT323";

    board.textAlign = "left";
    board.fillText(playerInfo.coins + " coins",20,25);

    let weapon = "Nothing";
    if (playerInfo.weapon) weapon = playerInfo.weapon.name;
    board.fillText(playerInfo.weapon.name,20,canvas.height-20);


    if (player.duelTimer > 0){
        player.duelTimer -= framerate/1000;
        board.fillStyle = "#101010";
        board.fillRect(0,0,canvas.width,150);
        board.fillRect(0,canvas.height-150,canvas.width,150);


        let text = Math.floor(player.duelTimer/2)
        if (text === 0)text = "DUEL"
        board.font = "96px VT323";
        board.fillStyle = "#eee";
        board.textAlign = "center";
        board.fillText(text, canvas.width/2, 96);
    }
    board.textAlign = "left";
    let haelthPercentage = playerInfo.health/playerInfo.maxHealth;
    board.fillStyle = "#FF2222";
    board.fillRect(0,canvas.height-10,canvas.width*haelthPercentage,10);
}

function draw(drawArray){
  board.clearRect(0, 0, canvas.width, canvas.height);//clears board for a new frame
  board.fillStyle = "#9CCC65";
  board.fillRect(0,0,canvas.width,canvas.height);

  for(let i = 0; i < drawArray.length; i++){
      let object = drawArray[i];
      board.fillStyle = object.color;

      if (object.hasOwnProperty('attacked')){
          if (object.attacked > 0 ){
              board.fillStyle = "#ef1111";
              object.attacked -= 1;
          }
      }

      board.fillRect(object.xpos + camera.xPos,object.ypos + camera.yPos,object.width,object.height);


      if (object.hasOwnProperty('hovered')){if (object.hovered > 0) {
      board.font = "16px VT323";
      board.fillStyle = "#2A2A2F";
      board.textAlign = "center";
      board.fillText(object.words, object.xpos + camera.xPos + (object.width/2), object.ypos + camera.yPos - 10);
      board.textAlign = "left";
    }}

  }

  if (buildingNow !== [] && cameraMode === "Free"){
    board.fillStyle = "#F57C00";
    board.fillRect(
      (canvas.width/2)+(camera.xPos%20),
      (canvas.height/2)+(camera.yPos%20),
      20,20);
  }


  board.fillStyle = "#212121";
  board.font = "24px VT323";

  if (messager.timer > 0){
    messager.timer -= framerate/2500;
    if (messager.urgent){//todo: make flashing

    }
    board.fillText(messager.text,canvas.width/2,100);
  }



  board.fillRect(player.xPos + camera.xPos,player.yPos + camera.yPos,20,30);

  drawMenu();
  drawOverlay();

}
