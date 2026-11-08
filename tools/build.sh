#!/bin/sh
# Baixa as fontes de palavras (só na primeira vez) e regenera data/levels.json
set -e
cd "$(dirname "$0")/.."
mkdir -p .cache
if [ ! -f .cache/package/index.dic ]; then
  (cd .cache && npm pack dictionary-pt@4.0.0 --silent && tar xzf dictionary-pt-4.0.0.tgz)
fi
if [ ! -f .cache/pt_br_50k.txt ]; then
  curl -sSL -o .cache/pt_br_50k.txt https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/pt_br/pt_br_50k.txt
fi
if [ ! -f .cache/en_50k.txt ]; then
  curl -sSL -o .cache/en_50k.txt https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt
fi
node tools/build-levels.mjs .cache/package .cache/pt_br_50k.txt .cache/en_50k.txt
