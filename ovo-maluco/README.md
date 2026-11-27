# Ovo Maluco

Jogo de letras e sons para crianças de 4 anos: a narradora pede uma letra ("Cadê a letra Bê?") ou o som inicial de uma palavra ("Com que letra começa *bola*?"). Cada 5 acertos chocam um ovo e nasce uma criatura maluca para o Zoológico.

- Começa pelas vogais e libera 2 letras novas quando a criança vai bem; repete mais as letras que ela erra.
- Área dos pais (engrenagem, pergunta de multiplicação): modo de letras, adicionar criaturas com imagens do próprio aparelho, apagar progresso.
- Criaturas em 3D: modeladas em `tools/modelos.js` (Three.js) e renderizadas em `img/criaturas/` com `npm install && npm run render3d` (requer Playwright).
- Falas: `python ../scripts/gen-audio.py` dentro desta pasta (Fish Audio; veja o script).

**Uso privado.** As 10 primeiras criaturas (Tung Tung Tung Sahur, Tralalero Tralala etc.) são fan art de memes de terceiros, feitas só para a família. Antes de publicar ou vender, remova-as (`privado: true` em `index.html` e `tools/modelos.js`) e apague as imagens correspondentes.
