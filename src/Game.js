import * as THREE from 'three'
import Renderer from './utils/Renderer.js'
import Camera from './utils/Camera.js'
import SpriteRenderer from './SpriteRenderer.js'
import GameObject from './GameObject.js'
import BallObject from './BallObject.js'
import GameLevel from './GameLevel.js'
import { LEVEL1, LEVEL2, LEVEL3} from './levels/levels.js'
import { ParticleGenerator } from './ParticleGenerator.js'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
// import { OutputPass } from 'three/examples/js/postprocessing/OutputPass.js';
import { PostProcessingShader } from './shaders/PostProcessingShader.js'
import PowerUp from './PowerUp.js'
import TextRenderer from './TextRenderer.js'
import {SFX} from './SFX.js'
const  GameState = {
	GAME_ACTIVE: 0,
	GAME_MENU: 1,
	GAME_WIN: 2
}

const Direction ={
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
};

const transPos = (width, height, pos) => {
	const x = pos.x - width / 2;
	const y = pos.y - height / 2;
	return {x, y: -y}
}

function clamp(v, low, high) {
	return {
		x: Math.max(low.x, Math.min(v.x, high.x)),
		y: Math.max(low.y, Math.min(v.y, high.y))
	};
}

function length(v) {
	return Math.sqrt(v.x * v.x + v.y * v.y);
}

function VectorDirection(target) {
	const compass = [
		{ x: 0, y: 1 },
		{ x: 1, y: 0 },
		{ x: 0, y: -1 },
		{ x: -1, y: 0 }
	]
	let max = 0;
	let best_match = -1;
	for (let i = 0; i < 4; i++) {
		let item = compass[i]
		const dot_product = item.x * target.x + item.y * target.y;
		if (dot_product > max) {
			max = dot_product;
			best_match = i;
		}
	}
	return best_match;
}

function checkCollision(ball, other) {
	const ballPos = ball.position;
	const twoPos = other.position;

	const aabbHalfSize = {
		x: other.size.x / 2,
			y: other.size.y / 2
	}
	const difference = {
		x: ballPos.x - twoPos.x,
		y: ballPos.y - twoPos.y
	}

	const clamped = clamp(difference, {x: -aabbHalfSize.x, y: -aabbHalfSize.y}, aabbHalfSize)
	const closest = {
		x: twoPos.x + clamped.x,
		y: twoPos.y+clamped.y
	}

	const diff = {
		x:  closest.x - ballPos.x,
		y:  closest.y - ballPos.y
	}

	if (diff.x * diff.x + diff.y * diff.y < ball.radius * ball.radius) {
		return [true, VectorDirection(diff), diff]
	} else {
		return [false,Direction.UP, {x:0,y:0} ]
	}

}

function checkAABBCollision(one, other) {
	const collisionX = one.position.x + one.size.x >= other.position.x && one.position.x <= other.position.x + other.size.x
	const collisionY = one.position.y + one.size.y >= other.position.y && one.position.y <= other.position.y + other.size.y
	return collisionX && collisionY
}

	function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export const WIDTH = window.screen.width || 800
export const HEIGHT =  window.screen.height|| 600
const PLAYER_VELOCITY = 500;
const BALL_RADIUS = 12

const INITIAL_BALL_VELOCITY = { x: 100, y: 350.0 };
class Game {
	constructor(_options = {}) {
		this.width = _options.width || 800
		this.height = _options.height || 600
		this.levels = []
		this.level = 0
		this.shakeTime = 0;
		this.powerUps = []
		this.targetElement = _options.targetElement
		this.state = GameState.GAME_MENU
		this.now = 0
		this.Keys = {} // 表示当前什么键被按下
		this.KeysProcessed = {} // 表示键是否被处理过，适用于只需要处理一次的case
		this.clock = new THREE.Clock()
		this.clock.start()
		this.setScene()
		this.setCamera()
		this.setRenderer()
		
		this.init()
		this.addEventListener()
		this.update()
		// if (this.composer) {
		// 	this.composer.render();
		// }
	}

