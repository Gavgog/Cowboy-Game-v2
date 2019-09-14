const framerate = 60;
const canvas = document.getElementById("gameCanvas");
const board = canvas.getContext('2d');
canvas.focus();
canvas.tabIndex = 0;

let key = {};
const gameComplexity = 10;

const xDiff = 400;
const yDiff = 300;

let gamePaused = false;
let cameraMode = "Player";
let messager = {text:"", timer:0,urgent:true};

let camera = {xPos:xDiff,yPos:yDiff,yVel:0,xVel:0};
let player = {xPos:20,yPos:20,yVel:0,xVel:0,shoottimer:0,width:30,height:40};
let playerInfo = {coins:100, attackCoolDown:0,attack:10,health:100,maxHealth:100,weapon:null};
let currentScreen = null;
let world = {};
let worldX = 0;
let worldY = 0;

let images = {};

class Player{
    constructor(){
        this.inventory = [];
        this.equiped = null;
        this.stepTimer = 3;
        this.stepCount = 0;
    }

    getCoins(amount){
        playerInfo.coins += amount;
    }

    getItem(item){
        /*  let exists = false;
            for (let i = 0; i < this.inventory.length;i++){
                if (this.inventory[i][0] === item){
                    this.inventory[i][1] += 1;
                    exists = true;
                    break;
                }
            }*/
        this.inventory.push(item);
    }

    addToInv(item){
        this.getItem(item);
        this.equipWeapon(this.equiped);
    }

    removeFromInv(item){
        if (this.equiped === item) this.equiped = null;
        let exists = false;
        for (let i = 0; i < this.inventory.length;i++){
            if (this.inventory[i] === item){
                this.inventory.splice(i,1);
                break;
            }
        }
    }

    unequipWeapons(){
        for (let i = 0; i < this.inventory.length; i++){
            if (this.inventory[i].type === "weapon"){
                this.inventory[i].equiped = false;
            }
        }
    }

    equipWeapon(weapon){
        this.unequipWeapons();
        this.equiped = weapon;
        weapon.equiped = true;
    }

    draw(){
        this.stepTimer -= Math.abs(player.xVel * framerate/1000);
        this.stepTimer -= Math.abs(player.yVel * framerate/1000);

        let toDraw = images.playerimg;

        if (this.stepTimer < 0){
            this.stepTimer = 3;
            if (this.stepCount === 1)this.stepCount = 0;
            else this.stepCount = 1;
        }

        if (player.yVel+player.xVel !== 0){
            if (this.stepCount === 1) toDraw = images.playerstep1;
            else  toDraw = images.playerstep2;
        }


        board.drawImage(toDraw,player.xPos + camera.xPos,player.yPos + camera.yPos, player.width, player.height);
    }

    coolGuns(){
        for (let i = 0; i < this.inventory.length; i++){
            if (this.inventory[i].type === "weapon"){
                if(this.inventory[i].coolDown > 0)this.inventory[i].coolDown -= framerate/1000;
            }
        }
    }
}

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

let buildItems = [["Apple Tree",15],["Cactus",7],["Maple Tree",10],["Box",1],["Loot Box",10],["Treasure Tree",50]];
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
let you = new Player();

class weapon{
    constructor(name,damage,fireRate){
        this.name = name;
        this.type = "weapon";
        this.style = "";
        this.damage = damage;
        this.fireRate = fireRate;
        this.coolDown = 0;
        this.equiped = false;
        this.value = this.getValue()
    }

    getValue(){
        let result = 5;
        result += this.damage * this.fireRate * (8 +getRandomInt(3));
        if (this.style === "range") result *= 2;
        if (!isNaN(this.rounds)) result *= 1.5;
        result = Math.floor(result);
        return result
    }


    attack(){

    }
}

class gun extends weapon{
    constructor(name,damage,fireRate){
        super(name,damage,fireRate);
        this.name = this.createName();
        this.type = "weapon";
        this.style = "range";
        this.damage = damage;
        this.fireRate = fireRate;

        this.weight = Math.round(1+((getRandomInt(1) + 2) / (fireRate * 5)));
        this.coolDown = -1;
        this.bulletVelocity = 5;
        this.spread = Math.max(0.05,Math.min(0.2,1/fireRate));
    }

    attack(author,x,y,xdir,ydir){
        if (this.coolDown < 0){
            this.coolDown = this.fireRate;
            xdir += this.getSpread();
            ydir += this.getSpread();
            let bullet = new Bullet(author,x,y,xdir*this.bulletVelocity,ydir*this.bulletVelocity,this.damage);
            drawArrayA.push(bullet);
        }
    }

    createName(){
        let result = this.gunSize();
        if (this.fireRate<0.5) result += " minigun";
        else if (this.fireRate<1) result += " machine gun";
        else if (this.fireRate < 3) result += " handgun";
        else if (this.fireRate < 4) result += " revolver";
        else if (this.fireRate < 5) result += " rifle";
        else  result += " sniper";

        return result.trim()
    }

    gunSize(){
        let result = "";
        if (this.damage < 2)  result += " airsoft";
        else if (this.damage < 4)  result += " peashooter";
        else if (this.damage < 8)  result += " small";
        else if (this.damage < 16)  result += " medium";
        else if (this.damage < 32)  result += " large";
        else if (this.damage < 64)  result += " massive";
        else if (this.damage < 128)  result += " 'The Beast'";
        return result
    }

    getSpread(){
        let diff = getRandomfloat(this.spread) - (this.spread/2);
        return diff;
    }
}

class shotgun extends gun{
    constructor(name,damage,fireRate,rounds){
        super(name,damage,fireRate);
        this.rounds = rounds;
    }

    attack(author,x,y,xdir,ydir){
        if (this.coolDown < 0){
            this.coolDown = this.fireRate;
            let OriginXDir = xdir;
            let OriginYDir = ydir;
            for(let slug = 0; slug < this.rounds;slug ++) {
                xdir = OriginXDir + this.getSpread();
                ydir = OriginYDir + this.getSpread();
                let bullet = new Bullet(author, x, y, xdir * this.bulletVelocity, ydir * this.bulletVelocity, this.damage);
                drawArrayA.push(bullet);
            }
        }
    }

    getSpread(){
        let diff = getRandomfloat(this.spread) - (this.spread/2);
        return diff;
    }

    createName(){
        let result = this.gunSize();
        return (result + " shotgun").trim();
    }
}

class rayGun extends gun{
    constructor(name,damage,fireRate){
        super(name,damage,fireRate);
        this.name = this.createName();
        this.type = "weapon";
        this.style = "range";
        this.damage = damage;
        this.fireRate = fireRate;
        this.coolDown = -1;
        this.ray = null
    }

    attack(author,x,y,xdir,ydir){
        if (this.ray){
            this.ray = new Ray(author,xdir,ydir,this.damage);
        }else{
            this.ray = new Ray(author,xdir,ydir,this.damage);
        }
        drawArrayA.push(this.ray);
    }

    createName(){
        let result = this.gunSize();
        if (this.fireRate<0.5) result += " minigun";
        else if (this.fireRate<1) result += " machine gun";
        else if (this.fireRate < 3) result += " handgun";
        else if (this.fireRate < 4) result += " revolver";
        else if (this.fireRate < 5) result += " rifle";
        else  result += " sniper";

        return result.trim()
    }

    gunSize(){
        let result = "";
        if (this.damage < 2)  result += " airsoft";
        else if (this.damage < 4)  result += " peashooter";
        else if (this.damage < 8)  result += " small";
        else if (this.damage < 16)  result += " medium";
        else if (this.damage < 32)  result += " large";
        else if (this.damage < 64)  result += " massive";
        else if (this.damage < 128)  result += " 'The Beast'";
        return result
    }

