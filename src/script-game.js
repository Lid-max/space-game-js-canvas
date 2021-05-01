const MONSTER_TOTAL = 5;
const MONSTER_WIDTH = MONSTER_TOTAL * 98;
const HERO_STEP = 15;

const KEYCODES = {
	DOWN: 40,
	UP: 38,
	LEFT: 37,
	RIGHT: 39,
	SPACE: 32,
};

let canvas;
let ctx;
let hero;
let gameObjects = [];
let game;
let weapon;
let lasarImg;
let isHot = false;

gameInit().then(() => {
	let gameLoopId = setInterval(() => {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		checkIfEnemyExists();
		checkIfStrickes();

		if (game.endGameStatus) {
			clearInterval(gameLoopId);
			window.removeEventListener("keydown", onKeyDown);
			alert(game.endGameStatus);
			return;
		}

		drawGameObjects();
		game.random = Math.random();
	}, 100);
});

window.addEventListener("keydown", onKeyDown);

function onKeyDown(e) {
	switch (e.keyCode) {
		case KEYCODES.DOWN:
			if (hero.y + hero.height < canvas.height) {
				hero.y += HERO_STEP;
			}
			break;
		case KEYCODES.UP:
			if (hero.y > HERO_STEP) {
				hero.y -= HERO_STEP;
			}
			break;
		case KEYCODES.LEFT:
			if (hero.x > HERO_STEP) {
				hero.x -= HERO_STEP;
			}
			break;
		case KEYCODES.RIGHT:
			if (hero.x + hero.width < canvas.width) {
				hero.x += HERO_STEP;
			}
			break;
		case KEYCODES.SPACE:
			if (!isHot) {
				fire();
			}
			break;
	}
}

function fire() {
	weapon = new Weapon(lasarImg, 0, 0);
	gameObjects.push(weapon);

	weapon.x = hero.x + 45;
	weapon.y = hero.y - 40;
	weapon.isVisible = true;

	weapon.fire();
	makeFireGunHot();
}

function makeFireGunHot() {
	setTimeout(() => {
		isHot = true;
	}, 200);

	setTimeout(() => {
		isHot = false;
	}, 900);
}

function drawGameObjects() {
	gameObjects.forEach((go) => {
		if (go.isVisible) {
			go.draw();
		}
	});
}

class GameObject {
	constructor(img, x, y) {
		this.x = x;
		this.y = y;
		this.type = "";

		this.img = img;
		this.width = img.naturalWidth;
		this.height = img.naturalHeight;
		this.endGameText = null;
		this.isVisible = true;
		this.random;
	}

	draw() {
		ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
	}

	get endGameStatus() {
		return this.endGameText;
	}

	stopGame(text) {
		this.endGameText = text;
	}
}

class Hero extends GameObject {
	constructor(img, x, y) {
		super(img, x, y);
		this.type = "Hero";
	}
}

class Enemy extends GameObject {
	constructor(img, x, y) {
		super(img, x, y);
		this.type = "Enemy";

		let id = setInterval(() => {
			if (this.y < canvas.height - this.height) {
				this.y += 5;

				if (game.random > 0.5) {
					this.x -= 5;
				} else {
					this.x += 5;
				}
			} else {
				game.stopGame("game over");
				clearInterval(id);
			}
		}, 800);
	}
}

class Weapon extends GameObject {
	constructor(img, x, y) {
		super(img, x, y);
		this.type = "Weapon";
		this.isVisible = false;
	}

	fire() {
		let id = setInterval(() => {
			if (this.y < canvas.height - this.height) {
				this.y -= 5;
			} else {
				clearInterval(id);
			}
		}, 50);
	}
}

function loadAsset(path) {
	return new Promise((resolve) => {
		const img = new Image();
		img.src = path;
		img.onload = () => {
			resolve(img);
		};
	});
}

async function gameInit() {
	const heroImg = await loadAsset("assets/hero.png");
	const monsterImg = await loadAsset("assets/monster.png");
	lasarImg = await loadAsset("assets/laser.png");

	canvas = document.getElementById("myCanvas");
	ctx = canvas.getContext("2d");
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height); // x,y,width, height

	hero = new Hero(
		heroImg,
		canvas.width / 2 - 45,
		canvas.height - canvas.height / 4
	);

	gameObjects.push(hero);

	createMonsters(monsterImg);

	game = new GameObject(0, 0);
}

function createMonsters(monsterImg) {
	const START_X = (canvas.width - MONSTER_WIDTH) / 2;
	const STOP_X = START_X + MONSTER_WIDTH;

	for (let x = START_X; x < STOP_X; x += 98) {
		for (let y = 0; y < 50 * 5; y += 50) {
			const monster = new Enemy(monsterImg, x, y);

			gameObjects.push(monster);
		}
	}
}

function checkIfEnemyExists() {
	const aliveEnemy = gameObjects.filter(
		(i) => i.type === "Enemy" && i.isVisible === true
	);

	if (aliveEnemy.length === 0) {
		game.stopGame("you win!");
	}
}

function checkIfStrickes() {
	gameObjects.some((i) => {
		if (i.type === "Enemy" && i.isVisible) {
			if (rectOverflow(i, hero)) {
				game.stopGame("game over");
				return;
			}
		}
	});

	gameObjects.some((i) => {
		if (i.type === "Weapon" && i.isVisible) {
			gameObjects.some((j) => {
				if (j.type === "Enemy" && j.isVisible) {
					if (rectOverflow(j, i)) {
						j.isVisible = false;
						i.isVisible = false;
					}
				}
			});
		}
	});
}

function rectOverflow(r1, r2) {
	return !(
		r2.x > r1.x + r1.width ||
		r2.x + r2.width < r1.x ||
		r2.y > r1.y + r1.height ||
		r2.y + r2.height < r1.y
	);
}