	init() {
		this.background = new SpriteRenderer(this.scene)
		this.background.drawSprite('resources/textures/background.jpg', {
			x: 0,
			y: 0,
			z: 0
		}, {
			x: this.width,
			y: this.height,
			z: 1
		})
		this.background.sprite.name = 'back'
		this.PLAYER_SIZE = { x: 100, y: 20 }
		const playerPos = { x: this.width / 2 , y: this.height - this.PLAYER_SIZE.y }
		this.playerPos = playerPos;
		this.player = new GameObject(transPos(this.width, this.height,playerPos),
			this.PLAYER_SIZE, {x: 0, y: 0}, 'resources/textures/paddle.png', this.scene
		)
		this.player.spriteRenderer.sprite.name = 'player'
		this.readLevels()

		const ballPos = {x: playerPos.x, y: playerPos.y - this.PLAYER_SIZE.y/2 - BALL_RADIUS }
		this.ballPos = ballPos
		this.ball = new BallObject(transPos(this.width, this.height, ballPos), BALL_RADIUS, { ...INITIAL_BALL_VELOCITY },'resources/textures/awesomeface.png',this.scene)
		this.ball.spriteRenderer.sprite.name = 'ball'
		
		this.particles = new ParticleGenerator('resources/textures/particle.png',500, this.scene)
		this.textRenderer = new TextRenderer(this.width, this.height);
		this.initSounds()
	}
	initSounds() {
		this.listener = new THREE.AudioListener();
		this.camera.get().add(this.listener);
		this.sfx=new SFX(this.camera,'resources/audio/',this.listener)
		this.sfx.load('bleep.mp3', 'bleep')
		this.sfx.load('bleep.wav', 'bleep2')
		this.sfx.load('powerup.wav', 'powerup')
		this.sfx.load('breakout.mp3', 'breakout', true, 0.5, null, true)
	}

	readLevels() {
		const one = new GameLevel(LEVEL1, this.width, this.height/2,this.height, this.scene);
		// const two = new GameLevel(LEVEL2, this.width, this.height/2,this.height,this.scene);
		// const three = new GameLevel(LEVEL3, this.width, this.height/2, this.height,this.scene);

		this.levels.push(one)
		// this.levels.push(two);
		// this.levels.push(three)
	}

	setScene()
	{
		this.scene = new THREE.Scene()
		    //     const cube = new THREE.Mesh(
        //     new THREE.BoxGeometry(1, 1, 1),
        //      new THREE.MeshBasicMaterial( { color: 0x00ff00 } )
        // )
        // this.scene.add(cube)      
	}

	setCamera()
	{
			this.camera = new Camera({
				position: {
					x: 0, y: 0, z: WIDTH < 1000 ? 1200 : 1900
				}
			})
	}
	
	setRenderer()
	{
		this.renderer = new Renderer({ rendererInstance: this.rendererInstance })
		this.targetElement.appendChild(this.renderer.getDomElement())
		
		this.composer = new EffectComposer(this.renderer.get())

		this.renderPass = new RenderPass(this.scene, this.camera.get())

		this.composer.addPass(this.renderPass)
		this.effects = new ShaderPass(PostProcessingShader)
		this.effects.renderToScreen = true
		this.composer.addPass(this.effects)
		// this.composer.addPass(new OutputPass())
	}
	
