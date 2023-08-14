import * as THREE from 'three'
import SpriteRenderer from './SpriteRenderer'

export default class GameObject {
	constructor(position, size, velocity, texture, scene) {
		this.position = position
		this.size = size
		this.velocity = velocity
		this.scene = scene
		this.texture = texture
		this.spriteRenderer = new SpriteRenderer(scene)
		this.solid = false
		this.isDestroyed = false
		this.draw()
	}
	update(dx) {
		this.position.x += dx;
		this.scene.position.x += dx
	}
	draw() {
		this.spriteRenderer.drawSprite(this.texture, this.position, this.size)
	}
}