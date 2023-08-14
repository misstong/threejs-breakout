import * as THREE from 'three'
import Renderer from './utils/Renderer.js'
import Camera from './utils/Camera.js'
import SpriteRenderer from './SpriteRenderer.js'
import GameObject from './GameObject.js'


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

const PLAYER_VELOCITY = 500;
class Game {
	constructor(_options = {}) {
		this.width = _options.width || 800
		this.height = _options.height || 600
		this.targetElement = _options.targetElement
		this.state = GameState.GAME_ACTIVE
		this.Keys = {} // 表示当前什么键被按下
		this.KeysProcessed = {} // 表示键是否被处理过，适用于只需要处理一次的case
		this.setScene()
		this.setCamera()
		this.setRenderer()
		this.init()
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
		this.PLAYER_SIZE = {x : 100, y: 20 }
		this.player = new GameObject({ x: this.width / 2 - this.PLAYER_SIZE.x / 2, y: this.height - this.PLAYER_SIZE.y },
			this.PLAYER_SIZE, {x: 0, y: 0}, 'resources/textures/paddle.jpg', this.scene
		)
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
					x: 1, y: 1, z: 5
				}
			})
	}
	
    setRenderer()
    {
        this.renderer = new Renderer({ rendererInstance: this.rendererInstance })

        this.targetElement.appendChild(this.renderer.getDomElement())
    }

	update() {
		if (this.renderer) {
			this.renderer.render(this.scene, this.camera.get())
		}

		requestAnimationFrame(this.update.bind(this))
	
	}

	addEventListener() {
			document.addEventListener('keydown', (event) => {
			switch (event.code) {
				case 'KeyA':
					this.Keys['a'] = true
					break
				case 'KeyD':
					this.Keys['d'] = true
					break
				case 'Space':
					this.Keys['space'] = true
					break
				case 'Enter':
					this.Keys['enter'] = true
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
				if (this.player.position.x >= 0) {
					this.player.update(-velocity)
				}
			}
			if (this.Keys['KeyD']) {
				if (this.player.position.x <= this.width - this.player.size.x) {
						this.player.update(velocity)
				}
			}
		}
	}

}

const game = new Game({
	targetElement: document.querySelector('.experience')
})