	doCollisions() {
		for (let brick of this.levels[this.level].bricks) {
			if (!brick.isDestroyed) {
				const collision = checkCollision(this.ball, brick);
				
				if (collision[0]) {
					// console.log('------coloii', collision)
					if (!brick.solid) {
						brick.isDestroyed = true;
						brick.destroy()
						this.spawnPowerUps(brick)
						this.sfx.play('bleep')
					} else {
						// to add effect
						this.shakeTime = 0.05;
						this.effects.uniforms.shake.value = true;
						this.sfx.play('bleep')
					}
					const dir = collision[1]
					const diff_vector = collision[2]
					if (!(this.ball.passThrough && !brick.solid)) {
						if (dir === Direction.LEFT || dir === Direction.RIGHT) {
								this.ball.velocity.x = -this.ball.velocity.x
								const penetration = BALL_RADIUS-Math.abs(diff_vector.x)
							if (dir === Direction.LEFT) {
								this.ball.position.x += penetration
							} else {
								this.ball.position.x -= penetration
							}
							this.ball.spriteRenderer.sprite.position.x = this.ball.position.x;
						} else {
							this.ball.velocity.y = -this.ball.velocity.y;
							const penetration = BALL_RADIUS-Math.abs(diff_vector.y)
							if (dir === Direction.UP) {
								this.ball.position.y -= penetration
							} else {
								this.ball.position.y += penetration
							}
							this.ball.spriteRenderer.sprite.position.y = this.ball.position.y;
						}
					}
				}
			}
		}

		// power up
		for (let powerUp of this.powerUps) {
			if (!powerUp.isDestroyed) {
				if (powerUp.position.y < -this.height / 2) {
					powerUp.isDestroyed = true;
					powerUp.destroy()
				}

				if (checkAABBCollision(this.player, powerUp)) {
					powerUp.isDestroyed = true;
					powerUp.destroy();
					powerUp.activated = true
					this.activatePowerUp(powerUp)
					this.sfx.play('powerup')
				}
			}
		}

		const result = checkCollision(this.ball, this.player)
		if (!this.ball.stuck && result[0]) {
			const distance = this.ball.position.x - this.player.position.x;
			const percentage = distance / this.player.size.x * 2
			const strength = 2

			// const oldlen = length(this.ball.velocity)
			// console.log('-----INITIAL_BALL_VELOCITY',INITIAL_BALL_VELOCITY )
			this.ball.velocity.x = strength * percentage * INITIAL_BALL_VELOCITY.x;
			
			// const len = length(this.ball.velocity)
			// this.ball.velocity.x = this.ball.velocity.x / len * oldlen;
			// this.ball.velocity.y = this.ball.velocity.y / len * oldlen;
			this.ball.velocity.y = -this.ball.velocity.y;
				// console.log('-----collison velociry, percentage', percentage,this.ball.velocity )
			this.ball.stuck = this.ball.sticky
			this.sfx.play('bleep2')
		}
	}
	activatePowerUp(powerUp) {
		if (powerUp.type === 'speed') {
			this.ball.velocity.y *= 1.2
		}
		else if (powerUp.type === 'sticky') {
			this.ball.sticky = true;
			this.player.updateColor(new THREE.Color(1, 0.5, 1))
		} else if (powerUp.type === 'pass-through') {
			this.ball.passThrough = true
			this.ball.updateColor(new THREE.Color(1, 0.5, 0.5))
		} else if (powerUp.type === "pad-size-increase") {
			this.player.size.x += 50
			this.player.spriteRenderer.sprite.scale.x = this.player.size.x;
		} else if (powerUp.type === "confuse") {
			if (!this.effects.chaos) {
				this.effects.uniforms.confuse.value = true;
				this.effects.confuse = true
			}
		} else if (powerUp.type === 'chaos') {
			if (!this.effects.confuse) {
				this.effects.uniforms.chaos.value = true;
				this.effects.chaos = true;
			}
		}
	}

	update() {
		if (this.state === GameState.GAME_MENU) {
			
			if (this.width > 800) {
				console.log('this width', this.width, !this.width < 800)
				this.textRenderer.render('Press Enter to start <br/>空格键发球,AD键左右移动')
			} else {
				showMobileTips()
			}
			
		} else if (this.state === GameState.GAME_WIN) {
			this.textRenderer.render('Congratulations! You win!')
		}
		const dt = this.clock.getDelta()
		this.now += dt
		this.processInput(dt) 
		if (this.renderer) {
			// this.renderer.render(this.scene, this.camera.get())
			this.effects.uniforms.time.value = this.now;
			this.composer.render();
		}
		if (this.state === GameState.GAME_ACTIVE) {
			this.doCollisions()	
			if (this.shakeTime > 0) {
				this.shakeTime -= dt;
				if (this.shakeTime <= 0) {
					this.effects.uniforms.shake.value = false;
				}
			}
			this.updatePowerUps(dt)
			this.particles.update(dt, this.ball,2,{x: BALL_RADIUS/2, y: BALL_RADIUS/2})	
			this.ball.move(dt, this.width, HEIGHT)
			if (this.ball.position.y < -this.height / 2) {
				this.state = GameState.GAME_MENU
			}
			if (this.state === GameState.GAME_ACTIVE && this.levels[this.level].isCompleted()) {
				this.state = GameState.GAME_WIN
			}
		}
		requestAnimationFrame(this.update.bind(this))
	}

