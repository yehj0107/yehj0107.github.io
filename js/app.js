var app = new Vue({
  el: '#app',
  data: {
    platform_description: '',
    webauthn_support: '',
    is_linux: null,
  }
});

async function prepare() {
  const browser_property = await inspect_browser();
  console.log(browser_property);
  app.platform_description = browser_property.platform_description;
  if(browser_property.web_auth_support){
	  app.webauthn_support = "Your browser supports WebAuthn";
  }
  else{
	  app.webauthn_support = "Your browser does not support WebAuthn, please use another one";
  }
  app.is_linux = browser_property.is_linux;
  await new Promise(r => setTimeout(r, 1000));
  smartcardhsm_init();
  wasm_test();
  var api_version = await get_api_version();
  console.log(api_version);
}

function appendMessage(text) {
  document.getElementById('response').innerHTML += "<p>" + text + "</p>";
}

function clearMessage() {
	document.getElementById('response').innerHTML = "";
}

async function initializae(){
	var config = get_initialize_device_default_config();
	console.log(config)
	var resp = await initialize_device(config);
	var resp = await change_so_pin(config.original_so_pin, config.new_so_pin);
	appendMessage(array2hex(resp.resp));
}

async function select_applet(){
	var resp = await select_hsm_applet();
	console.log(resp);
	appendMessage(array2hex(resp.resp));
}

async function enumerate_object(){
	var resp = await enumerate_objects();
	appendMessage(array2hex(resp.resp));
}

async function select_object_app(){
	var fid = document.getElementById("fid").value;
	if (fid == ""){
		fid = document.getElementById("fid").placeholder;
	}
	let fid_number = parseInt(fid, 16);
	var resp = await select_object(fid_number);
	appendMessage(array2hex(resp.resp));
}

async function delete_object_app(){
	var fid = document.getElementById("fid").value;
	if (fid == ""){
		fid = document.getElementById("fid").placeholder;
	}
	let fid_number = parseInt(fid, 16);
	var resp = await delete_object(fid_number);
	appendMessage(array2hex(resp.resp));
}

async function create_object_app(){
	var fid = document.getElementById("fid").value;
	if (fid == ""){
		fid = document.getElementById("fid").placeholder;
	}
	let fid_number = parseInt(fid, 16);
	var resp = await create_object(fid_number);
	appendMessage(array2hex(resp.resp));
}

async function check_dkek(){
	var resp = await query_dkek_status();
	appendMessage(array2hex(resp.resp));
}

async function import_dkek(){
	var resp = await import_dkek_share(""); // use empty string for default DKEK
	appendMessage(array2hex(resp.resp));
}

async function random_gen(){
	var resp = await generate_random_number(4);
	appendMessage(array2hex(resp.resp));
}

async function login(){
	var pin = document.getElementById("pin").value;
	var resp = await login_user_pin(pin);
	appendMessage(array2hex(resp.resp));
}

async function login_status(){
	var resp = await query_login_status();
	appendMessage(array2hex(resp.resp));
}

async function sopin_status(){
	var resp = await query_so_pin_status();
	appendMessage(array2hex(resp.resp));
}

async function reset_pin_try_count(){
	var sopin = document.getElementById("pin").value;
	var resp = await reset_user_pin_try_count(sopin);
	appendMessage(array2hex(resp.resp));
}

async function change_pin(){
	var old_pin = document.getElementById("oldpin").value;
	var new_pin = document.getElementById("newpin").value;
	var resp = await change_user_pin(old_pin, new_pin);
	appendMessage(array2hex(resp.resp));
}

async function change_pin_so(){
	var old_pin = document.getElementById("oldpin").value;
	var new_pin = document.getElementById("newpin").value;
	var resp = await change_so_pin(old_pin, new_pin);
	appendMessage(array2hex(resp.resp));
}

async function change_pin_by_so(){
	var so_pin = document.getElementById("oldpin").value;
	var new_pin = document.getElementById("newpin").value;
	var resp = await change_user_pin_by_so_pin(so_pin, new_pin);
	appendMessage(array2hex(resp.resp));
}

