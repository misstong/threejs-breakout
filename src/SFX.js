import { AudioListener, Audio, PositionalAudio, AudioLoader } from 'three';

class SFX{
    constructor(camera, assetsPath, listener){
        if (listener==null){
            this.listener = new AudioListener();
            camera.add( this.listener );
        }else{
            this.listener = listener;
        }

        this.assetsPath = assetsPath;

        this.sounds = {};
    }

    load(name,key, loop=false, vol=0.5, obj=null,autoStart=false){
        // create a global audio source
        const sound = (obj==null) ? new Audio( this.listener ) : new PositionalAudio( this.listener );
        key = key || name
        this.sounds[key] = sound;

        // load a sound and set it as the Audio object's buffer
        const audioLoader = new AudioLoader().setPath(this.assetsPath);
        audioLoader.load( name, buffer => {
            sound.setBuffer( buffer );
            sound.setLoop( loop );
            sound.setVolume( vol );
            if (autoStart) {
                sound.play()
                console.log('play ',name)
            }
        });

        if (obj!==null) obj.add(sound);
    }

    setVolume(name, volume){
        const sound = this.sounds[name];

        if (sound !== undefined) sound.setVolume(volume);
    }

    setLoop(name, loop){
        const sound = this.sounds[name];

        if (sound !== undefined) sound.setLoop(loop);
    }

    play(name){
        const sound = this.sounds[name];

        if (sound !== undefined && !sound.isPlaying) sound.play();
    }

    stop(name){
        const sound = this.sounds[name];

        if (sound !== undefined && sound.isPlaying) sound.stop();
    }

    stopAll(){
        for(let name in this.sounds) this.stop(name);
    }

    pause(name){
        const sound = this.sounds[name];

        if (sound !== undefined) sound.pause();
    }
}

export { SFX };