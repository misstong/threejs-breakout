import GameObject from "./GameObject";


export default class BallObject extends GameObject {
	constructor(pos, radius,velocity, texture, scene) {
		super(pos, { x: radius * 2, y: radius * 2 }, velocity, texture, scene)
		this.radius = radius
		this.stuck = true
		this.sticky = false
		this.passThrough = false
	}

	move(dt, window_width) {
		if (!this.stuck) {
			this.update({ x: this.velocity.x * dt, y: this.velocity.y * dt })
			if (this.position.x <= 0 - window_width/2 +  this.radius ) {
				this.velocity.x = -this.velocity.x
				this.setX(0)
			} else if (this.position.x + this.size.x >= window_width) {
				this.velocity.x = -this.velocity.x;
				this.setX(window_width - this.size.x)
			}

			if (this.position.y <= 0) {
				this.velocity.y = -this.velocity.y;
				this.setY(0)
			}
		}
		return this.position
	}
	reset(pos, velocity) {
		this.position = pos
		this.velocity = velocity
		this.stuck = true
		this.sticky = false
		this.passThrough = false
	}
}