export default class TextRenderer{
	constructor(width, height) {
		this.dom = document.createElement('div');
		this.dom.style.position = 'absolute';
		this.dom.style.left = '50%';
		this.dom.style.top =  '50%';
		this.dom.style.width = width;
		this.dom.style.height = height
		this.dom.style.font = "40px Arial";
		this.dom.style.transition="opacity 1s"
		document.body.appendChild(this.dom)
	}
	hide() {
		this.dom.style.opacity = 0
	}
	show() {
			this.dom.style.opacity = 1
	}
	render(text) {
		if (text === this.text) {
			return
		}
		this.text = text
		this.dom.innerHTML = text
		this.show()
	}
}