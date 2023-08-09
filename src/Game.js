import * as THREE from 'three'
import Renderer from './utils/Renderer.js'
import Camera from './utils/Camera.js'

class Game {
	constructor(_options = {}) {
		
		this.targetElement = _options.targetElement
		this.setScene()
		this.setCamera()
		this.setRenderer()
		this.update()
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