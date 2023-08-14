import * as THREE from 'three'

export default class SpriteRenderer{
	constructor(scene) {
		this.scene = scene;
	}
	drawSprite(texture, position, size) {
		const map = new THREE.TextureLoader().load( texture );
		const material = new THREE.SpriteMaterial( { map: map } );
		const sprite = new THREE.Sprite(material);
		sprite.position.set(position.x, position.y,0);
		sprite.scale.set(size.x, size.y, 1);
		this.scene.add(sprite)
		
	}
}