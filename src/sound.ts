import { Howl } from 'howler';

// TODO: rewrite this
export function sound(soundObject, volumeLevel=1.0) {
    const sound = new Howl({src: [soundObject], volume: volumeLevel,});
    sound.play();
}
