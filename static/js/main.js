import{
    MyAudio
} from 'audio';
import {
    Avatar
} from 'avatar';

const audio = new MyAudio(document.getElementById("audio"));
const avatar = new Avatar(document.getElementById('canvas'), audio);
avatar.loadModel();
avatar.update();

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
const csrftoken = getCookie('csrftoken');

//会話を配列に保存する
let items = []
// 音声入力で得た文字列を保持する変数
let inputText;

// 時間の表示
function getAt() {
    const d = new Date();
    return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

// 会話の配列をもとに、チャットのバルーンを生成する関数
function updateChat() {
    const chat = document.getElementById('chat');
    let h = '';
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        h += `<li class="box${item.kind==='me'?' right':''}"><div class="balloon ${item.kind}">${item.text}</div><div class="time">${item.at}</div></li>`;
    }
    chat.innerHTML = h
}

const SpeechRecognition = webkitSpeechRecognition || window.SpeechRecognition;
const recognition = new SpeechRecognition();

// ユーザの音声を受け取りを開始する関数
async function speak() {

    recognition.onresult = (event) => {
        inputText = event.results[0][0].transcript;
        items.push({
            kind: 'me',
            at: getAt(),
            text: inputText,
        });
        updateChat();
    }
    await recognition.start();
}

document.getElementById("mic").addEventListener('click', (event) => {
    speak();
});

document.getElementById("talk").addEventListener('click', (event) => {
    inputText = document.getElementById("text").value;
    items.push({
        kind: 'me',
        at: getAt(),
        text: inputText,
    });
    updateChat();
    document.getElementById("text").value = "";
    requestSpeakResponse();
});

recognition.addEventListener('end', async (event) => {
    requestSpeakResponse();
});

function requestSpeakResponse(){
    const body = new URLSearchParams();
    body.append('input_text', inputText);

    fetch('./ajax_chat/', {
        method: 'POST',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            'X-CSRFToken': csrftoken
        },
        body: body
    }).then((response) => {
        return response.json();
    }).then((response) => {
        items.push({
            kind: 'you',
            at: getAt(),
            text: response.text,
        })
        updateChat();
        avatar.speakAction();
        //idleAction.stop();
        //chatAction.reset().play();
        audio.sound.setAttribute('src', response.audio);
        audio.sound.loop = false;
        audio.sound.play();
        if (!audio.isReady) {
            audio.initAudioAnalyser();
        }

    }).catch((err) => {
        console.log(err);
    });
}