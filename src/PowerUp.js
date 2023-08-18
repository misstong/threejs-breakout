import GameObject from "./GameObject";

const POWERUP_SIZE = {
	x: 60,
	y: 20
};
const VELOCITY = {
	x: 0,
	y: -150
}
export default class PowerUp extends GameObject{
	constructor(type, duration, position,  texture, scene,color) {	
		super(position, POWERUP_SIZE, VELOCITY, texture, scene, color);
		this.type = type
		this.duration = duration
		this.activated = false
		this.spriteRenderer.sprite.name = 'powerup:' + type
		console.log('------spawn power up------' ,type)
	}
}