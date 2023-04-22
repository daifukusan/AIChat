import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';

/**
 * VRMを読み込む
 * @param {string} modelUrl モデルファイルのURL
 * @returns {Promise<VRM>} VRM
 */
export function loadVRM( modelUrl ) { // モデルを読み込む処理
    const loader = new GLTFLoader(); // GLTFを読み込むLoader
    
    loader.register( ( parser ) => new VRMLoaderPlugin( parser ) ); // GLTFLoaderにVRMLoaderPluginをインストール
    
    return loader.loadAsync( modelUrl ).then( ( gltf ) => {
      const vrm = gltf.userData.vrm; // VRMを制御するためのクラス `VRM` が `gltf.userData.vrm` に入っています
      //VRMUtils.rotateVRM0( vrm ); // 読み込んだモデルがVRM0.0の場合は回す
      return vrm;
    });
}