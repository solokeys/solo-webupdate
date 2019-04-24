[![Netlify Status](https://api.netlify.com/api/v1/badges/cf747fa0-e4d2-4405-897c-47cc3affba8e/deploy-status)](https://app.netlify.com/sites/solokeys-webupdate/deploys)

# solo-webupdate

## What is this?
While advanced users capable of using the command line can test if their keys are genuine, and update them via
<https://github.com/solokeys/solo-python>, this project lets you do the same more easily
using any WebAuthn-capable web browser (all current versions of Chrome, Firefox, Edge, Opera, Vivaldi, ...).

To use it, visit <https://update.solokeys.com> and follow the instructions.

## What does it do?
In a first step, it inspects your key to determine whether you have a Solo Secure or a Solo Hacker.

During this process, the signature of the key is checked, letting you determine whether your key is genuine.

Once this is done, it tells you whether the firmware is out of date.
If so, we recommend you update, to receive bug fixes and possibly additional functionality.

To do so, you need to unplug your key, and plug it in an while keeping its button pressed, until the LED light blinks.

Once this is done, your key is in "bootloader mode" and can be updated by the website.

You can simply click on "Update Firmware", and your key will be updated.

**NOTE:** Due to how this update is implemented, while your firmware is being updated you will see a LOT of popups (that disappear again immediately). This is no reason for concern!

## How does it work?
For general information on WebAuthn, the new standard for secure login in the browser, we recommend the following sites:
- https://webauthn.io
- https://webauthn.guide
- https://www.w3.org/TR/webauthn/

This standard replaces its predecessor, U2F, and consists of two API methods:
- `navigator.credentials.create()`
- `navigator.credentials.get()`

We use the first method to verify that your Solo is genuine, and determine whether it is the secure or the hacker version.

We use the second method to update your key if necessary. The method used is to encode custom commands that your key understands, and [send these encoded commands as "keyhandle"](https://github.com/solokeys/solo-webupdate/blob/master/js/ctaphid.js).

## Hosting & Verification
The site <https://update.solokeys.com> is hosted on Netlify, as configured via [netlify.toml](netlify.toml).

If you prefer to run a local version (advanced users only):
```
make setup-local
make serve-local
```
then visit <http://localhost:8080>

One technical detail: Our official firmware builds are hosted as releases under <https://github.com/solokeys/solo/releases>, with the file [STABLE_VERSION](https://github.com/solokeys/solo/blob/master/STABLE_VERSION) specifying the latest stable version. Unfortunately, due to [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) restrictions, these files can't be fetched by your browser during the update process. For this reason, the current latest builds are [fetched and hosted](https://github.com/solokeys/solo-webupdate/blob/master/scripts/fetch-firmware.sh) on the update site itself, which always checks whether its firmware is out of date.
