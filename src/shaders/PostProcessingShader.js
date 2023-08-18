export const PostProcessingShader = {
	uniforms: {
		chaos: { type: 'b', value: 0 },
		confuse: { type: 'b', value: 0 },
		shake: { type: 'b', value: 0 },
		tDiffuse: { type: "t", value: null },
		time: { type: 'f', value: 0 },
		
	},
	vertexShader: `
			varying vec2 vUv;

			uniform bool chaos;
			uniform bool confuse;
			uniform bool shake;
			uniform float time;

			void main() {
				
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				if(chaos){
					float strength = 0.3;
					vec2 pos = vec2(uv.x+sin(time) * strength, uv.y + cos(time) * strength);
					vUv = pos;

				} else if(confuse) {
					vUv = vec2(1.0 - uv.x, 1.0 -uv.y);
				} else {
					vUv = uv;
				}
				if (shake) {
					float strength = 0.01;
        	gl_Position.x += cos(time * 10.0) * strength;        
        	gl_Position.y += cos(time * 15.0) * strength; 
				}
			}
	`,
	fragmentShader: `
		uniform sampler2D tDiffuse;
		varying vec2 vUv;
		void main() {
			gl_FragColor = texture2D( tDiffuse, vUv);
		}

	`

}