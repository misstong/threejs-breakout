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
		this.physicallyRemoved = false
		this.draw()
	}
	update(delta) {
		if (typeof delta === 'object') {
			this.position.x += delta.x;
			this.spriteRenderer.sprite.position.x += delta.x
			this.position.y += delta.y;
			this.spriteRenderer.sprite.position.y += delta.y
		} else {
			this.position.x += delta;
			this.spriteRenderer.sprite.position.x += delta
		}

	}
	setX(x) {
		this.position.x = x;
		this.spriteRenderer.sprite.position.x = x
	}
	setY(y) {
		this.position.y = y;
		this.spriteRenderer.sprite.position.y = y
	}
	draw() {
		this.spriteRenderer.drawSprite(this.texture, this.position, this.size)
	}

	destroy() {
		if (this.physicallyRemoved) {
			return
		}
		if (this.isDestroyed) {
			this.scene.remove(this.spriteRenderer.sprite)
				this.physicallyRemoved = true
		}
	}
}