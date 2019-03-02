#!/bin/bash -xe

openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes -keyout localhost.key -out localhost.crt \
    -subj /CN=localhost \
    -addext subjectAltName=DNS:localhost,IP:127.0.0.1
