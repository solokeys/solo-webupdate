async function ctaphid_via_webauthn(cmd, addr, data, timeout) {
  // if a token does not support CTAP2, WebAuthn re-encodes as CTAP1/U2F:
  // https://fidoalliance.org/specs/fido-v2.0-rd-20170927/fido-client-to-authenticator-protocol-v2.0-rd-20170927.html#interoperating-with-ctap1-u2f-authenticators
  //
  // the bootloader only supports CTAP1, so the idea is to drop
  // u2f-api.js and the Firefox about:config fiddling
  //
  // problem: the popup to press button flashes up briefly :(
  //

  var keyhandle = encode_ctaphid_request_as_keyhandle(cmd, addr, data);
  var challenge = window.crypto.getRandomValues(new Uint8Array(32));

  var request_options = {
      challenge: challenge,
      allowCredentials: [{
          id: keyhandle,
          type: 'public-key',
      }],
      timeout: timeout,
      userVerification: 'discouraged',
  }

  return navigator.credentials.get({
    publicKey: request_options
  }).then(assertion => {
    console.log("GOT ASSERTION", assertion);
    console.log("RESPONSE", assertion.response);
    let response = decode_ctaphid_response_from_signature(assertion.response);
    console.log("RESPONSE:", response);
    return response.data;
  }).catch(error => {
    console.log("ERROR CALLING:", cmd, addr, data);
    console.log("THE ERROR:", error);
    return Promise.resolve();  // error;
  });
}


// The idea is to encode CTAPHID_VENDOR commands
// in the keyhandle, that is sent via WebAuthn or U2F
// as signature request to the authenticator.
//
// The authenticator reacts to signature requests with
// the four "magic" bytes set with a special signature,
// which can then be decoded

function encode_ctaphid_request_as_keyhandle(cmd, addr, data) {
    console.log('REQUEST CMD', cmd, '(', command_codes[cmd], ')');
    console.log('REQUEST ADDR', addr);
    console.log('REQUEST DATA', data);

    // should we check that `data` is either null or an Uint8Array?
    data = data || new Uint8Array();

    const offset = 10;

    if (offset + data.length > 255) {
        throw new Error("Max size exceeded");
    }

    // on Solo side, `is_extension_request` expects at least 16 bytes of data
    const data_pad = data.length < 16 ? 16 - data.length : 0;
    var array = new Uint8Array(offset + data.length + data_pad);

    array[0] = cmd & 0xff;

    array[1] = (addr >> 0) & 0xff;
    array[2] = (addr >> 8) & 0xff;
    array[3] = (addr >> 16) & 0xff;

    // magic values, telling bootloader U2F interface
    // to interpret `data` as encoded U2F APDU command,
    // when passed as keyhandle in u2f.sign.
    // yes, there can theoretically be clashes :)
    array[4] = 0x8C;  // 140
    array[5] = 0x27;  //  39
    array[6] = 0x90;  // 144
    array[7] = 0xf6;  // 246

    array[8] = 0;
    array[9] = data.length & 0xff;

    array.set(data, offset);

    console.log('FORMATTED REQUEST:', array);
    return array;
}

function decode_ctaphid_response_from_signature(response) {
    // https://fidoalliance.org/specs/fido-v2.0-rd-20170927/fido-client-to-authenticator-protocol-v2.0-rd-20170927.html#using-the-ctap2-authenticatorgetassertion-command-with-ctap1-u2f-authenticators<Paste>
    //
    // compared to `parse_device_response`, the data is encoded a little differently here
    //
    // attestation.response.authenticatorData
    //
    // first 32 bytes: SHA-256 hash of the rp.id
    // 1 byte: zeroth bit = user presence set in U2F response (always 1)
    // last 4 bytes: signature counter (32 bit big-endian)
    //
    // attestation.response.signature
    // signature data (bytes 5-end of U2F response

    signature_count = (
        new DataView(
            response.authenticatorData.slice(33, 37)
        )
    ).getUint32(0, false); // get count as 32 bit BE integer

    signature = new Uint8Array(response.signature);
    data = null;
    error_code = signature[0];
    if (error_code == 0) {
        data = signature.slice(1, signature.length);

    }
    return {
        count: signature_count,
        status: ctap_error_codes[error_code],
        data: data,
        signature: signature,
    };
}
