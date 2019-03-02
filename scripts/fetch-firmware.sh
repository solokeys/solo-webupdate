#!/bin/bash -xe

rm -f data/*

wget -P data/ https://raw.githubusercontent.com/solokeys/solo/master/STABLE_VERSION
STABLE_VERSION="$(curl -s https://raw.githubusercontent.com/solokeys/solo/master/STABLE_VERSION)"
echo ${STABLE_VERSION}

wget -P data/ https://github.com/solokeys/solo/releases/download/${STABLE_VERSION}/firmware-secure-${STABLE_VERSION}.json
wget -P data/ https://github.com/solokeys/solo/releases/download/${STABLE_VERSION}/firmware-secure-${STABLE_VERSION}.sha2
wget -P data/ https://github.com/solokeys/solo/releases/download/${STABLE_VERSION}/firmware-hacker-${STABLE_VERSION}.hex
wget -P data/ https://github.com/solokeys/solo/releases/download/${STABLE_VERSION}/firmware-hacker-${STABLE_VERSION}.sha2
cd data/
# TODO (possibly in main.js): Check sha2 on firmware embedded in the signed .json
# sha256sum -c firmware-secure-${STABLE_VERSION}.sha2
sha256sum -c firmware-hacker-${STABLE_VERSION}.sha2
cd ..