async function gen_key_rsa(){
	// to generate a key, the key, private_key_info and ee_certificate info need to be generated.
	var fid = document.getElementById("keyID").value;
	let fid_number = parseInt(fid, 10);
	var resp = await generae_rsa_key_pair(fid_number, HSM_RSA_KEY_SIZE.hsm_rsa_key_2048);
	if(resp.sw == HSM_STATUS_WORD.success){
		resp = await update_binary(HSM_FILE_ID_PREFIX.ee_certificate + fid_number, 0, resp.data);
		resp = await generate_rsa_private_key_info(fid_number, HSM_RSA_KEY_SIZE.hsm_rsa_key_2048, "testRSA", "31bf64fe-3a95-cc1c-278d-d835c90eabe6");
		resp = await update_binary(HSM_FILE_ID_PREFIX.private_key_info + fid_number, 0, resp.data);
	}
	appendMessage(array2hex(resp.resp));
}

async function gen_key_ecc(){
	// to generate a key, the key, private_key_info and ee_certificate info need to be generated.
	var fid = document.getElementById("keyID").value;
	let fid_number = parseInt(fid, 10);
	var resp = await generae_ec_key_pair(fid_number, HSM_EC_KEY_CURVE.hsm_ec_secp256r1);
	if(resp.sw == HSM_STATUS_WORD.success){
		resp = await update_binary(HSM_FILE_ID_PREFIX.ee_certificate, 0, resp.data);
		resp = await generate_ecc_private_key_info(fid_number, HSM_EC_KEY_CURVE.hsm_ec_secp256r1, "testECC2", "31bf64fe-3a95-cc1c-278d-d835c90eabe6");
		resp = await update_binary(HSM_FILE_ID_PREFIX.private_key_info + fid_number, 0, resp.data);
	}
	appendMessage(array2hex(resp.resp));
}

async function find_empty_key_id(){
	var dat_obj_list = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
	var resp = await enumerate_objects();
	for (i = 0; i < resp.data.length; i += 2){
		var type = resp.data[i];
		var id = resp.data[i + 1];
		if(type == 0xCC || type == 0xC4 || type == 0xCE){
			const index = dat_obj_list.indexOf(id);
			if (index > -1) {
				dat_obj_list.splice(index, 1);
			}
		}
	}
	console.log(dat_obj_list[0]);
}

async function delete_key(){
	// to delete a key, the key, private_key_info and ee_certificate info need to be deleted.
	var fid = document.getElementById("keyID").value;
	let fid_number = parseInt(fid, 10);
	var resp = await delete_object(HSM_FILE_ID_PREFIX.private_key + fid_number);
	resp = await delete_object(HSM_FILE_ID_PREFIX.private_key_info + fid_number);
	resp = await delete_object(HSM_FILE_ID_PREFIX.ee_certificate + fid_number);
	appendMessage(array2hex(resp.resp));
}