    getSpread(){
        return 0;
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
                    block.hit(this.damage,this.author);
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

    draw(){
        board.fillStyle = "#000";
        board.fillRect(this.xpos + camera.xPos, this.ypos + camera.yPos, this.width, this.height);
    }

}

class Laser extends Bullet{
    constructor(author,xpos,ypos,xvel,yvel,damage){
        super();
        this.type = "bullet";
        this.xpos = xpos;
        this.ypos = ypos;
        this.xvel = xvel;
        this.yvel = yvel;
        this.life = 10;
        this.damage = damage;
        this.width = 3;
        this.height = 3;
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
                    block.hit(this.damage,this.author);
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

    draw(){
        let power = 1 + (this.damage);

/*
        board.fillStyle = "#039BE5";
        board.fillRect(this.xpos + camera.xPos, this.ypos + camera.yPos, this.width*power*this.xvel, this.height*power);

        power = 1 + (this.damage / 3);
        board.fillStyle = "#4FC3F7";
        board.fillRect(this.xpos + camera.xPos, this.ypos + camera.yPos, this.width*power*this.xvel, this.height*power);
*/

        power = 1 + (this.damage / 10);
        board.fillStyle = "#fff";
        board.fillRect(this.xpos + camera.xPos, this.ypos + camera.yPos, this.width*power*(this.xvel+3), (this.height*power*this.yvel+3));
    }
}

class Ray extends Bullet{
    constructor(author,xvel,yvel,damage){
        super();
        this.type = "bullet";
        this.xvel = xvel;
        this.yvel = yvel;
        this.life = 0.05;
        this.damage = damage;
        this.color = "#000000";
        this.fName = "bullet";
        this.friction = 1;
        this.author = author;
        this.range = 500;
        this.width = (xvel*this.range)+3;
        this.height = (yvel*this.range)+3;
        if (this.author.xpos) this.xpos = this.author.xpos;
        else this.xpos = player.xPos + 10;
        if (this.author.ypos) this.ypos = this.author.ypos;
        else this.ypos = player.yPos + 10;
    }

