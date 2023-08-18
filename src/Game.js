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

export const WIDTH = 800
export const HEIGHT = 600
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
		this.state = GameState.GAME_ACTIVE
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
					x: 0, y: 0, z: 1100
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
					} else {
						// to add effect
						this.shakeTime = 0.05;
						this.effects.uniforms.shake.value = true;
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
			this.textRenderer.render('Press Enter to start')
		} else if (this.state === GameState.GAME_WIN) {
			this.textRenderer.render('Congratulations! You win!')
		}
		const dt = this.clock.getDelta()
		this.now += dt
		this.processInput(dt) 
		if (this.state === GameState.GAME_ACTIVE) {
			if (this.renderer) {
				// this.renderer.render(this.scene, this.camera.get())
				this.effects.uniforms.time.value = this.now;
				this.composer.render();
			}

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
		if (this.shouldSpawn(75)) {
			this.powerUps.push(new PowerUp('speed', 0.3, block.position,'resources/textures/powerup_speed.png', this.scene, new THREE.Color(0.5, 0.5, 1)))
		}
		if (this.shouldSpawn(75)) {
				this.powerUps.push(new PowerUp('sticky', 20, block.position,'resources/textures/powerup_sticky.png', this.scene, new THREE.Color(1, 0.5, 1)))
		}
		if (this.shouldSpawn(75)) {
				this.powerUps.push(new PowerUp('pass-through', 10, block.position,'resources/textures/powerup_passthrough.png', this.scene, new THREE.Color(0.5, 1, 0.5)))
		}
		if (this.shouldSpawn(75)) {
				this.powerUps.push(new PowerUp('pad-size-increase', 0.5, block.position,'resources/textures/powerup_increase.png', this.scene, new THREE.Color(1, 0.6, 0.4)))
		}
		if (this.shouldSpawn(15)) {
			this.powerUps.push(new PowerUp('confuse', 15, block.position,'resources/textures/powerup_confuse.png', this.scene, new THREE.Color(1, 0.3, 0.3)))
		}
		if (this.shouldSpawn(15)) {
				this.powerUps.push(new PowerUp('chaos', 15, block.position,'resources/textures/powerup_chaos.png', this.scene, new THREE.Color(0.9, 0.25, 0.25)))
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
							this.player.spriteRenderer.sprite.scale.x = this.player.size.x;
						}
					}
				}
			}
		}
	}

}

const game = new Game({
	targetElement: document.querySelector('.experience')
})