async function rsa_sign(){
	// just an example.
	var fid = document.getElementById("keyID").value;
	let fid_number = parseInt(fid, 10);
	var data = new Uint8Array([0x74 ,0xc4 ,0xa9 ,0xf1 ,0x12 ,0x6f ,0x52 ,0xca ,0xaf ,0x06 ,0xf2 ,0x56 ,0x8f ,0xc9 ,0x45 ,0xbb ,0x4e ,0x1c ,0x6a ,0xe7 ,0xbd ,0xf0 ,0x9b ,0xfd ,0x94 ,0xac ,0xc5 ,0xcf ,0x31 ,0x19 ,0x1a ,0x70 ,0x23 ,0x07 ,0xc6 ,0x1e ,0x00 ,0x55 ,0x81 ,0x77 ,0xa0 ,0xf1 ,0x1a ,0xb0 ,0x73 ,0x61 ,0x08 ,0xdd ,0x0e ,0x76 ,0x14 ,0xea ,0x70 ,0x8c ,0x26 ,0xfb ,0xdf ,0x4e ,0xc1 ,0x9f ,0x24 ,0xfb ,0x95 ,0xb9 ,0x19 ,0x80 ,0x59 ,0x50 ,0x2c ,0x3c ,0x1b ,0xd4 ,0x8e ,0xac ,0x05 ,0x46 ,0xd0 ,0xbb ,0x79 ,0xb1 ,0xca ,0xc6 ,0x58 ,0x33 ,0xca ,0xff ,0xd6 ,0x9f ,0xe8 ,0x01 ,0x08 ,0x37 ,0xab ,0x77 ,0x0d ,0x3b ,0xa6 ,0x14 ,0x45 ,0xcd ,0xfd ,0xcd ,0xfa ,0x4a ,0x16 ,0x97 ,0x92 ,0x05 ,0xe6 ,0x52 ,0xd4 ,0x70 ,0xf3 ,0x64 ,0xa5 ,0x73 ,0x06 ,0xd4 ,0x1b ,0x76 ,0xc1 ,0xe9 ,0x95 ,0x68 ,0xb6 ,0xcc ,0x11 ,0x1f ,0x5e ,0xc9 ,0x80 ,0x44 ,0x0e ,0xda ,0x45 ,0x1f ,0x7b ,0x43 ,0xeb ,0x28 ,0xc7 ,0x4c ,0xde ,0xe0 ,0x3b ,0x5f ,0xf0 ,0xf8 ,0xda ,0x93 ,0x4c ,0x88 ,0xc4 ,0x3e ,0x28 ,0x68 ,0x90 ,0xea ,0x3c ,0xbe ,0xdd ,0x04 ,0x8d ,0xbe ,0xc9 ,0xe6 ,0xe6 ,0xf7 ,0xfd ,0xa2 ,0x78 ,0x30 ,0x0f ,0x25 ,0x15 ,0x6e ,0xe6 ,0xb7 ,0x3b ,0x1a ,0x7a ,0x62 ,0x0d ,0x08 ,0x27 ,0x7e ,0x6b ,0x07 ,0xb9 ,0xdc ,0xf0 ,0x9e ,0xee ,0xe6 ,0xe6 ,0xa1 ,0xea ,0x08 ,0xeb ,0xd3 ,0xb6 ,0xf0 ,0xb6 ,0x90 ,0xb8 ,0x43 ,0x45 ,0xc9 ,0x9a ,0x55 ,0x9f ,0xae ,0x39 ,0xab ,0x31 ,0x48 ,0x22 ,0xf3 ,0x15 ,0xe2 ,0x9c ,0xe8 ,0xf7 ,0x63 ,0xef ,0xec ,0xd4 ,0xfe ,0x07 ,0x2c ,0xad ,0xf0 ,0x0a ,0x83 ,0x6e ,0xef ,0xef ,0x55 ,0x8b ,0xd2 ,0x4d ,0xae ,0x21 ,0xfa ,0xbf ,0x10 ,0x37 ,0xad ,0xab ,0x95 ,0x6f ,0x49 ,0x16 ,0x54 ,0x69 ,0xff]);
	var resp = await generate_rsa_signature(fid_number, data);
	console.log(array2hex(resp.resp));
}

async function ecc_sign(){
	// just an example.
	var fid = document.getElementById("keyID").value;
	let fid_number = parseInt(fid, 10);
	var data = new Uint8Array([0x73 ,0x5c ,0xff ,0x2c ,0xc1 ,0x76 ,0xb6 ,0x83 ,0x4b ,0x94 ,0xab ,0xa2 ,0xc5 ,0x77 ,0xcd ,0x80 ,0x73 ,0x90 ,0x08 ,0x43 ,0x40 ,0x2a ,0xd2 ,0x15 ,0xea ,0xff ,0x74 ,0xdf ,0xf4 ,0xc4 ,0xb6 ,0x21]);
	var resp = await generate_ecc_signature(fid_number, data);
	console.log(array2hex(resp.resp));
}

async function rsa_decrypt(){
	// just an example.
	var fid = document.getElementById("keyID").value;
	let fid_number = parseInt(fid, 10);
	var data = hex2array("a37ef70ad14ff7ed780dea03baaa2782334aa467117d2b7671cdadf3f7c4f9b86bf808133e52ab6e77d365c8fa4921582afd9ca19e23e18cd7ccf060ddc2ca003c2ff4aab7270afaac2de98c0892896e665046cf1419dd3b91692c438acee05d56c98071ff400637fc581f7aa59e1056239cf3ba372fc0cb54b8dd5bf0597936053de5ba82314e9763e17cb6ac081256461b9ffa4f8a696f7b064d64ce68f295ecb8ff30b8829b8cb69af98474d560aafd7449366602f76c7348f76271031065903c721fa85f28966abd32d5015c9da9819c5e41b48092e2c6b724d7c7a8ef751b016b0fccb12a6b8d2115de5571575de5bb56a9a3bda99ef490f9422bc1b3dd");
	var resp = await generate_rsa_decrypt(fid_number, data);
	console.log(array2hex(resp.resp));
}

