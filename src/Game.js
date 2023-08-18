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
		this.targetElement = _options.targetElement
		this.state = GameState.GAME_ACTIVE
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
		this.player = new GameObject(transPos(this.width, this.height,playerPos),
			this.PLAYER_SIZE, {x: 0, y: 0}, 'resources/textures/paddle.png', this.scene
		)
		this.player.spriteRenderer.sprite.name = 'player'
		this.readLevels()

		const ballPos = {x: playerPos.x, y: playerPos.y - this.PLAYER_SIZE.y/2 - BALL_RADIUS }
		this.ball = new BallObject(transPos(this.width, this.height,ballPos),BALL_RADIUS, INITIAL_BALL_VELOCITY,'resources/textures/awesomeface.png',this.scene)
		this.ball.spriteRenderer.sprite.name = 'ball'
		
		this.particles = new ParticleGenerator('resources/textures/particle.png',500, this.scene)
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
			// this.renderer.get().setViewport(0,0,this.width,this.height)
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

					} else {
						// to add effect
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
		const result = checkCollision(this.ball, this.player)
		if (!this.ball.stuck && result[0]) {
			const distance = this.ball.position.x - this.player.position.x;
			const percentage = distance / this.player.size.x * 2
			const strength = 2

			const oldlen = length(this.ball.velocity)
			this.ball.velocity.x = strength * percentage * INITIAL_BALL_VELOCITY.x;
			this.ball.velocity.y = -this.ball.velocity.y;

			
			const len = length(this.ball.velocity)
			this.ball.velocity.x = this.ball.velocity.x / len * oldlen;
			this.ball.velocity.y = this.ball.velocity.y / len * oldlen;
			// this.ball.stuck = true
		}
	}

	update() {
		if (this.renderer) {
			// this.renderer.render(this.scene, this.camera.get())
			this.composer.render();
		}
		this.doCollisions()
		// if (this.levels.length) {
		// 	this.levels[this.level].update()
		// }
		
		const dt = this.clock.getDelta()
		this.particles.update(dt, this.ball,2,{x: BALL_RADIUS/2, y: BALL_RADIUS/2})
		this.processInput(dt) 
		this.ball.move(dt, this.width, HEIGHT)
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
	}

}

const game = new Game({
	targetElement: document.querySelector('.experience')
})