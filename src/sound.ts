import { Howl } from 'howler';

export function sound(soundObject, volumeLevel=1.0) {
    var sound = new Howl({
        src: [soundObject],
        volume: volumeLevel,
    });
    sound.play();
}