async function ecdh(){
	// just an example.
	var fid = document.getElementById("keyID").value;
	let fid_number = parseInt(fid, 10);
	var ec_key = hex2array("04954A6721D727E8D4A5BC0F8643489C1428DAFDDD5783759D79050C6D09AF378BD47E0EE8D5F140FFB96AE3B6B9BA9389D8477BF4A4317A3C91C6ED4070C777C8");
	var resp = await generate_ecdh(fid_number, ec_key);
	console.log(array2hex(resp.resp));
}

async function wrap(){
	// to wrap a key, the key, private_key_info and ee_certificate info need to be exported.
	var fid = document.getElementById("keyID").value;
	let fid_number = parseInt(fid, 10);
	var resp = await wrap_key(fid_number);
	console.log(array2hex(resp.data));
	resp = await read_binary(HSM_FILE_ID_PREFIX.private_key_info + fid_number, 0, 0);
	console.log(array2hex(resp.data));
	resp = await read_binary(HSM_FILE_ID_PREFIX.ee_certificate + fid_number, 0, 0);
	console.log(array2hex(resp.data));
	// find somewhere to store these value
}

async function unwrap(){
	var fid = document.getElementById("keyID").value;
	let fid_number = parseInt(fid, 10);
	var wrapped_key = hex2array("9dbe99fc78ad6f0306000a04007f0007020202010200000000000068082e42f1d284f1b8e5f1295d747b5aff6f72785b9a423cb212a5a707a18ce27b04c7ea04a1b5263a72625eb30055a4aec95dc72985549957561dab700651efee6697954b67d8ed6e23e9666c27b2817f29cca69dcaf7e85a76fa134f8b6f42d1063b54e22a46ff05463a897c442679ed68fee7d8d70b7f6376fe0dce7c552df014483cc85b0bf1bb13a3eba7768fb12ee9dbe8210119ebc52298a5e875114e3ef7fb391a4304427b8e3434e7e99e3d1fb8984d481f43e86a77dbf6a4e1478c1873f5df891b0f00c7f6e3bf0fee34b18ab019afaed2de810833983f3d9f2e8005868ab83aac684c1bc155074733891ad9e76d7797e2b31fd27e53f16592ef1f7d108de36c6883f227c9d3bb138bb6954f9e74132fac1fe6ac40f67fc053687c53fb6824bdbc58102c9522a2b3b3733ea93fc81ef8c52d454faca8b33decca2391dd5c42c5772d08cf3ca8d8e4bf2a0b8f75c08d8ccb09fa8bdabc532270137ab6fc008663b88f3885adbf58131f4e24adb1b5dc483746d652df841bbce95716ff1223276398817b857ada7fdf85b3b8fdeac0e90038f50ba6cb494f0ab885978bee38715c749fd13755f534ab70dd80f788e90d5a2d94cc5f906e1c466c23c1f894bc34d23ba01e719d1d021177f361406b9a9ee856ddab614d137341e962937a718cfee77da7f6d26fdcc4bef39e5b95d829ced47ae6ee8f9f3bc3660ca35df814b9dc04fd79dc89227f2db0a8e7cc933f5fead4bb98738b532a996a25bc4a94ea321f159faa5fa28894e2565432b15fa19006203e8f45e547ed5bfeba79f2dc408c9bb25898db78522bdee0f942dc74daf222b07a0ee62de80ca4db8a2c230b22578b5b9c8e37eefc5c84a1cd54f107a76113e2619644c13c9579fe357e75e37eaddb316e2533d5002ad69ccebb17c3e9f34de6f6963fbcd87d60f93b11960513cc5608e2b83d9deb3a005fac40ecbfe9fd125116edd36cbe50e9fa347e2b5faea40f5d90a0e56476027c74fe3df43dba07c403c10f3f66a59be90041201449d73f7ad59619e21381813b09ae08b085f6db3ba74c30e5e85af12899ae98fed116a13953ca4fff28ba8b1f00d3e0de8a538a193fe2133bacd022dba065ea4619f2b6e82c7b1d97de3b8cce95413e973297a82d4968cea5209a81fd6a670136b83a786da58fa831e8722d59415506dd062a9b4733c695dc175c4345ef6b434e0c56858fd9f331a032add2c336b191678f352984d5addaa4fd758aab09c099b2c1277b8b408ef86a0364e2ab8980dfc042fdca70658eeadec937e0443e7ac1b14a2844e9fdde3aeb0d76bc5580f1ffcc");
	var resp = await unwrap_key(fid_number, wrapped_key);
	console.log(array2hex(resp.resp));
	// an ugly way to modify private_key_info. Proper way should be extracting the label and ID, keysize information and regenerate the data
	var keyid_str = "740201";
	var private_key_info = "304d30100c0774657374525341030206c0040101302d042433316266363466652d336139352d636331632d323738642d64383335633930656162653603020474020101a10a30083002040002020800";
	var index = private_key_info.indexOf(keyid_str);
	private_key_info[index + 7] = fid;
	var private_key_info_data = hex2array(private_key_info);
	resp = await update_binary(HSM_FILE_ID_PREFIX.private_key_info + fid_number, 0, private_key_info_data);
	console.log(array2hex(resp.resp));
	var public_key_info = hex2array("678202997f2182023f7f4e8201355f29010042095554434130303030317f49820115060a04007f0007020202010281820100d2392b7fa113b64cfa7ba3f52c03933bac0169a343ed941fa58e2cc97c6991e860fce0b6e1b21a9e973f7b7dc93c7e413012da084ef13740b9dfa8be75e394a7d2a003883de6932671e24c92acabc09b3139369e69bd66b5769f7068f744ba3a629a22c0483f4918a96d41e8cf59ab32c63f9a2ae781c63312432841be18b805ba48aee0ddfe3f7388c2b72b67f48bbf2c344a750948d9a0763e537f7e6dce333e9820289f4f0e1abfc30a1f5a745a33409a7b680daa02b337b0ecc82dcc700098ea45ef37842e1dd16749163256d44fddb5ac8089d8086d0ea1b106bec69d2b3a20fab74da44350b7fbc957a7d843cef8885eea9a3a316f2725d89eb239d60d82030100015f20095554544d30303030315f3782010011b95552776c2992b051aa1348f7845a8fc7e44fd69e1d86af2bd9f0667604d9736a21dfa4528ca3eb2d336e67c5cd89df914427087cf477fec9865b2127e7ee80681b58011f25619d789c10f13c752bbe0d19d4a7373aa65f15753bdc2254a9ec6ac0550307bd0001ca5b7a44f09ab6603072474d856a0efc60af64612d21beb37c65ec7e801bc47ce98a74a210dcd1d6200da469fab029d99243c3059ffda49f289164f0270e1da4ae637e375c63f3af3f8fc7f55d13ead759cb661177ca815c328f282d2b4fb35c6039b4dc7ea8266511c6200dac65080ca6fe3b6afeaac87b8197f09ec934410793c0b2513960067bb1ef37972f71d9381c3d7ab9805790421054574b583031303038383530303030305f3740103275105f378e9eba49651bbd30a691e27035ca501960ea159e4b337385cd1c0ed5703d773cead048b008eb460d8304458a50bb7879f0fa97523915755fcb4a");
	resp = await update_binary(HSM_FILE_ID_PREFIX.ee_certificate + fid_number, 0, public_key_info);
	console.log(array2hex(resp.resp));
}

