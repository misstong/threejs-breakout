import * as THREE from 'three'
import Renderer from './utils/Renderer.js'
import Camera from './utils/Camera.js'
import SpriteRenderer from './SpriteRenderer.js'

class Game {
	constructor(_options = {}) {
		this.width = _options.width || 1280
		this.height = _options.height || 720
		this.targetElement = _options.targetElement
		this.setScene()
		this.setCamera()
		this.setRenderer()
		this.update()
	}

	init() {
		this.background = new SpriteRenderer(this.scene)
		this.background.drawSprite('resources/textures/backgroud.jpg', {
			x: 0,
			y: 0,
			z: 0
		}, {
			x: this.width,
			y: this.height,
			z: 1
		})
	}

	setScene()
	{
		this.scene = new THREE.Scene()
		        const cube = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
             new THREE.MeshBasicMaterial( { color: 0x00ff00 } )
        )
        this.scene.add(cube)      
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

	processInput() {
	
	}

}

const game = new Game({
	targetElement: document.querySelector('.experience')
})