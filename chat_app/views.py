from django.views.generic import View
from django.shortcuts import render
from django.http import JsonResponse
import requests, json, base64, openai

class IndexView(View):
    def get(self, request, *args, **kwargs):
        return render(request, 'chat_app/index.html')

class ChatView(View):
    def post(self, request, *args, **kwargs):
        input_text = request.POST.get('input_text')

        if input_text == 'undefined':
            input_text = 'すみません。もう一度お願いします。'

        res_text = input_text
        openai.api_key = "YOUR API KEY"
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "80文字以下の日本語で会話してください。"},
                {"role": "user", "content": input_text}
            ]   
        )
        res_text = response['choices'][0]['message']['content']
        print(input_text, res_text)

        res1 = requests.post('http://voicevox:50021/audio_query',params = {'text': res_text, 'speaker': 1})
        res2 = requests.post('http://voicevox:50021/synthesis',params = {'speaker': 1},data=json.dumps(res1.json()))

        enc = base64.b64encode(res2.content)
            
        d = {'text': res_text,
            'audio': 'data:audio/wav;base64,' + enc.decode()}
        return JsonResponse(d)
