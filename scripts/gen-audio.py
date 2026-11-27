"""Gera as falas do jogo (pasta audio/) com a API de texto para fala da Fish Audio.

Lê as frases do bloco LINES do index.html. Só gera os arquivos que ainda não existem.
Uso:  set FISH_API_KEY=sua_chave   (Windows)   |   export FISH_API_KEY=sua_chave
      python scripts/gen-audio.py
Para trocar de voz, mude NARRADORA e GALINHAS (IDs de modelos da Fish Audio com licença comercial).
"""
import concurrent.futures as cf
import json
import os
import urllib.request

NARRADORA = '45fefd5aed4d439eaa104af6e04497fc'
GALINHAS = '060032e437814fee8e3406297bd129dd'  # no jogo, fica acelerada e aguda

src = open('index.html', encoding='utf-8').read()
lines = json.loads(src.split('/*LINES-START*/')[1].split('/*LINES-END*/')[0])
key = os.environ.get('FISH_API_KEY', '')
os.makedirs('audio', exist_ok=True)


def gerar(item):
    nome, texto = item
    destino = f'audio/{nome}.mp3'
    if os.path.exists(destino) and os.path.getsize(destino) > 1000:
        return nome, 'já existe'
    corpo = json.dumps({'text': texto, 'reference_id': GALINHAS if nome.startswith('c') else NARRADORA,
                        'format': 'mp3', 'mp3_bitrate': 64}).encode()
    cab = {'Content-Type': 'application/json', 'model': 's1'}
    if key:
        cab['Authorization'] = 'Bearer ' + key
    erro = ''
    for _ in range(3):
        try:
            req = urllib.request.Request('https://api.fish.audio/v1/tts', data=corpo, headers=cab)
            dados = urllib.request.urlopen(req, timeout=90).read()
            if len(dados) > 1000:
                open(destino, 'wb').write(dados)
                return nome, f'{len(dados)} bytes'
        except Exception as e:  # rede, limite de uso, chave inválida
            erro = str(e)
    return nome, 'FALHOU ' + erro


with cf.ThreadPoolExecutor(4) as ex:
    for nome, res in ex.map(gerar, lines.items()):
        print(nome, res)
