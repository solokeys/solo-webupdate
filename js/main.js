var app = new Vue({
  el: '#app',
  data: {
    platform_description: '',
    webauthn_support: '',
    solo_version_parts: null,
    solo_version: 'unknown',
    stable_version_parts: null,
    stable_version: '',
    is_solo_secure: false,
    is_solo_hacker: false,
    needs_update: false,
    signed_firmware: null,
    update_status: null,
    update_progress: null,
  }
});

async function inspect_browser() {
  app.platform_description = platform.description;
  if (!window.PublicKeyCredential) {
    app.webauthn_support = "Your browser does not support WebAuthn, please use another one";
  } else {
    app.webauthn_support = "Your browser supports WebAuthn";
  }
}

async function check_version(){
  ctaphid_via_webauthn(
    CMD.solo_version
  ).then(response => {
    console.log(response);
    app.solo_version_parts = response.slice(0, 3);
    let solo_version = response[0] + '.' + response[1] + '.' + response[2];
    app.solo_version = solo_version;
  }
  )
  .catch(error => {
    console.log(error);
  });
}

async function fetch_stable_version() {
  let response = await fetch(
    "https://raw.githubusercontent.com/solokeys/solo/master/STABLE_VERSION");
  let stable_version = (await response.text()).trim();
  // let stable_version = stable_version.trim();
  app.stable_version = stable_version;
  app.stable_version_parts = new Uint8Array(stable_version.split(".").map(Number));
}

async function prepare() {
  await inspect_browser();
  await fetch_stable_version();
  await check_version();
}

async function create_direct_attestation() {
    // random nonce
    var challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    // our relying party
    let rp_id = window.location.hostname;

    // GOAL: register a key signed by key's attestation certificate
    let publicKeyCredentialCreationOptions = {
		rp: {
			name: 'SoloKeys Service Station',
			id: rp_id,
		},

		attestation: 'direct',

		challenge,

		pubKeyCredParams: [
			{ type: 'public-key', alg: -7 },
		],

		user: {
			id: new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]),
			name: "little-solo-keys@solokeys.com",
			displayName: "Lil' Solo Keys",
		},

		timeout: -1,
		excludeCredentials: [],
	};

	return navigator.credentials.create({
		publicKey: publicKeyCredentialCreationOptions
	});
};

async function inspect() {
  let credential = await create_direct_attestation();

  let utf8_decoder = new TextDecoder('utf-8');
  let client_data_json = utf8_decoder.decode(credential.response.clientDataJSON);
  let client_data = JSON.parse(client_data_json);
  var attestation = CBOR.decode(credential.response.attestationObject);
  var certificate = attestation.attStmt.x5c[0];
  let certificate_fingerprint = sha256(certificate);
  let what_is_it = known_certs_lookup[certificate_fingerprint];

  if (typeof what_is_it === "undefined") {
    console.log("UNKNOWN ATTESTATION CERTIFIATE");
  } else {
    if (what_is_it == "Solo Secure") {
      app.is_solo_secure = true;
      app.is_solo_hacker = false;
    }
    if (what_is_it == "Solo Hacker") {
      app.is_solo_secure = false;
      app.is_solo_hacker = true;
    }
  };

  // now we know a key is plugged in
  await check_version();

  let need = app.stable_version_parts;
  let have = app.solo_version_parts;
  console.log("NEED", need);
  console.log("HAVE", have);

  if (have == null) {
    app.needs_update = true;
  } else {
    app.needs_update = (need[0] > have[0]) || (need[1] > have[1]) || (need[2] > have[2]);
  }
}

async function fetch_firmware() {
  let proxy_url = 'https://cors-anywhere.herokuapp.com/';
  url_base = "https://github.com/solokeys/solo/releases/download/" + app.stable_version + "/";
  if (app.is_solo_secure) {
    let file_url = proxy_url + url_base + "firmware-secure-" + app.stable_version + ".json";
    console.log(file_url);

    let fetched = await fetch(file_url);
    let content = await fetched.json();

    let firmware = websafe2string(content.firmware);
    var signature = websafe2array(content.signature);

    return {
      firmware: firmware,
      signature: signature,
    }
  }

  if (app.is_solo_hacker) {
    let file_url = proxy_url + url_base + "firmware-hacker-" + app.stable_version + ".hex";
    console.log(file_url);
    let fetched = await fetch(file_url);
    let firmware = await fetched.text();

    return {
      firmware: firmware,
      signature: null,
    }
  }
}

async function update() {
  app.update_status = "DOWNLOADING FIRMWARE";
  let signed_firmware = await fetch_firmware();
  app.signed_firmware = signed_firmware;

  let firmware = signed_firmware.firmware;
  let signature = signed_firmware.signature;

  let num_pages = 64;

  let blocks = MemoryMap.fromHex(firmware);
  let addresses = blocks.keys();

  let addr = addresses.next();
  let chunk_size = 240;
  console.log("WRITING...");
  app.update_status = "FLASHING FIRMWARE";

  while(!addr.done) {
      var data = blocks.get(addr.value);
      var i;
      for (i = 0; i < data.length; i += chunk_size) {
          var chunk = data.slice(i,i+chunk_size);

          p = await ctaphid_via_webauthn(
              CMD.boot_write,
              addr.value + i,
              chunk
          );
          TEST(p.status != 'CTAP1_SUCCESS', 'Device wrote data');

          var progress = (((i/data.length) * 100 * 100) | 0)/100;
          console.log("PROGRESS:", progress);
          app.update_progress = "Progress: " + progress + "%";
      }

      addr = addresses.next();
  }
  app.update_progress = "Progress: 100%";
  console.log("...DONE");

  app.update_status = "VERIFYING FIRMWARE SIGNATURE";
  p = await ctaphid_via_webauthn(
    CMD.boot_done, 0x8000, signature
  );
  app.update_status = "UPDATE SUCCESSFUL \\o/";

  app.signed_firmware = null;
  await check_version();
}
