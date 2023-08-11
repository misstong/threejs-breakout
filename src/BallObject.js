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
	
	}
	reset(pos, velocity) {
		this.position = pos
		this.velocity = velocity
		this.stuck = true
		this.sticky = false
		this.passThrough = false
	}
}