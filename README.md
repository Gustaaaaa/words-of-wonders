# 🌸 Word Bloom

Um jogo de palavras cruzadas relaxante para iPhone e celulares, em **português do Brasil**.
Deslize o dedo pelas letras da roda, forme palavras e preencha a grade, com sons suaves,
música ambiente gerada na hora e cenários que mudam a cada capítulo.

Feito como **PWA**: abre no Safari, vira app na tela de início, funciona offline e não precisa de App Store.

## Recursos

- **600 níveis** em 25 capítulos (Amanhecer, Bambuzal, Lago Sereno, Céu Estrelado…), com dificuldade que cresce de 4 para 7 letras
- **Combo por velocidade**: acerte uma palavra atrás da outra em até 7 s e as moedas multiplicam: x2, x3… até x5
- **Palavras bônus**: palavras válidas fora da grade vão para o **pote**; a cada 10, ganhe 25 moedas
- **Dicas**: 💡 Luz (1 letra, 25), 🎯 Alvo (você escolhe a casa, 45), 🌬️ Vento (5 letras, 80); embaralhar é grátis
- **Desafio do dia** com **sequência de dias** (🍃) e bônus crescente por sequência
- **Sons e vibração**: sininhos em escala pentatônica, acordes e trilha ambiente feitos com Web Audio; vibração no Android e háptico no iPhone (iOS 18+)
- Progresso salvo no aparelho, inclusive no meio de um nível
- Acentos não contam (PÃO → PAO), como nos jogos do gênero

## Instalar no iPhone

1. Abra o link do jogo no **Safari**
2. Toque em **Compartilhar** → **Adicionar à Tela de Início**
3. Abra pelo ícone 🌸: tela cheia, sem barra do navegador, e funciona offline

> Dica: os sons respeitam a chave de silencioso do iPhone.

## Rodar localmente

```sh
npm start           # serve em http://localhost:8080
```

Para testar no celular na mesma rede Wi-Fi, abra `http://IP-DO-COMPUTADOR:8080`.

## Publicar (GitHub Pages)

O workflow `.github/workflows/pages.yml` publica o site a cada push na `main`.
Na primeira vez, ative em **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Gerar os níveis de novo

```sh
npm run levels
```

O gerador (`tools/build-levels.mjs`):

1. expande o dicionário Hunspell **VERO pt-BR** (~336 mil formas válidas de 3 a 8 letras) para validar palavras e encontrar os bônus
2. usa uma **lista de frequência** pt-BR para escolher só palavras comuns na grade
3. filtra nomes próprios, estrangeirismos e palavrões
4. monta as palavras cruzadas com um algoritmo guloso que procura grades compactas e com cara de celular

## Estrutura

```
index.html            telas e marcação
css/style.css         visual zen (vidro fosco, gradientes, animações)
js/app.js             regras do jogo, telas, combo, dicas, desafio diário
js/wheel.js           roda de letras (gesto de arrastar)
js/grid.js            grade de palavras cruzadas
js/audio.js           sons e música generativa (Web Audio)
js/haptics.js         vibração
js/themes.js          capítulos e paletas
data/levels.json      níveis gerados
sw.js                 cache offline
tools/                gerador de níveis e de ícones
```

## Créditos

- Dicionário: [VERO](https://pt-br.libreoffice.org/projetos/vero/) via [`dictionary-pt`](https://github.com/wooorm/dictionaries) (LGPL-3.0 / MPL-1.1)
- Frequência de palavras: [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords) (CC BY-SA 4.0), baseado em OpenSubtitles
