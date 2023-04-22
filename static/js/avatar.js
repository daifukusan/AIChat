import * as THREE from 'three';
import {
    OrbitControls
} from 'three/addons/controls/OrbitControls'
import {
    loadVRM
} from 'loadVRM';
import {
    loadMixamoAnimation
} from 'loadMixamoAnimation';

export class Avatar {

    constructor(canvasElement, audio) {
        // canvasの取得
        this.canvas = canvasElement;
        // シーンの生成
        this.scene = new THREE.Scene();
        // カメラの生成
        this.camera = new THREE.PerspectiveCamera(45, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 1000);
        this.camera.position.set(0.0, 1.3, -1);
        this.camera.rotation.set(0, Math.PI, 0);

        // レンダラーの生成
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setClearColor(0x7fbfff, 1.0);
        this.canvas.appendChild(this.renderer.domElement);

        // コントローラの生成
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.screenSpacePanning = true;
        this.controls.target.set(0.0, 1.25, 0.0);
        this.controls.update();

        // ライトの生成
        this.light = new THREE.DirectionalLight(0xffffff);
        this.light.position.set(-1, 1, -1).normalize();
        this.scene.add(this.light);

        //定数の定義
        this.modelUrl = './static/vrm/AliciaSolid.vrm';
        this.animationUrl = './static/fbx/Idle.fbx';
        this.animationUrl2 = './static/fbx/Thinking.fbx';

        //変数の定義
        this.currentVrm = undefined; // 現在使用中のvrm、update内で使えるようにするため
        this.currentMixer = undefined; // 現在使用中のAnimationMixer、update内で使えるようにするため
        this.idleAction = undefined;
        this.chatAction = undefined;
        this.audio = audio;
        this.clock = new THREE.Clock();
        this.clock.start();
    }

    loadModel() {
        loadVRM(this.modelUrl).then((vrm) => { // vrmを読み込む
            this.currentVRM = vrm; // currentGLTFにvrmを代入
            this.scene.add(vrm.scene); // モデルをsceneに追加し、表示できるようにする

            this.currentVRM.expressionManager.setValue('happy', 0.1);
            this.currentVRM.expressionManager.update();

            this.currentMixer = new THREE.AnimationMixer(this.currentVRM.scene); // vrmのAnimationMixerを作る
            this.currentMixer.timeScale = 1;
            this.currentMixer.addEventListener('loop', (event) => {
                if (event.action == this.chatAction) {
                    this.idleAction.crossFadeFrom(this.chatAction, 0.5);
                    this.idleAction.play();
                }
            });
            loadMixamoAnimation(this.animationUrl, this.currentVRM).then((clip) => { // アニメーションを読み込む
                this.idleAction = this.currentMixer.clipAction(clip);
                this.idleAction.play(); // アニメーションをMixerに適用してplay
            });
            loadMixamoAnimation(this.animationUrl2, this.currentVRM).then((clip) => { // アニメーションを読み込む
                this.chatAction = this.currentMixer.clipAction(clip);
            });
        });
    }

    speakAction(){
        this.idleAction.stop();
        this.chatAction.reset().play();
    }

    update = () => {
        requestAnimationFrame(this.update);
        const delta = this.clock.getDelta(); // 前フレームとの差分時間を取得
        const analyser = this.audio.nodeAnalyser;
        const freq = this.audio.frequencies;

        if (this.currentMixer) { // アニメーションが読み込まれていれば
            this.currentMixer.update(delta); // アニメーションをアップデート
        }
        if (this.currentVRM) { // VRMが読み込まれていれば
            if (analyser && freq) {
                const volume = Math.floor(this.audio.getByteFrequencyDataAverage());

                const aa = Math.pow(Math.min(80, volume), 2) / 3200.0;
                const oh = Math.pow(Math.max(40.0 - Math.abs(volume - 40.0), 0), 2) / 1600.0;
                const ih = Math.pow(Math.max(20.0 - Math.abs(volume - 20.0), 0), 2) / 400.0;
                const happy = (aa + oh + ih) / 6.0;

                if (volume < 10) {
                    this.currentVRM.expressionManager.setValue('happy', 0.1);
                    this.currentVRM.expressionManager.setValue('aa', 0.0);
                    this.currentVRM.expressionManager.setValue('oh', 0.0);
                    this.currentVRM.expressionManager.setValue('ih', 0.0);
                } else {
                    this.currentVRM.expressionManager.setValue('happy', happy);
                    this.currentVRM.expressionManager.setValue('aa', aa);
                    this.currentVRM.expressionManager.setValue('oh', oh);
                    this.currentVRM.expressionManager.setValue('ih', ih);
                }
            }
            this.currentVRM.expressionManager.setValue('blink', this.blinkValue());
            this.currentVRM.expressionManager.update();
            this.currentVRM.update(delta); // VRMの各コンポーネントを更新
        }
        this.renderer.render(this.scene, this.camera); // 描画
    };

    blinkValue() {
        return Math.sin((this.clock.elapsedTime * 1) / 3) ** 4096 +
            Math.sin((this.clock.elapsedTime * 4) / 7) ** 4096;
    }

}