	addEventListener() {
			document.addEventListener('keydown', (event) => {
				switch (event.code) {
					case 'KeyA':
					case 'KeyD':
					case 'Space':
					case 'Enter':
						this.Keys[event.code] = true
					break

				default:
					break
			}
		})

		document.addEventListener('keyup', (event) => {
			switch (event.code) {
				case 'KeyA':
				case 'KeyD':
				case 'Space':
				case 'Enter':
					this.Keys[event.code] = false
					this.KeysProcessed[event.code] = false
					break

				default:
					break
			}
		})
	}

	processInput(dt) {
		if (this.state === GameState.GAME_ACTIVE) {
			const velocity = PLAYER_VELOCITY * dt;
			if (this.Keys['KeyA']) {
				if (this.player.position.x >= 0 - this.width /2 + this.PLAYER_SIZE.x /2 ) {
					this.player.update(-velocity)
					if (this.ball.stuck) {
						this.ball.update(-velocity)
					}
				}
			}
			if (this.Keys['KeyD']) {
				if (this.player.position.x <= this.width/2 - this.player.size.x/2) {
					this.player.update(velocity)
								if (this.ball.stuck) {
						this.ball.update(velocity)
					}
				}
			}
			if (this.Keys['Space']) {
				this.ball.stuck = false
				// this.scene.remove(this.player.spriteRenderer.sprite)
			}	
		}
		console.log('state', this.state===GameState.GAME_MENU)
		if (this.state === GameState.GAME_MENU) {
			if (this.Keys['Enter'] && !this.KeysProcessed['Enter']) {
				this.resetGame()
				this.state = GameState.GAME_ACTIVE
				this.textRenderer.hide()
			}
		}
		if (this.state === GameState.GAME_WIN) {
			if (this.Keys['KeyEnter']) {
				this.state = GameState.GAME_MENU;
			}
		}

	}

	resetGame() {
		this.player.updatePosition(	transPos(this.width, this.height,this.playerPos)	)
		this.ball.updatePosition(transPos(this.width, this.height, this.ballPos))
		this.ball.velocity = { ...INITIAL_BALL_VELOCITY }
		this.ball.stuck = true
	}


	shouldSpawn(chance) {
		const rand = getRandomInt(chance);
		return rand === 0
	}
	spawnPowerUps(block) {
		if (this.shouldSpawn(15)) {
			this.powerUps.push(new PowerUp('speed', 5, block.position,'resources/textures/powerup_speed.png', this.scene, new THREE.Color(0.5, 0.5, 1)))
		}
		if (this.shouldSpawn(15)) {
				this.powerUps.push(new PowerUp('sticky', 5, block.position,'resources/textures/powerup_sticky.png', this.scene, new THREE.Color(1, 0.5, 1)))
		}
		if (this.shouldSpawn(15)) {
				this.powerUps.push(new PowerUp('pass-through', 10, block.position,'resources/textures/powerup_passthrough.png', this.scene, new THREE.Color(0.5, 1, 0.5)))
		}
		if (this.shouldSpawn(15)) {
				this.powerUps.push(new PowerUp('pad-size-increase', 7, block.position,'resources/textures/powerup_increase.png', this.scene, new THREE.Color(1, 0.6, 0.4)))
		}
		if (this.shouldSpawn(15)) {
			this.powerUps.push(new PowerUp('confuse', 15, block.position,'resources/textures/powerup_confuse.png', this.scene, new THREE.Color(1, 0.3, 0.3)))
		}
		if (this.shouldSpawn(15)) {
				this.powerUps.push(new PowerUp('chaos', 5, block.position,'resources/textures/powerup_chaos.png', this.scene, new THREE.Color(0.9, 0.25, 0.25)))
		}
	}