    checkCollisions(){
        for (let i = 0;i < drawArrayA.length;i++){
            let block = drawArrayA[i];
            if (block.type === "AI"){
                if (collidesWith(this,block)){
                    if (block === this.author)continue;
                    block.hit(this.damage,this.author);
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
        if (this.author.xpos) this.xpos = this.author.xpos;
        else this.xpos = player.xPos + 10;
        if (this.author.ypos) this.ypos = this.author.ypos;
        else this.ypos = player.yPos + 10;
        this.checkCollisions();
        return this.life > 0;
    }

    draw(){
        let x = this.xpos + camera.xPos;
        let y = this.ypos + camera.yPos;

        board.fillStyle = "#039BE5";
        board.fillRect(x, y, this.width, this.height);
    }
}

class backgroundObject{
    constructor(size) {
        this.xpos = getRandomInt(size*2)-size;
        this.ypos = getRandomInt(size*2)-size;
        this.color = getGrassColor();
        this.width = (getRandomInt(4)*3)+3;
        this.height = 3;
        this.special = playOdds(1/10);

        if (this.special){

            this.flowerColor = "#FBC02D";
            this.flowerType = getRandomInt(3);
            if (playOdds(1/3)) this.flowerColor = "#F5F5F5";
            if (playOdds(1/3)) this.flowerColor = "#e53935";

        }
    }
    draw(){
        board.fillStyle = this.color;
        board.fillRect(this.xpos+camera.xPos,this.ypos+camera.yPos,this.width,3);

        if (this.special){
            switch (this.flowerType) {
                case 0:
                    board.fillRect(this.xpos + camera.xPos + 3, this.ypos + camera.yPos - 3, 3, 3);
                    board.fillRect(this.xpos + camera.xPos + 6, this.ypos + camera.yPos - 6, 3, 3);
                    board.fillStyle = this.flowerColor;
                    board.fillRect(this.xpos + camera.xPos + 9, this.ypos + camera.yPos - 9, 3, 3);
                    break;
                case 1:
                    board.fillRect(this.xpos + camera.xPos + 3, this.ypos + camera.yPos - 3, 3, 3);
                    board.fillRect(this.xpos + camera.xPos, this.ypos + camera.yPos - 6, 3, 3);
                    board.fillStyle = this.flowerColor;
                    board.fillRect(this.xpos + camera.xPos - 3, this.ypos + camera.yPos - 9, 3, 3);
                    break;
                case 2:
                    board.fillRect(this.xpos + camera.xPos + 3, this.ypos + camera.yPos - 3, 3, 3);
                    board.fillRect(this.xpos + camera.xPos + 3, this.ypos + camera.yPos - 6, 3, 3);
                    board.fillStyle = this.flowerColor;
                    board.fillRect(this.xpos + camera.xPos + 3, this.ypos + camera.yPos - 9, 3, 3);
                    break;
            }

        }
    }
}

class mapBorder{
    constructor(lr,tb,size,repX,repY) {
        this.xpos = lr*(size);
        this.ypos = tb*(size);
        this.color = "#9CCC65";
        this.width = (size*2)+2;
        this.height = (size*2)+2;
    }

    draw(){
        board.fillStyle = this.color;
        board.fillRect(this.xpos+camera.xPos,this.ypos+camera.yPos,this.width,this.height);
    }
}

class localMap{
    constructor(xpos,ypos) {
        this.itemArray = [];
        this.xpos = xpos;
        this.ypos = ypos;
        this.backgroundColor = "#9CCC65";
        this.size = 1000;
        this.complexity = 10;
        this.backgroundArray = []
    }

    generate(){
        this.generateBG();
        for (let i = 0; i < gameComplexity; i ++){
            let x = getRandomInt(this.size*2)-this.size;
            let y = getRandomInt(this.size*2)-this.size;
            let filler = new Box(x,y,'box');
            this.itemArray.push(filler);
        }


        //let forgerstall = new GamingStall(0, 0, "Tim's cannons", "Forger");
        //this.itemArray.push(forgerstall);



        for (let i = 0; i < this.complexity/2; i ++){
            let NPCgun = randomWeapon();
            let newNPC  = new gunslinger();
            newNPC.inventory.push(NPCgun);
            newNPC.equipWeapon(NPCgun);

            this.itemArray.push(newNPC);
        }
        let xs = getRandomInt(this.size*2)-this.size;
        let ys = getRandomInt(this.size*2)-this.size;


        for (let i = 0; i < gameComplexity/2; i ++){
            let x = getRandomInt(this.size*2)-this.size;
            let y = getRandomInt(this.size*2)-this.size;
            let newTree = new Tree(x,y,"Cactus",5);
            this.itemArray.push(newTree);
        }

        for (let i = 0; i < gameComplexity/2; i ++){
            let newNPC  = new Wolf();
            this.itemArray.push(newNPC);
        }
    }

    drawFloor(){
        for (let i = 0; i < this.backgroundArray.length;i++){
            let item = this.backgroundArray[i];
            item.draw();
        }
    }

    generateBG(){
        for (let i = 0; i < this.size/5;i++){
            let item = new backgroundObject(this.size);
            this.backgroundArray.push(item);
        }
    }

}


class waterArea{
    constructor(xpos,ypos) {
        this.itemArray = [];
        this.xpos = xpos;
        this.ypos = ypos;
        this.backgroundColor = "#039BE5";
        this.size = 1000;
        this.complexity = 10;
        this.backgroundArray = []
    }

    generate(){
        this.generateBG();
        for (let i = 0; i < gameComplexity; i ++){
            let x = getRandomInt(this.size*2)-this.size;
            let y = getRandomInt(this.size*2)-this.size;
            let filler = new Box(x,y,'box');
            this.itemArray.push(filler);
        }

        for (let i = 0; i < this.complexity/2; i ++){
            let NPCgun = randomWeapon();
            let newNPC  = new NPC();
            newNPC.inventory.push(NPCgun);
            newNPC.equipWeapon(NPCgun);

            this.itemArray.push(newNPC);
        }

        for (let i = 0; i < gameComplexity/2; i ++){
            let newNPC  = new Wolf();
            this.itemArray.push(newNPC);
        }
    }

    drawFloor(){

        for (let i = 0; i < this.backgroundArray.length;i++){
            let item = this.backgroundArray[i];
            item.draw();
        }

    }

    generateBG(){
        for (let i = 0; i < this.size/5;i++){
            let item = new backgroundObject(this.size);
            this.backgroundArray.push(item);
        }

        let top = new mapBorder(-0.9,-2.7,this.size,worldX,worldY-1);
        let bottom = new mapBorder(-0.9,0.9,this.size,worldX,worldY+1);
        let right = new mapBorder(0.9,-0.9,this.size,worldX+1,worldY);
        let left = new mapBorder(-2.7,-0.9,this.size,worldX-1,worldY);

        this.backgroundArray.push(top);
        this.backgroundArray.push(bottom);
        this.backgroundArray.push(left);
        this.backgroundArray.push(right);


        let topL = new mapBorder(-2.7,-2.7,this.size,worldX-1,worldY-1);
        let topR = new mapBorder(0.9,-2.7,this.size,worldX+1,worldY-1);
        let bottomL = new mapBorder(-2.7,0.9,this.size,worldX-1,worldY-1);
        let bottomR = new mapBorder(0.9,0.9,this.size,worldX+1,worldY-1);

        this.backgroundArray.push(topL);
        this.backgroundArray.push(topR);
        this.backgroundArray.push(bottomL);
        this.backgroundArray.push(bottomR);
    }
}

class wolfArea extends localMap{

    constructor(xpos,ypos) {
        super();
        this.itemArray = [];
        this.xpos = xpos;
        this.ypos = ypos;
        this.backgroundColor = "#9CCC65";
        this.size = 1000;
        this.complexity = 10;
    }

    generate(){

        this.generateBG();

        let x = getRandomInt(this.size*2)-this.size;
        let y = getRandomInt(this.size*2)-this.size;
        let filler = new Chest(x,y,'Chest',getRandomInt(100));
        this.itemArray.push(filler);


        for (let i = 0; i < this.complexity/2; i ++){
            let newNPC  = new Wolf();
            newNPC.makeHostile();
            this.itemArray.push(newNPC);
        }
    }
}

class banditArea extends localMap{

    constructor(xpos,ypos) {
        super();
        this.itemArray = [];
        this.xpos = xpos;
        this.ypos = ypos;
        this.backgroundColor = "#9CCC65";
        this.size = 1000;
        this.complexity = 10;
    }

    generate(){

        this.generateBG();

        let x = getRandomInt(this.size*2)-this.size;
        let y = getRandomInt(this.size*2)-this.size;
        let filler = new Chest(x,y,'Chest',getRandomInt(100));
        this.itemArray.push(filler);

        for (let i = 0; i < this.complexity; i ++){
            let x = getRandomInt(this.size*2)-this.size;
            let y = getRandomInt(this.size*2)-this.size;
            let filler = new Box(x,y,'box');
            this.itemArray.push(filler);
        }


        for (let i = 0; i < this.complexity/3; i ++){
            let NPCgun = randomWeapon();
            let newNPC  = new gunslinger();
            newNPC.inventory.push(NPCgun);
            newNPC.equipWeapon(NPCgun);
            newNPC.makeHostile();

            this.itemArray.push(newNPC);
        }

    }
}

class townArea extends localMap{

    constructor(xpos,ypos) {
        super();
        this.itemArray = [];
        this.xpos = xpos;
        this.ypos = ypos;
        this.backgroundColor = "#9CCC65";
        this.size = 1000;
        this.complexity = 10;
        this.texture = true;
        this.backgroundArray = []
    }



    generate(){

        this.generateBG();

        let x = getRandomInt(this.size*2)-this.size;
        let y = getRandomInt(this.size*2)-this.size;
        let filler = new Chest(x,y,'Chest',getRandomInt(100));
        this.itemArray.push(filler);

        for (let i = 0; i < this.complexity; i ++){
            let x = getRandomInt(this.size*2)-this.size;
            let y = getRandomInt(this.size*2)-this.size;
            let filler = new Box(x,y,'box');
            this.itemArray.push(filler);
        }


        for (let i = 0; i < this.complexity/3; i ++){
            let NPCgun1 = randomWeapon();
            let NPCgun2 = randomWeapon();
            let NPCgun3 = randomWeapon();
            let newNPC  = new gunslinger();
            newNPC.inventory.push(NPCgun1);
            newNPC.inventory.push(NPCgun2);
            newNPC.inventory.push(NPCgun3);
            newNPC.equipWeapon(NPCgun1);

            this.itemArray.push(newNPC);
        }

        if (coinFlip()){
            let newx = getRandomInt(this.size*2)-this.size;
            let newy = getRandomInt(this.size*2)-this.size;
            if (coinFlip()) {
                let coinStall = new GamblingStall(newx, newy, "jeffs goldrush", "coinToss");
                this.itemArray.push(coinStall);
            }else{
                let rouletteStall = new GamblingStall(newx,newy,"idiots goldrush","russianRoulette");
                this.itemArray.push(rouletteStall);
            }
        }




    }
}

class Branch{
    constructor(x,y,attachment){
        this.xpos = x;
        this.ypos = y;
        this.topOpen = true;
        this.leftOpen = true;
        this.rightOpen = true;
        this.attachment = attachment;
        switch(attachment){
            case(-2)://spread right only
                this.topOpen = false;
                this.rightOpen = false;
                break;
            case(-1)://T junction to the right
                this.rightOpen = false;
                break;
            case(0)://attached vertically
                this.leftOpen = false;
                this.rightOpen = false;
                break;
            case(1)://T junction to the left
                this.leftOpen = false;
                break;
            case(2)://spread left only
                this.leftOpen = false;
                this.topOpen = false;
                break;
            case(3)://dead end block
                this.leftOpen = false;
                this.rightOpen = false;
                this.topOpen = false;
                break;
        }
    }

    grow(){
        let result = [];
        if (this.rightOpen){
            this.rightOpen = false;
            if (playOdds(2/4)) {//chance the branch stops there
                result.push(new Branch(this.xpos + 3, this.ypos, 3));
            }else result.push(new Branch(this.xpos+3,this.ypos,2));
        }

        if (this.leftOpen){
            this.leftOpen = false;
            if (playOdds(2/4)){//chance the branch stops there
                result.push(new Branch(this.xpos-3,this.ypos,3));
            }else result.push(new Branch(this.xpos-3,this.ypos,-2));
        }

        if (this.topOpen){
            this.topOpen = false;
            if (playOdds(1/3)){//amount of branches
                if (coinFlip()){
                    result.push(new Branch(this.xpos,this.ypos-3,1));
                }else{
                    result.push(new Branch(this.xpos,this.ypos-3,-1));
                }
            }else{
                result.push(new Branch(this.xpos,this.ypos-3,0));
            }
        }
        return result;
    }
}

class Text{
    constructor(text,color,flashcolor,size,xpos,ypos){
        this.text = text;
        this.color = color;
        this.flashing = flashcolor;
        this.xpos = xpos;
        this.ypos = ypos;
        this.pos = "center";
        this.font = size+"px VT323";
        this.backgroundColor = null;
    }

    setPos(pos){
        this.pos = pos
    }

    setSize(size){
        this.font = size+"px VT323";
    }

    setBg(newColor){//not implimented yet
        this.backgroundColor = newColor;
    }

    draw(){
        board.font = this.font;
        board.textAlign =  this.pos;

        if (this.flashing) {
            if (getTime() % 2 === 0) board.fillStyle = this.color;
            else board.fillStyle = this.flashing;
        }else{
            board.fillStyle = this.color;
        }

        board.fillText(this.text, this.xpos, this.ypos);
    }
}

class menuShape{
    constructor(color,xpos,ypos,width,height){
        this.color = color;
        this.xpos = xpos;
        this.ypos = ypos;
        this.width = width;
        this.height = height;
        this.flashing = null;

        this.xdest1 = null;
        this.xdest2 = null;
        this.xtimer = null;
        this.xdirection = -1;

    }

    makeFlashing(color){
        this.flashing = color;
    }

    movex(place1,place2,speed){
        this.xdest1 = place1;
        this.xdest2 = place2;
        this.xtimer = speed*0.2;
    }

    moveOnce(xdest,ydest,speed){
        this.originX = this.xpos;
        this.originY = this.ypos;

        this.xdest3 = xdest;
        this.ydest3 = ydest;

        this.speed = speed;
        this.outIn = 1;

    }

    draw(){

        if (this.outIn){
            if (Math.abs(this.xpos - this.xdest3) > 5){
                this.xpos += this.speed * this.outIn;
            }

            if (Math.abs(this.ypos - this.ydest3) > 5){
                this.ypos += this.speed * this.outIn;
            }

            if (Math.abs(this.ypos - this.ydest3) <= 5 && Math.abs(this.xpos - this.xdest3) <= 5){
                if (this.outIn === -1) this.outIn = false;
                else{
                    this.outIn = -1;
                    this.xdest3 = this.originX;
                    this.ydest3 = this.originY;
                }
            }

        }else{
            if(this.xtimer){
                this.xpos += this.xtimer * this.xdirection;

                if (this.xdirection === -1 && this.xpos <= this.xdest1) this.xdirection *= -1;
                else if (this.xpos >= this.xdest2) this.xdirection *= -1;
            }

        }

        if (this.flashing && getTime() % 2 === 0) {
            board.fillStyle = this.flashing;
        }else{
            board.fillStyle = this.color;
        }

        board.fillRect(this.xpos, this.ypos,this.width,this.height);
    }
}


class menuBoard{
    constructor(width,height,title,text){
        this.isOpen = false;
        this.width = width;
        this.height = height;
        this.title = title;
        this.text = text;

        this.partArray = [];

        let header = new Text(title,"#000",null,46,canvas.width/2,150);
        this.partArray.push(header);

        drawArrayA.push(this);

    }

    open(){
        this.isOpen = !this.isOpen;
        if (!this.isOpen){
            this.alive = false;
        }
    }

    checkExit(){
        if (keyboard.keyIsPressed(81)){
            this.open()
            player.height = 40;
        }
    }

    play(){

    }

    draw() {
        if (this.isOpen) {

            this.play();

            player.height = 0;
            if (!menuDetails.bet) {
                menuDetails.bet = Math.min(playerInfo.coins, 10);
            }
            menuDetails.bet = Math.min(playerInfo.coins, menuDetails.bet)
            board.fillStyle = "#E91E63";
            board.fillRect(95, 95, canvas.width - 190, canvas.height - 240);
            board.fillStyle = "#212121";
            board.fillRect(100, 100, canvas.width - 200, canvas.height - 250);


            board.fillStyle = "#000";
            board.fillText("[q] exit", 100, canvas.height - 70);


            board.textAlign = "center";
            let part;
            for (part of this.partArray) {
                part.draw();
            }

            board.fillStyle = "#000";

            this.checkExit();
            menuDetails.type = "a";
        }
    }
}

class LCDBar extends menuShape{
    constructor(width,height,x,y){
        super()
        this.color = "#fff";
        this.xpos = x;
        this.ypos = y;
        this.width = width;
        this.height = height;
        this.flashing = null;
        this.progress = 0;
    }

    setProgress(progress){
        this.progress = progress;
    }

    draw(){
        board.fillStyle = "#424242";
        board.fillRect(this.xpos-5,this.ypos-45,this.width+10,this.height);

        board.fillStyle = "#4FC3F7";
        board.fillRect(this.xpos,this.ypos-40,((this.width-5)*this.progress),this.height-10);

        board.fillStyle = "#424242";
        let start = this.xpos-5;
        for (let i = 0; i < 11; i ++){
            board.fillRect(start + (i*25),this.ypos-45,5,40);
        }
    }
}


class ForgerGame extends menuBoard{
    constructor(){
        super();
        this.isOpen = false;
        this.title = "Forging";
        this.text = "[e] to make gun";
        this.completion = 0;

        this.partArray = [];

        let header = new Text(this.title,"#fff",null,46,canvas.width/2,150);
        this.partArray.push(header);

        let mainText = new Text(this.text,"#E91E63","#EC407A",32,canvas.width/2,190);
        this.partArray.push(mainText);

        let completionLabel = new Text("completion: ","#e1e1e1",null,32,canvas.width/2-150,canvas.height-175);
        this.partArray.push(completionLabel);

        this.progressBar = new LCDBar(250,40, canvas.width/2-75,canvas.height-160);
        this.partArray.push(this.progressBar);

        let workGun = new menuShape("#BDBDBD",canvas.width/2-15,canvas.height-225,30,10);
        this.partArray.push(workGun);

        this.workHammer = new menuShape("#757575",canvas.width/2-15,canvas.height-355,30,30);
        this.workHammer.movex(canvas.width/2-165,canvas.width/2+135,8);
        this.partArray.push(this.workHammer);

        this.maxDistance = 30;

        drawArrayA.push(this);
    }

    completeGun(){
        you.getCoins(getRandomInt(20)+30)
    }

    play(){
        if (keyboard.keyIsPressed(69)){

            this.workHammer.moveOnce(this.workHammer.xpos,canvas.height-245,10);
            this.workHammer.originY = canvas.height-355;

            let difference = Math.abs(this.workHammer.xpos - canvas.width/2 + 15);

            this.completion += Math.max(this.maxDistance - difference,0)/5;
            console.log(Math.max(this.maxDistance - difference,0));

            this.progressBar.setProgress(this.completion/100);
            if (this.completion > 100){
                this.completion = 0;
                this.completeGun()
            }
        }
    }

}

class RacingGame extends menuBoard{
    constructor(){
        super();
        this.isOpen = false;
        this.title = "Racing";
        this.text = "Please insert 1 coin to play [e]";

        this.partArray = [];

        let header = new Text(this.title,"#fff",null,46,canvas.width/2,150);
        this.partArray.push(header);

        let mainText = new Text(this.text,"#E91E63","#EC407A",32,canvas.width/2,250);
        mainText.setBg("#9C27B0");
        this.partArray.push(mainText);

        drawArrayA.push(this);
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
        this.inventory = [];
        this.step = 0;
    }


    unequipWeapons(){
        for (let i = 0; i < this.inventory.length; i++){
            if (this.inventory[i].type === "weapon"){
                this.inventory[i].weapon = false;
            }
        }
    }

    equipWeapon(weapon){
        this.unequipWeapons();
        this.weapon = weapon;
        weapon.equiped = true;
    }

    getItem(item){
    /*  let exists = false;
        for (let i = 0; i < this.inventory.length;i++){
            if (this.inventory[i][0] === item){
                this.inventory[i][1] += 1;
                exists = true;
                break;
            }
        }*/
        this.inventory.push(item);
    }

    addToInv(item){
        this.getItem(item);
        this.equipWeapon(this.weapon);
    }

    removeFromInv(item){
        if (this.weapon === item) this.weapon = null;
        let exists = false;
        for (let i = 0; i < this.inventory.length;i++){
            if (this.inventory[i] === item){
                this.inventory.splice(i,1);
                break;
            }
        }
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
            return;
        } else if (this.fear > 50){
            notify('NPC is too afraid of you to trade');
            return;
        }
        if (this.inventory.length == 0) this.say("I dont have anything to trade");
        else openMenu("Barter")
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

    makeHostileTo(person){
        this.hostileTo.push(person);
        this.speed = 1.6;
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
                if(this.weapon.coolDown > 0) this.weapon.coolDown -= framerate/1000;
                this.moveToShootPlayer();
                this.shootPlayer();
            }
        } else {
            //attacking NPC
            if (this.weapon === null) {
                //attack melee
                this.MeleeNPC(this.hostileTo[0])

            }else if (this.weapon.style === "range") {
                //attack with ranged weapon
                if(this.weapon.coolDown > 0) this.weapon.coolDown -= framerate/1000;
                this.moveToShootNPC(this.hostileTo[0]);
                this.shootNPC(this.hostileTo[0]);
            }
            if(this.hostileTo[0].health < 0)this.hostileTo.splice(0,1);
        }
    }

    MeleePlayer(){
        this.setTarget(player.xPos, player.yPos);
        this.moveTowardsTarget();
        if (collidesWithPlayer(this)){
            hitPlayer(5,this.xvel,this.yvel);
            this.xvel = -this.xvel*2;
            this.yvel = -this.yvel*2;
        }
    }

    MeleeNPC(npc){
        this.setTarget(npc.xpos, npc.ypos);
        this.moveTowardsTarget();
        if (collidesWith(this,npc)){
            npc.hit(5,this);
            this.xvel = -this.xvel*2;
            this.yvel = -this.yvel*2;
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

    moveToShootNPC(npc){
        let xdiff = this.xpos - npc.xpos;
        let ydiff = this.ypos - npc.ypos;

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

    shootNPC(npc){
        let xdiff = this.xpos - npc.xpos;
        let ydiff = this.ypos - npc.ypos;

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
        else this.step += 0.1;
        if (Math.abs(this.xdest - this.xpos) < 1) this.xpos = this.xdest;
        else this.step += 0.1;

        if (this.step > 5){
            this.step = 0.1;
        }
    }

    roam(){
        this.color = "#b20f5c";
        this.speed = 1;
        let xmoved = false;
        let ymoved = false;

        if (this.ywait < 0 && Math.abs(this.ydest - this.ypos) < 1) this.ywait = getRandomInt(50); //create random wait time
        if (this.ywait >= 0 && (Math.abs(this.ydest - this.ypos) < 1)){//if standing
            xmoved = true;
            this.ywait -= framerate/1000;//wait
            if (this.ywait < 0) this.ydest = getRandomInt(mapbounds*2)-mapbounds;//if wait time is up get new destination
        }

        if (this.xwait < 0 && Math.abs(this.xdest - this.xpos) < 1) this.xwait = getRandomInt(50); //create random wait time
        if (this.xwait >= 0 && (Math.abs(this.xdest - this.xpos) < 1)){//if standing
            ymoved = true;
            this.xwait -= framerate/1000;//wait
            if (this.xwait < 0) this.xdest = getRandomInt(mapbounds*2)-mapbounds;//if wait time is up get new destination
        }

        if (xmoved && ymoved)this.step = 0;


        if (this.holt === true){
            this.step = 0;
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
        for (let i = 0; i < this.inventory.length; i ++){
            let drop = new FloatingItem(this.xpos,this.ypos);
            drop.makeItem(this.inventory[i]);
            drawArrayA.push(drop);
        }
    }

    hit(damage,from){
        if (from === "player"&&coinFlip()) this.makeHostile();
        if (from !== "player"&&coinFlip()) this.makeHostileTo(from);

        this.health -= damage;
        this.attacked = 3;
        if (this.attacked % 3 === 0)  this.xvel -= this.attacked/8.5;
        this.xpos += this.attacked;
        if (this.attacked % 3 === 0)  this.yvel += this.attacked/8.5;
        this.ypos -= this.attacked;
        if (this.health < 0)this.die();
    }
}

class gunslinger extends NPC{
    constructor(){
        super();
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
        this.width = 28;
        this.height = 37;
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
        this.inventory = [];
        this.step = 0;
    }

    draw(){
        let toDraw = images.npc;

        if (this.step > 0){
            if (this.step > 2.5){
                toDraw = images.npcstep1;
            }else{
                toDraw = images.npcstep2;
            }
        }
        board.drawImage(toDraw,this.xpos + camera.xPos, this.ypos + camera.yPos, this.width, this.height);
    }
}

class Wolf extends NPC{
    constructor() {
        super();
        this.width = 20;
        this.height = 10;
        this.speed = 1.5;
        this.money = getRandomInt(5);
    }

    say(words){
        if (this.hovered < 0.1) {
            if (coinFlip()) this.words = 'Woof';
            else this.words = 'Bork';
            this.hovered = 3;
        }
    }

    interupt(whatToSay){
        if (this.hovered < 0.1) {
            if (coinFlip()) this.words = 'Woof';
            else this.words = 'Bork';
            this.hovered = 3;
        }
    }

    makeHostile(){
        this.hostileTo.push("player");
        this.speed = 2;
        this.color = "#ff3333"
    }

    getItem(item) {
        return;
    }

    moveTowardsTarget(){
        if (Math.abs(this.ydest - this.ypos) > 1) this.yvel = this.speed * ((this.ydest - this.ypos) / Math.abs(this.ydest - this.ypos));
        if (Math.abs(this.xdest - this.xpos) > 1) this.xvel = this.speed *((this.xdest - this.xpos) / Math.abs(this.xdest - this.xpos));

        if (Math.abs(this.ydest - this.ypos) < 1){
            this.ypos = this.ydest;
            this.yvel = 0;
        }
        if (Math.abs(this.xdest - this.xpos) < 1) {
            this.xpos = this.xdest;
            this.xvel = 0;
        }
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
        this.contains = null;
    }

    makeItem(item){
        if (item.color) this.color = item.color;
        else this.color = "#000000";
        this.contains = item;
    }

    floatTowardsPlayer(){
        let xdiff = this.xpos - player.xPos - 10;
        let ydiff = this.ypos - player.yPos - 20;
        let maxDraw = 80;
        let xSpeed = (maxDraw - Math.abs(xdiff))/40;
        let ySpeed = (maxDraw - Math.abs(ydiff))/40;


        if (xdiff > 5) this.xvel = -xSpeed;
        else if (xdiff < -5) this.xvel = xSpeed;

        if (ydiff > 5) this.yvel = -ySpeed;
        else if (ydiff < -5)this.yvel = ySpeed;
    }

    checkCollected(i){
        let xdiff = this.xpos - player.xPos - 10;
        let ydiff = this.ypos - player.yPos - 20;
        if(Math.abs(xdiff) < 15 && Math.abs(ydiff) < 25){
            you.addToInv(this.contains);
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

    checkCollected(i){
        let xdiff = this.xpos - player.xPos - 10;
        let ydiff = this.ypos - player.yPos - 20;
        if(Math.abs(xdiff) < 15 && Math.abs(ydiff) < 25){
            playerInfo.coins += this.value;
            drawArrayA.splice(i,1);
        }
    }

    draw(){
        board.fillStyle = "#FBC02D";
        board.fillRect(this.xpos + camera.xPos + 1, this.ypos + camera.yPos, 6, 8);
        board.fillRect(this.xpos + camera.xPos, this.ypos + camera.yPos + 1, 8, 6);
        board.fillStyle = "#FDD835";
        board.fillRect(this.xpos + camera.xPos + 1, this.ypos + camera.yPos + 1, 6, 6);
        //board.fillRect(this.xpos + camera.xPos + 4, this.ypos + camera.yPos, 6, 14);
        //board.fillRect(this.xpos + camera.xPos + 2, this.ypos + camera.yPos + 2, 10, 10);
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



class Stall extends Block {
    constructor(x,y,name){
        super();
        this.sType = "block";
        this.xpos = x;
        this.ypos = y;
        this.width = 100;
        this.height = 50;
        this.color = "#0F0F0F";
        this.fName = name;
        this.lName = "";
        this.words = "";
        this.hovered = 0;
        drawArrayA.push(this);
    };
    hit(){
    }

    draw(){
        board.fillStyle = "#FFC107";
        board.fillRect(this.xpos + camera.xPos, this.ypos + camera.yPos, this.width, this.height);
    }

    interact(){
    }
}

class GamblingStall extends Stall {
    constructor(x,y,name,gameType){
        super();
        this.sType = "block";
        this.gambleType = gameType;
        this.xpos = x;
        this.ypos = y;
        this.width = 20;
        this.height = 20;
        this.viewcolor = false;
        this.color = "#0F0F0F";
        this.fName = name;
        this.lName = "coin toss";
        this.words = "";
        this.stage = 1;
        this.life = timeNow;
        this.health = 100;
        this.hovered = 0;
        this.alive = true;
        drawArrayA.push(this);
    };

    interact(){
        this.hovered = 1;
        this.words = "[e] to play " + this.fName;
        if (menuDetails.type === ""){
            if(keyboard.keyIsPressed(69))openGamblingMenu(this);
        }
    }
}


class GamingStall extends Stall {
    constructor(x,y,name,gameType){
        super();
        this.sType = "block";
        this.gambleType = gameType;
        this.xpos = x;
        this.ypos = y;
        this.width = 20;
        this.height = 20;
        this.viewcolor = false;
        this.color = "#0F0F0F";
        this.fName = name;
        this.lName = "coin toss";
        this.words = "";
        this.stage = 1;
        this.life = timeNow;
        this.health = 100;
        this.hovered = 0;
        this.alive = true;
        drawArrayA.push(this);
    };

    interact(){
        this.hovered = 1;
        this.words = "[e] to play " + this.fName;
        if (menuDetails.type === ""){
            if(keyboard.keyIsPressed(69))openJobMenu(this);
        }
    }
}

class Tree extends Block{
    constructor(x,y,name,value){
        super(x,y,name);
        this.sType = "tree";
        this.treeType = "cactus";
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
        this.life = getTime();
        this.health = 15;
        this.hovered = 0;
        this.partArray = [new Branch(this.xpos,this.ypos,0)];
    };

    grow(){
        if(timeNow - this.life > (this.stage * this.stage)){
            this.stage += 1;
            this.health += 5;
            if(this.stage > 15)return;
            this.health += 10;
            switch(this.treeType) {
                case("cactus"):
                    let parts = this.partArray.length;
                    for (let i = 0; i < parts; i ++) {
                        let part = this.partArray[i];
                        let branch;
                        let branches = part.grow();
                        for (branch of branches) {
                            this.partArray.push(branch);
                        }
                    }

                    break;
                case("pine"):

                    break;

                case("oak"):

                    break;

            }
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

    draw(){
        board.fillStyle = "#795548";
        if (this.treeType === "cactus") board.fillStyle = "#2E7D32";

        for (let i = 0; i < this.partArray.length; i++){
            let part = this.partArray[i];
            board.fillRect(part.xpos + camera.xPos, part.ypos + camera.yPos, 3.5, 3.5);
        }

        // for (let height = 0; height < this.stage; height++){
        //     if (height === this.stage -1)board.fillStyle = "#1B5E20";
        //     board.fillRect(this.xpos + camera.xPos, this.ypos + camera.yPos - height*10, 10, 11);
        // }

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
        this.width = 30;
        this.height = 40;
        this.viewcolor = false;
        this.color = "#795548";
        this.fName = "Barrel";
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

    draw(){
        let toDraw = images.barrel;
        board.drawImage(toDraw,this.xpos + camera.xPos, this.ypos + camera.yPos, this.width, this.height);
    }

    die(){
        this.alive = false;
        spawncoins(this.xpos,this.ypos,this.value);
    }
}

function loadImages(){
    images.playerimg = new Image();
    images.playerimg.src = 'media/player.png';

    images.playerstep1 = new Image();
    images.playerstep1.src = 'media/player2.png';

    images.playerstep2 = new Image();
    images.playerstep2.src = 'media/player3.png';

    images.npc = new Image();
    images.npc.src = 'media/npc.png';

    images.npcstep1 = new Image();
    images.npcstep1.src = 'media/npc1.png';

    images.npcstep2 = new Image();
    images.npcstep2.src = 'media/npc2.png';

    images.barrel = new Image();
    images.barrel.src = 'media/barrel.png';

}

let itemDictionary = [
    {name:"Apple Tree",   value:15, str:5,  sType:"tree",treeType:"cactus", stage:0, life:0,  health:100},
    {name:"Cactus",     value:7,  str:5,  sType:"tree", treeType:"cactus",stage:0, life:0,  health:100},
    {name:"Maple Tree",   value:10, str:5,  sType:"tree",treeType:"cactus", stage:0, life:0,  health:100},
    {name:"Treasure Tree",value:50, str:5,  sType:"tree",treeType:"cactus", stage:0, life:0,  health:100},

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
  let mousePos = getMousePos(canvas, evt);

  mousex = mousePos.x;
  mousey = mousePos.y;
}, false);

function randName(gender){
	if (gender === "m") return Object.keys(mNamesNP[getRandomInt(mNamesNP.length)]);
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

function getGrassColor(){
    switch (getRandomInt(4.2)) {
        case 0:
            return "#689F38";
            break;

        case 1:
            return "#9E9D24";
            break;

        case 2:
            return "#43A047";
            break;

        case 3:
            return "#7CB342";
            break;

        case 4:
            return "#558B2F";
            break;
    }
}

function getRandomfloat(max){
    return Math.random() * max;
}

function coinFlip(){
    return Math.floor(Math.random() * Math.floor(2));
}

function playOdds(chance){
    let result = Math.random();
    return (chance) >= result;
}

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

function saveMap(map){
    let coordinates = worldX + "," + worldY;
    world[coordinates] = map;
}

function enterMap(currentMap,map) {
    saveMap(currentMap);
    drawArrayA = map.itemArray;
}

function generateNewMap(newX,newY,currentMap){
    let newMap = new localMap(newX,newY);
    if (playOdds(1/6)){
        newMap = new townArea(newX,newY);
    } else if (playOdds(1/6)){
        newMap = new wolfArea(newX,newY);
    } else if (playOdds(1/6)){
        newMap = new banditArea(newX,newY);
    }
    else if (playOdds(1/6)){
        newMap = new waterArea(newX,newY);
    }

    let newCoordinates = newX + "," + newY;
    newMap.generate();
    enterMap(currentMap,newMap);
    world[newCoordinates] = newMap;
}

function changeMaps(x,y){
    let newX = worldX + x;
    let newY = worldY + y;
    let newCoordinates = newX + "," + newY;
    let currentMap = getCurrentMap();
    let newMap = world[newCoordinates];

    if (newMap){
        enterMap(currentMap,newMap);
    }else{
        generateNewMap(newX,newY,currentMap);
    }

    if (newX === worldX){
        if (player.yPos > 0)player.yPos = -player.yPos + 5;
        else player.yPos = -player.yPos - 5;
    }
    if (newY === worldY){
        if (player.xPos > 0)player.xPos = -player.xPos + 5;
        else player.xPos = -player.xPos - 5;
    }
    worldX = newX;
    worldY = newY;
}


function getColorFromCoords(x,y){
    let coords = x + "," + y;
    if (world[coords]){
        return world[coords].backgroundColor;
    } else return "#039BE5";

}

function initGame(){
    loadImages();
    let currentMap = new localMap(0,0);
    currentMap.generate();
    drawArrayA = currentMap.itemArray;
    saveMap(currentMap);

    let starterGun = randomWeapon();

    you.getItem(starterGun);
    you.equipWeapon(starterGun);

    drawArrayA.push(new Coin(1,100,100));


}

function game(){
  if(!gamePaused)move();
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
    timeNow = getTime();
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

let startMenuIndex = 0;

function randomWeapon(){
    let damage = getRandomInt(8)+2;
    let fireRate = getRandomInt(3)+1;
    let slugs = getRandomInt(4)+3;
    let weapon = null;
    let randNum = getRandomInt(3);

    switch(randNum){
        case 0://shotgun
            weapon = new shotgun("Shotgun",damage,fireRate,slugs);
            break;
        case 1://hand gun
            weapon = new gun("Handgun",damage,fireRate);
            break;
        case 2://large gun
            fireRate = getRandomInt(2)+0.2;
            weapon = new gun("Large gun",damage*2,fireRate);
            break;
    }
    return weapon;
}


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
            toggleMenu('playerMenu')
        }
    }

    if (keyboard.keyIsPressed(81)) {
        closeMenu();
    }

    if (keyboard.keyIsPressed(77))openMap();

    if (menuDetails.type === "playerMenu")if (keyboard.keyIsPressed(69))playerMenu();
    if (menuDetails.type === "Inventory")if (keyboard.keyIsPressed(69))inventory();
    if (menuDetails.type === "Barter")if (keyboard.keyIsPressed(69))barterMenu();
    if (menuDetails.type === "talk")if (keyboard.keyIsPressed(69))talkMenu();
    if (menuDetails.type === "chat")if (keyboard.keyIsPressed(69))chatMenu();
    if (menuDetails.type === "Build")if (keyboard.keyIsPressed(69))buildMenu();


    if (menuDetails.type !== ""){

    if(keyboard.key[38]) {startMenuIndex = -1;}
    if(keyboard.key[40]) {startMenuIndex = 1;}

    if(!(keyboard.key[38] || keyboard.key[40])){
      if (startMenuIndex !== 0){
        menuDetails.index += startMenuIndex;//dont do anything
      }
      startMenuIndex = 0;
    }


    if(menuDetails.index < 0 ) menuDetails.index = menuDetails.items.length -1;
    menuDetails.index = menuDetails.index % menuDetails.items.length;
    if (isNaN(menuDetails.index))menuDetails.index = 0;

  }
}


function inventory(){
    let selected = menuDetails.items[menuDetails.index];
    if (selected.type === "weapon"){
        you.equipWeapon(selected);
        you.equiped = selected;
    }
    closeMenu();
}

function barterMenu(){
    let selected = menuDetails.items[menuDetails.index];

    if(playerInfo.coins >= selected.value){
        playerInfo.coins -= selected.value;
        menuDetails.person.coins += selected.value;
        menuDetails.person.removeFromInv(selected);
        you.addToInv(selected);
        closeMenu();
    }else{
        menuDetails.person.say("You dont have enough money");
    }

}

function playerMenu(){

    let selected = menuDetails.items[menuDetails.index][0];
    if (selected === "Close"){
        closeMenu()
    }
    if (selected === "Inventory"){
        openMenu("Inventory")
    }
    if (selected === "Build"){
        openMenu("Build")
    }
    if (selected === "Skills"){
        closeMenu()
    }
    if (selected === "Map"){
        openMap();
    }
}

function hitPlayer(damage,x,y){
    playerInfo.health -= damage;
    player.xVel += x;
    player.yVel += y;
    if (playerInfo.health < 0)playerDie()
}

function playerDie(){
    pauseGame();
    gameOver();
}

function pauseGame(){
    gamePaused = true;
}

function talkMenu(){
    let selected = menuDetails.items[menuDetails.index][0];
    let NPC = menuDetails.person;

    if (selected === "Chat")NPC.chat();

    if (selected === "Barter")NPC.barter();

    if (selected === "Duel")NPC.duel();

    if (selected === "Mug")NPC.mug();

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

function openMap(){
    if(menuDetails.type === "Map"){
        closeMenu();
        return
    }
    menuDetails.type = "Map"
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


function buildMenu(){
    buildMode(menuDetails.index);
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
    menuDetails.index = 0;
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
        thing.say( "Hello " + thing.fName + " " + thing.lName);
    }

    if (interaction.sType === "tree"){
        thing.say( thing.words = "Nice " + interaction.fName);
    }

}

function talkWithPlayer(person){

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
    menuDetails.index = 0;
    menuDetails.type = toOpen;
}

function openGamblingMenu(stall) {
    if (stall.gambleType === "Racing"){
        let menu = new RacingGame();
        menu.open()
    }else {
        menuDetails.type = "Gamble";
        menuDetails.gambleType = stall;
    }
}

function openJobMenu(stall) {
    if (stall.gambleType === "Forger"){
        let menu = new ForgerGame();
        menu.open()
    }else {
        //menuDetails.type = "Gamble";
        //menuDetails.gambleType = stall;
    }
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
    return Math.random() * Math.floor(2);
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

function getCurrentMap(){
    let coordinates = worldX + "," + worldY;
    return world[coordinates];
}


function isoutofBounds(){
    let size = getCurrentMap().size;
    if (player.xPos < -size){
        changeMaps(-1,0);
    }

    if (player.xPos > size){
        changeMaps(1,0);
    }

    if (player.yPos < -size){
        changeMaps(0,-1);
    }

    if (player.yPos > size){
        changeMaps(0,1);
    }
    return false
}

function movePlayer(){

    you.coolGuns();

    isoutofBounds();

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
  let weightspeed = 0;
  if (you.equiped){
      weightspeed = (1-(1/(you.equiped.weight)))*0.5;
  }
  if(keyboard.key[87])player.yVel -=0.5-weightspeed;//W
  if(keyboard.key[65])player.xVel -=0.5-weightspeed;//A
  if(keyboard.key[83])player.yVel +=0.5-weightspeed;//S
  if(keyboard.key[68])player.xVel +=0.5-weightspeed;//D


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

    you.equiped.attack('player',shootx,shooty,shoot_xvel,shoot_yvel);
}

function closeMenu(){
    menuDetails.type = "";
}

function drawMap(){
    board.fillStyle = "#EC407A";
    board.fillRect(95, 95, canvas.width-190, canvas.height-240);


    board.fillStyle = "#1f1f1f";
    board.fillRect(100, 100, canvas.width-200, canvas.height-250);
    board.fillStyle = "#212121";
    for(let i = 100; i < canvas.height-150; i+= 14){
        board.fillRect(100, i, canvas.width-200, 7);
    }


    board.fillStyle = "#000";
    board.fillText("[q] exit" ,100,canvas.height-120);



    let middlex = canvas.width/2;
    let middley = canvas.height/2;
    for (let place in world) {
        if (world.hasOwnProperty(place)) {
            let placeCo = place.split(",");

            if(placeCo[0] == worldX && placeCo[1] == worldY){
                board.fillStyle = "#EC407A";
                board.fillRect(middlex + (placeCo[0]*13)-2, middley + (placeCo[1]*13)-2, 14, 14);
            }
            board.fillStyle = world[place].backgroundColor;
            board.fillRect(middlex + (placeCo[0]*13), middley + (placeCo[1]*13), 10, 10);
        }
    }
}

function drawGambleStall(){
    if (!menuDetails.bet){
        menuDetails.bet = Math.min(playerInfo.coins,10);
    }
    board.fillStyle = "#00BCD4";
    board.fillRect(95, 95, canvas.width-190, canvas.height-240);
    menuDetails.bet = Math.min(playerInfo.coins,menuDetails.bet)
    board.fillStyle = "#1f1f1f";
    board.fillRect(100, 100, canvas.width-200, canvas.height-250);
    board.fillStyle = "#212121";
    for(let i = 100; i < canvas.height-150; i+= 14){
        board.fillRect(100, i, canvas.width-200, 7);
    }


    board.fillStyle = "#000";
    board.fillText("[q] exit" ,100,canvas.height-120);
    if (menuDetails.gambleType.gambleType !== "russianRoulette") {
        board.fillStyle = "#BDBDBD";
        board.fillText("Betting " + menuDetails.bet + " coins [Arrow Keys] to change bet", 110, canvas.height - 160);
    }
    board.fillStyle = "#EEEEEE";
    let middlex = canvas.width/2;
    board.font = "46px VT323";
    board.textAlign = "center";
    board.fillText(menuDetails.gambleType.fName ,middlex,150);
    board.font = "38px VT323";
    board.fillText(menuDetails.gambleType.lName ,middlex,190);

    if (menuDetails.gambleType.gambleType === "coinToss"){

    if (getTime() % 2 === 0) board.fillStyle = "#CE93D8";
    else board.fillStyle = "#EEEEEE";
        board.fillText("[e] To Flip Coin" ,middlex,250);
    } else if (menuDetails.gambleType.gambleType === "russianRoulette"){

        if (getTime() % 2 === 0) board.fillStyle = "#f44336";
        else board.fillStyle = "#ef9a9a";
        board.fillText("[e] To Pull Trigger" ,middlex,250);
    }


    board.fillStyle = "#EEEEEE";

    if (keyboard.keyIsPressed(69)){
        if(menuDetails.gambleType.gambleType === "coinToss"){
            if (playerInfo.coins >= menuDetails.bet) {
                if (coinFlip()) {
                    menuDetails.text = "you win!";
                    playerInfo.coins += menuDetails.bet;
                } else {
                    menuDetails.text = "you loose";
                    playerInfo.coins -= menuDetails.bet;
                }
            }
        }else if (menuDetails.gambleType.gambleType === "russianRoulette"){

                if (playOdds(1/3)) {
                    playerInfo.health = -1;
                    hitPlayer(10,0,0);
                } else {
                    menuDetails.text = "You win!";
                    playerInfo.coins += 6;
                    playerInfo.coins *= 6;
                }

        }

    }

    if (keyboard.keyIsPressed(37)){
        if (menuDetails.bet > 10) {
            menuDetails.bet -= 10;
        }else {
            menuDetails.bet = 1;
        }
    }
    if (keyboard.keyIsPressed(39)){
        if (menuDetails.bet + 10 <= playerInfo.coins) {
            menuDetails.bet += 10;
        } else {
            menuDetails.bet = playerInfo.coins;
        }
    }

    if (keyboard.keyIsPressed(40)){
        if (menuDetails.bet > 1) {
            menuDetails.bet -= 1;
        }
    }
    if (keyboard.keyIsPressed(38)){
        if (menuDetails.bet + 1 <= playerInfo.coins) {
            menuDetails.bet += 1;
        }
    }

    if(menuDetails.text){
        board.fillText(menuDetails.text,middlex,300);
    }



}

function drawMenu(){
    if (menuDetails.type === "") return;

    if (menuDetails.type === "Map") {
        drawMap();
        return;
    }

    if (menuDetails.type === "Gamble") {
        drawGambleStall();
        return;
    }

    board.font = "22px VT323";
    let menuHeight = 5;
    let innerHeight = 5;
    let etext = "select";


    if (menuDetails.type === "Build"){
      //display items
      menuDetails.items = buildItems;
        menuHeight += 35* menuDetails.items.length
    }

    if (menuDetails.type === "playerMenu"){
        //display items
        board.font = "22px VT323";
        menuDetails.items = [['Inventory'],['Build'],['Skills'],['Map'],['Close']];
        menuHeight += 35* menuDetails.items.length;
    }

    if (menuDetails.type === "Inventory"){
        //display items
        board.font = "22px VT323";
        menuDetails.items = you.inventory;
        menuHeight += 35* menuDetails.items.length;
        displayItemStats(menuDetails.items[menuDetails.index]);
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

    if (menuDetails.type === "Barter"){
        //display items
        board.font = "22px VT323";
        menuDetails.items = menuDetails.person.inventory;
        menuHeight += 35* menuDetails.items.length;
        etext = "purchase";
        displayItemStats(menuDetails.items[menuDetails.index]);
    }

    board.fillStyle = "#424242";
    board.fillRect(canvas.width-210, 10, 200, menuHeight);

    board.fillStyle = "#000000";
    board.fillText("[e] " + etext + " [q] exit" ,canvas.width-200,30+menuHeight);

    displayItems();

    if (menuDetails.type === 'talk')displayCharDetails(innerHeight);
    if (menuDetails.type === 'chat')displayCharDetails(innerHeight);
    board.fillStyle = "#000";

}

function drawInv(){
    board.fillStyle = "#888888";
    board.fillRect(0, canvas.height-60, canvas.width, 60);
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
            board.fillStyle = "#80DEEA";
            board.fillRect(canvas.width - 207, 13 + 35 * i, 194, 34);

            board.fillStyle = "#212121";
            board.fillRect(canvas.width - 205, 15 + 35 * i, 190, 30);
        }else{
            if (menuDetails.type === "Inventory") {
                if(menuDetails.items[i].equiped){
                    board.fillStyle = "#EC407A";
                    board.fillRect(canvas.width - 207, 13 + 35 * i, 194, 34);
                }
            }
            board.fillStyle = "#212121";
            board.fillRect(canvas.width-205, 15+35*i, 190, 30);
        }

        board.fillStyle = "#BDBDBD";
        if (menuDetails.type === "Inventory") printMenuItem(menuDetails.items[i].name,i);
        else if (menuDetails.type === "Barter") printMenuItem(menuDetails.items[i].name,i);
        else if (menuDetails.items[i][1] === undefined)printMenuItem(menuDetails.items[i][0],i);
        else printMenuItem(menuDetails.items[i][0] + " - " + menuDetails.items[i][1],i);
    }
}

function printMenuItem(text,i){
    board.fillText(text, canvas.width - 200, 35 + 35 * i);
}

function displayItemStats(item){
    board.fillStyle = "#EC407A";
    board.fillRect(canvas.width-410, 10, 195, 183);
    board.fillStyle = "#212121";
    board.fillRect(canvas.width-406, 14, 187, 35);
    board.fillRect(canvas.width-406, 53, 187, 105);
    board.fillRect(canvas.width-406, 161, 187, 28);

    board.fillStyle = "#E0E0E0";
    board.textAlign = "center";
    board.fillText(item.name, canvas.width - 315, 36);
    board.textAlign = "left";
    board.fillText('Dmg: ' + item.damage, canvas.width - 400, 75);
    board.fillText('Spd: ' + Math.max(10-item.fireRate), canvas.width - 400, 100);
    board.fillText('Rounds: ' + item.rounds, canvas.width - 400, 125);
    board.fillText('Weight: ' + item.weight, canvas.width - 400, 150);
    board.textAlign = "center";
    board.fillText('Value: $'+item.value, canvas.width - 315, 181);
    board.textAlign = "left";
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

function gameOver(){
    closeMenu();
    player.dead = true;
}

class screen{
    constructor(title,type){
        this.title = title;
        this.background = null;
        this.menuItems = [];
        this.type = type;
        this.age = 0;
        this.subtitle = "";
    }

    display(){
        let drop = 170;
        if (this.type === "drop") {
            this.age += framerate / 1000;
            drop = this.age * 40;
            drop = Math.min(drop, 170);
        }

        board.fillStyle = "#101010";
        board.fillRect(0,0,canvas.width,100 + drop);
        board.fillRect(0,canvas.height-100-drop*1.5,canvas.width,100+drop*1.5);

        board.font = "96px VT323";
        board.fillStyle = "#eee";
        board.textAlign = "center";
        board.fillText(this.title, canvas.width/2, drop);

        board.font = "42px VT323";
        board.fillStyle = "#ddd";
        if (this.type === "drop"&& drop == 170) {
            board.fillText(this.subtitle, canvas.width/2, 250);
        }else if (this.type !== "drop"){
            board.fillText(this.subtitle, canvas.width/2, 250);
        }
    }

    addSubTitle(text){
        this.subtitle = text;
    }

    addMenuOption(text){
        this.menuItems.push([text]);
    }
}

function gameOverScreen(){
    if (currentScreen === null){
        currentScreen = new screen("You Died!","drop");
        currentScreen.addSubTitle("Better luck next time");
        currentScreen.addMenuOption("Exit");
    }
}

function drawOverlay(){

    if (player.dead === true){
        gameOverScreen();
        return
    }


    board.fillStyle = "#424242";
    board.fillRect(0,canvas.height-50,canvas.width,50);


    drawMoney();
    drawWeapon();


    if (player.duelTimer > 0){
        player.duelTimer -= framerate/1000;
        board.fillStyle = "#101010";
        board.fillRect(0,0,canvas.width,150);
        board.fillRect(0,canvas.height-150,canvas.width,150);


        let text = Math.floor(player.duelTimer/2);
        if (text === 0)text = "DUEL";
        board.font = "96px VT323";
        board.fillStyle = "#eee";
        board.textAlign = "center";
        board.fillText(text, canvas.width/2, 96);
    }

    drawHealthBar();

}

function drawMoney() {
    let cells = playerInfo.coins.toString(10).length

    board.fillStyle = "#212121";
    board.fillRect(0,canvas.height-45,(2+cells)*28-11,40);
    board.font = "38px PIXymbolsLCDW00-Regular";
    board.fillStyle = "#558B2F";
    board.textAlign = "left";
    board.fillText("$"+playerInfo.coins, 12, canvas.height - 11);
}

function drawWeapon(){
    board.fillStyle = "#424242";
    board.fillRect(0,canvas.height-83,243,33);

    board.fillStyle = "#0d1f0f";
    board.fillRect(0,canvas.height-80,240,30);

    board.fillStyle = "#19521e";
    let start = 5;
    for (let i = 0; i < 30; i ++){
        board.fillRect(start + (i*8),canvas.height-80,1,30);
    }
    for (let i = 0; i < 4; i ++){
        board.fillRect(0,canvas.height-80 + (i*8),240,1);
    }

    board.fillStyle = "#fff";
    board.font = "16px PIXymbolsLCDW00-Regular";
    let weapon = "Nothing";
    if (you.equiped) weapon = you.equiped.name;
    board.fillText(you.equiped.name,12,canvas.height - 58);
}


function drawHealthBar(){
    board.textAlign = "left";
    let healthPercentage = playerInfo.health/playerInfo.maxHealth;

    board.fillStyle = "#212121";
    board.fillRect(canvas.width*0.66-5,canvas.height-45,(canvas.width)/3+10,40);

    board.fillStyle = "#EC407A";
    board.fillRect(canvas.width*0.66,canvas.height-40,(canvas.width*healthPercentage)/3,30);

    board.fillStyle = "#212121";
    let start = canvas.width*0.66-5;
    for (let i = 0; i < 11; i ++){
        board.fillRect(start + (i*25),canvas.height-45,5,40);
    }
}

function draw(drawArray){
  let map = getCurrentMap();
  board.clearRect(0, 0, canvas.width, canvas.height);//clears board for a new frame
  board.fillStyle = map.backgroundColor;
  board.fillRect(0,0,canvas.width,canvas.height);


  map.drawFloor();


  for(let i = 0; i < drawArray.length; i++){
      let object = drawArray[i];
      board.fillStyle = object.color;

      if (object.hasOwnProperty('attacked')){
          if (object.attacked > 0 ){
              board.fillStyle = "#ef1111";
              object.attacked -= 1;
          }
      }

      if (typeof object.draw === 'function'){
          object.draw();
      }else {
          board.fillRect(object.xpos + camera.xPos, object.ypos + camera.yPos, object.width, object.height);
      }
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
  //board.fillRect(player.xPos + camera.xPos,player.yPos + camera.yPos,20,30);

  you.draw();
  if(currentScreen)currentScreen.display();
  drawMenu();
  drawOverlay();

}
