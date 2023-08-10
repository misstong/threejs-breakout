import * as THREE from 'three'

export default class SpriteRenderer{
	constructor(scene) {
		this.scene = scene;
	}
	drawSprite(texture, position, size) {
		const map = new THREE.TextureLoader().load( texture );
		const material = new THREE.SpriteMaterial( { map: map } );
		const sprite = new THREE.Sprite(material);
		sprite.position.set(position.x, position.y, position.z);
		sprite.scale.set(size.x, size.y, size.z);
		this.scene.add(sprite)
		
	}
}