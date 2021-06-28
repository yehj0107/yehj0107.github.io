	
mergeInto(LibraryManager.library, {
  ctap_apdu_exchange: function(data, size, timeout) {
	return Asyncify.handleSleep(wakeUp => {
	var challenge = window.crypto.getRandomValues(new Uint8Array(32));
	var keyhandle = new Uint8Array(191);
	keyhandle.fill(0xff);
	
	var apdu = new Uint8Array(Module.HEAPU8.buffer, data, size);
	//var apduhex = [...new Uint8Array(apdu)].map(x => x.toString(16).padStart(2, '0')).join('');
	//console.log(apduhex);
	
	var c = new Uint8Array(2);
	c[0] = 0x90;
	c[1] = 0x00;

	
	// package APDU into keyhandle
	// magic number: KXAPDU
	var pkg_keyhandle = new Uint8Array(size + 6);
	pkg_keyhandle[0] = 0x4B;
	pkg_keyhandle[1] = 0x58;
	pkg_keyhandle[2] = 0x41;
	pkg_keyhandle[3] = 0x50;
	pkg_keyhandle[4] = 0x44;
	pkg_keyhandle[5] = 0x55;
	pkg_keyhandle.set(apdu, 6);
	
	//Module.HEAPU8.set(c, data);
	//wakeUp(2);

	var request_options = {
      challenge: challenge,
      allowCredentials: [{
          id: pkg_keyhandle,
          type: 'public-key',
      }],
      timeout: 60000,
      userVerification: 'discouraged',
	}
	
	navigator.credentials.get({publicKey: request_options}).then(assertion => {
	var signature = new Uint8Array(assertion.response.signature);
	Module.HEAPU8.set(signature, data);
	//console.log(signature);
	wakeUp(signature.length);
	}).catch(error => {
		console.log("THE ERROR:", error);
		Module.HEAPU8.set(c, data);
		wakeUp(-1);
		});

	});
  },
});