	isOtherPowerUpActivated(type) {
		for (let power of this.powerUps) {
			if (power.activated) {
				if (power.type === type) {
					return true;
				}
			}
		}
		return false
	}

	updatePowerUps(dt) {
		for (let i = 0; i < this.powerUps.length; i++) {
			let powerUp = this.powerUps[i];
			powerUp.update({x: powerUp.velocity.x *dt, y: powerUp.velocity.y *dt});
			if (powerUp.activated) {
				powerUp.duration -= dt;
				if (powerUp.duration <= 0) {
					powerUp.activated = false
					if (powerUp.type === 'sticky') {
						if (!this.isOtherPowerUpActivated('sticky')) {
							this.ball.sticky = false;
							this.player.updateColor(new THREE.Color(1,1,1))
						} 
					} else if (powerUp.type === 'pass-through') {
						if (!this.isOtherPowerUpActivated('pass-through')) {
							this.ball.passThrough = false;
							this.ball.updateColor(new THREE.Color(1,1,1))
						}
					} else if (powerUp.type === 'confuse') {
						if (!this.isOtherPowerUpActivated('confuse')) {
							this.effects.confuse = false;
							this.effects.uniforms.confuse.value = false;
						}
					}
					else if (powerUp.type === 'chaos') {
						if (!this.isOtherPowerUpActivated('chaos')) {
							this.effects.chaos = false;
							this.effects.uniforms.chaos.value = false;
						}
					} else if (powerUp.type === 'speed') {
						if (!this.isOtherPowerUpActivated('speed')) {
							this.ball.velocity.y = this.ball.velocity.y / 1.2
							
						}
					} else if (powerUp.type === 'pad-size-increase') {
						if (!this.isOtherPowerUpActivated('pad-size-increase')) {
							this.player.size.x -= 50;
							this.player.spriteRenderer.sprite.scale.set( this.player.size.x,20 ,1);
						}
					}
				}
			}
		}
	}

}
console.log('width----,', WIDTH)
window.mobileCheck = function() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

const start = document.querySelector('.start')
const kick = document.querySelector('.kick')
const left = document.querySelector('.left')
const right = document.querySelector('.right')
let hasShown = false
function showMobileTips() {
	if (hasShown) {
		return
	}
	start.style.opacity = 1;
	kick.style.opacity = 1;
	hasShown = true
}
const game = new Game({
	targetElement: document.querySelector('.experience'),
	width: WIDTH,
	height: HEIGHT
})





document.addEventListener('DOMContentLoaded', e => {
	if(mobileCheck()) {

		console.log('mobile detected-------------------')
		const nodes = document.querySelectorAll('.mobile')
		for(let node of nodes) {
			node.style.opacity=1
		}
		hasShown = true
		start.addEventListener('touchstart', e=> {
			game.Keys['Enter'] = true
			start.style.opacity=0
		})
		start.addEventListener('touchend', e=> {
			game.Keys['Enter'] = false;
			game.KeysProcessed['Enter'] = false

		})

		kick.addEventListener('touchstart', e=> {
			game.Keys['Space'] = true;
			kick.style.opacity=0
			hasShown = false
		})
		kick.addEventListener('touchend', e=> {
			game.Keys['Space'] = false;
			game.KeysProcessed['Space'] = false
		})

		left.addEventListener('touchstart', e=>{
			game.Keys['KeyA'] = true

		})
		left.addEventListener('touchend', e=>{
			game.Keys['KeyA'] = false
			game.KeysProcessed['KeyA'] = false
		})
		right.addEventListener('touchstart', e=>{
			game.Keys['KeyD'] = true

		})
		right.addEventListener('touchend', e=>{
			game.Keys['KeyD'] = false
			game.KeysProcessed['KeyD'] = false
		})
	}

})