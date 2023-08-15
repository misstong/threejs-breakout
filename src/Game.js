import * as THREE from 'three'
import Renderer from './utils/Renderer.js'
import Camera from './utils/Camera.js'
import SpriteRenderer from './SpriteRenderer.js'
import GameObject from './GameObject.js'
import BallObject from './BallObject.js'
import GameLevel from './GameLevel.js'
import { LEVEL1, LEVEL2, LEVEL3} from './levels/levels.js'

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
// 		const geometry = new THREE.BoxGeometry( 100, 100, 100 );
// const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
// 		const cube = new THREE.Mesh(geometry, material);
// 		cube.position.set(0,0,0)
// 		this.scene.add( cube );
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
		this.PLAYER_SIZE = { x: 100, y: 20 }
		const playerPos = { x: this.width / 2 , y: this.height - this.PLAYER_SIZE.y }
		this.player = new GameObject(transPos(this.width, this.height,playerPos),
			this.PLAYER_SIZE, {x: 0, y: 0}, 'resources/textures/paddle.png', this.scene
		)

		const ballPos = {x: playerPos.x, y: playerPos.y - this.PLAYER_SIZE.y/2 - BALL_RADIUS/2 }
		this.ball = new BallObject(transPos(this.width, this.height,ballPos),BALL_RADIUS, INITIAL_BALL_VELOCITY,'resources/textures/awesomeface.png',this.scene)
	}

	readLevels() {
		const one = new GameLevel(LEVEL1, this.width, this.height);
		const two = new GameLevel(LEVEL2, this.width, this.height);
		const three = new GameLevel(LEVEL3, this.width, this.height);

		this.levels.push(one)
		this.levels.push(two);
		this.levels.push(three)
		this.levels[this.level].draw()
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
		}
	

	update() {
		if (this.renderer) {
			this.renderer.render(this.scene, this.camera.get())
		}
		const dt = this.clock.getDelta()
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
			}
		}
	}

}

const game = new Game({
	targetElement: document.querySelector('.experience')
})