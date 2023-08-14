import * as THREE from 'three'

export function getZRatio () {
  if (window.innerWidth > 1100) {
    return 170
  } else if (window.innerWidth > 700) {
    return 100
  } else if (window.innerWidth > 500) {
    return 85
  } else {
    return 50
  }
}

export default class Camera {
	constructor({
    fov = 400,
    aspectRatio = window.innerWidth / window.innerHeight,
    near = 0.1,
    far = 2000,
    position = {
      x: 0, y: 0, z: 0
    },
    up = [0, 0, 1]
	}) {
		this.camera = new THREE.PerspectiveCamera(fov, aspectRatio, near, far)
		this.up = up
		this.setPosition(position)
    this.setUp(...this.up)
		this.setLookAt()
		window.addEventListener('resize', this.onWindowResize.bind(this))
	}

	onWindowResize () {
    const WIDTH = window.innerWidth
    const HEIGHT = window.innerHeight

    this.camera.aspect = WIDTH / HEIGHT
    // this.setZ(window.innerHeight / getZRatio())
    this.camera.updateProjectionMatrix()
	}
	setUp (x, y, z) {
    this.camera.up.set(x, y, z)
  }

  setPosition ({
    x = this.camera.position.x,
    y = this.camera.position.y,
    z = this.camera.position.z
  }) {
    this.setX(x)
    this.setY(y)
    this.setZ(z)
  }

  setX (x) {
    this.camera.position.x = x
    this.setLookAt()
  }

  setY (y) {
    this.camera.position.y = y
    this.setLookAt()
  }

  setZ (z) {
    this.camera.position.z = z
    this.setLookAt()
    this.setUp(0, 0, 1)
  }

  setLookAt () {
    this.camera.lookAt(new THREE.Vector3(0, 0, 0))
	}
	  get () {
    return this.camera
  }

  getPosition () {
    return this.camera.position
  }

  getZ () {
    return this.camera.position.z
  }
}