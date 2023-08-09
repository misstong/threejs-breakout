import * as THREE from 'three'

export default class Renderer {
	constructor({
		alpha = true,
		    pixelRatio = window.devicePixelRatio,
    width = window.innerWidth,
    height = window.innerHeight,
	}) {
		this.renderer = new THREE.WebGLRenderer({ alpha }) 

		this.setPixelRatio(pixelRatio)
    this.setSize(width, height)
		window.addEventListener('resize', this.onWindowResize.bind(this))
	}

	
  onWindowResize () {
    const WIDTH = window.innerWidth
    const HEIGHT = window.innerHeight
    this.renderer.setSize(WIDTH, HEIGHT)
  }
	setPixelRatio (pixelRatio) {
    this.renderer.setPixelRatio(pixelRatio)
  }

  setSize (w, h) {
    this.renderer.setSize(w, h)
	}
	getDomElement () {
    return this.renderer.domElement
	}
	get () {
    return this.renderer
	}
	
	render (
    scene,
    camera,

  ) {
    this.renderer.render(scene, camera)
  }


}