serve-local: venv
	scripts/reloading-serve.sh venv/bin/python3 serve-local.py

setup-local: venv get-bulma get-sass fetch-firmware
setup-local-full: setup-local get-bulma get-sass styles

# Only needed to experiment with U2F
# WebAuthn accepts http://localhost as secure origin
localhost-cert:
	scripts/make-localhost-cert.sh

fetch-firmware:
	scripts/fetch-firmware.sh

venv:
	python3 -m venv venv
	venv/bin/pip3 install -U pip

styles:
	tools/dart-sass/sass -s compressed sass/styles.scss css/styles.css

BULMA_VERSION = "0.7.4"
get-bulma:
	mkdir -p tools
	rm -rf tools/bulma
	wget https://github.com/jgthms/bulma/releases/download/$(BULMA_VERSION)/bulma-$(BULMA_VERSION).zip
	unzip -d tools bulma-$(BULMA_VERSION).zip
	rm -rf bulma-$(BULMA_VERSION).zip
	rm -rf tools/__MACOSX
	mv tools/bulma-$(BULMA_VERSION) tools/bulma

DART_SASS_VERSION = "1.16.1"
get-sass:
	mkdir -p tools
	rm -rf tools/dart-sass
	wget https://github.com/sass/dart-sass/releases/download/$(DART_SASS_VERSION)/dart-sass-$(DART_SASS_VERSION)-linux-x64.tar.gz
	tar -C tools -xf dart-sass-$(DART_SASS_VERSION)-linux-x64.tar.gz
	rm -rf dart-sass-$(DART_SASS_VERSION)-linux-x64.tar.gz

