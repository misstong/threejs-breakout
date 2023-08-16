import * as THREE from 'three'

class Particle{
	constructor(map, scene) {
		this.position = new THREE.Vector2()
		this.color = new THREE.Color()
		this.opacity = 1
		this.life = 0
		this.velocity = new THREE.Vector2()
		this.scene = scene
		this.map = map
		this.initialized = false
	}
	init() {
		const material = new THREE.SpriteMaterial({ map: this.map, color: this.color });
		this.object = new THREE.Sprite(material);
		this.object.scale.set(10, 10, 1)
		this.object.position.set(this.position.x, this.position.y, 0)
		this.scene.add(this.object)
		this.initialized = true
	}
	setColor(rColor) {
		this.color.setRGB(rColor, rColor, rColor);
		// this.object.color.setRGB(rColor, rColor, rColor);
	}

	setPosition(x, y) {
		this.position.set(x, y)
		this.object.position.set(x, y, 0)
	}

}

export class ParticleGenerator{
	constructor(texture, amount, scene) {
		this.texture = texture
		this.amount = amount
		this.scene = scene;
		this.particles = []
		this.lastUsedParticle = 0;
		
		this.init()
	}

	init() {
		const map = new THREE.TextureLoader().load( this.texture );
		for (let i = 0; i < this.amount; i++) {
			this.particles.push(new Particle(map, this.scene))
		}
		
	}

	update(dt, ball, newParticles, offset) {
		for (let i = 0; i < newParticles; i++) {
			const unusedparticle = this.firstUnusedParticle();
			this.respawnParticle(this.particles[unusedparticle], ball, offset);
		}

		for (let i = 0; i < this.amount; i++) {		
			const p =  this.particles[i];
			p.life -= dt;
			if (p.life > 0) {
				p.position.sub(p.velocity.multiplyScalar(dt))
				p.object.position.set(p.position.x,p.position.y,0)
				p.opacity -= dt * 2.5;
				p.object.material.opacity = p.opacity
			}
		}
	}

	firstUnusedParticle() {
		for (let i = this.lastUsedParticle; i < this.amount; i++) {
			if (this.particles[i].life <= 0) {
				this.lastUsedParticle = i;
				return i;
			}
		}

		for (let i = 0; i < this.lastUsedParticle; i++) {
			if (this.particles[i].life <= 0) {
				this.lastUsedParticle = i;
				return i;
			}
		}
		this.lastUsedParticle = 0
		return 0
	}
	respawnParticle(p, ball, offset) {
		const random = Math.random() * 10 - 5;
		const rColor = 0.5 + Math.random();
		if (!p.initialized) {
			p.init()
		}
		p.life = 1
		p.velocity.set(ball.velocity.x * 0.1, ball.velocity.y * 0.1)
		p.setColor(rColor);
		p.object.material.opacity = 1
		p.opacity=1
		p.setPosition(ball.position.x+random+offset.x, ball.position.y+random+offset.y)

	}
}