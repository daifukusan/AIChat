export class MyAudio{
    constructor(audioElement){
        this.sound = audioElement;
        this.context = undefined;
        this.nodeAnalyser = undefined;
        this.nodeSource = undefined;
        this.frequencies = undefined;
        this.isReady = false;
    }

    initAudioAnalyser(){
        this.context = new AudioContext();
        this.nodeAnalyser = this.context.createAnalyser();
        this.nodeAnalyser.fftSize = 64;
        this.nodeAnalyser.smoothingTimeConstant = 0.85;
        this.nodeAnalyser.connect(this.context.destination);
        this.nodeSource = this.context.createMediaElementSource(this.sound);
        this.nodeSource.connect(this.nodeAnalyser);
        this.frequencies = new Uint8Array(this.nodeAnalyser.frequencyBinCount);
        this.isReady = true;
    }
    getByteFrequencyDataAverage() {
        this.nodeAnalyser.getByteFrequencyData(this.frequencies);
        return this.frequencies.reduce(function (previous, current) {
            return previous + current;
        }) / this.nodeAnalyser.frequencyBinCount;
    }
}