async function read_fid_bianry(){
	var fid = document.getElementById("fid").value;
	if (fid == ""){
		fid = document.getElementById("fid").placeholder;
	}
	let fid_number = parseInt(fid, 16);
	var resp = await read_binary(fid_number, 0, 0);
	console.log(array2hex(resp.resp));
	appendMessage(array2hex(resp.resp));
}

async function create_data_object(){

	var fid = document.getElementById("fid").value;
	if (fid == ""){
		fid = document.getElementById("fid").placeholder;
	}
	let fid_number = parseInt(fid, 16);
	fid_number = fid_number & 0xff;
	var resp = await generate_data_container_info(fid_number, 1, "KeyXentic DKEK Data Object", "KeyXentic Key Management Tool v2.0", "");
	console.log(array2hex(resp.resp));
	resp = await update_binary(HSM_FILE_ID_PREFIX.data_container_info + fid_number, 0, resp.data);
	var data = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F]);
	resp = await update_binary(HSM_FILE_ID_PREFIX.confidential_data + fid_number, 0, data);
	appendMessage(array2hex(resp.resp));
}

async function send_apdu(){
	var apdu = document.getElementById("apdu").value;
	appendMessage('send apdu: ', apdu);
	var resp = await apdu_exchange(apdu);
    appendMessage(array2hex(resp.resp));
}
