import GameObject from "./GameObject"

const transPos = (width, height, pos) => {
	const x = pos.x - width / 2;
	const y = pos.y - height / 2;
	return {x, y: -y}
}
export default class GameLevel {
	constructor(tileData, width, height,totalHeight ,scene) {
		this.scene = scene
		this.tileData = tileData
		this.width = width
		this.height = height
		this.totalHeight = totalHeight
		this.bricks = []
		this.init()
	}

	init() {
		this.bricks = []
		let h = this.tileData.length
		let w = this.tileData[0].length
		const unit_width = this.width / w;
		const unit_height = this.height / h;

		for (let y = 0; y < h; y++){
			for (let x = 0; x < w; x++) {
				if (this.tileData[y][x] === 1) {
					const pos = { x: x * unit_width + unit_width /2, y: y * unit_height + unit_height/2 };
					const size = {x: unit_width, y: unit_height}
					const obj = new GameObject(transPos(this.width,this.totalHeight, pos),size, {x: 0,y:0}, "resources/textures/block_solid.png", this.scene)
					obj.solid = true
					this.bricks.push(obj)
						obj.spriteRenderer.sprite.name='brick'
				} else if (this.tileData[y][x] > 1) {
						const pos = { x: x * unit_width + unit_width /2, y: y * unit_height + unit_height/2 };
					const size = {x: unit_width, y: unit_height}
					const obj = new GameObject(transPos(this.width,this.totalHeight, pos),size, {x: 0,y:0}, "resources/textures/block.png", this.scene)
					this.bricks.push(obj)
					obj.spriteRenderer.sprite.name='brick'
				}

			}
		}

	}

	isCompleted() {
		for (let tile of this.bricks) {
			if (!tile.solid && !tile.isDestroyed) {
				return false
			}
		}
		return true
	}

	update() {
		for (let tile of this.bricks) {
			if (tile.isDestroyed && !tile.physicallyRemoved) {
				console.log('gamelevle destry')
				tile.destroy()
			}
		}
	}

	destroy() {
		for (let tile of this.bricks) {
			if (!tile.isDestroyed) {
				tile.destroy()
			}
		}
	}

}