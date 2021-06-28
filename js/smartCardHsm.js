
var handle = {
	"init": false,
	"memory": null
}

async function inspect_browser() {
  var platform_description = platform.description;
  var web_auth_support = false;
  if(!window.PublicKeyCredential){
	  web_auth_support = false;
  }
  else{
	  web_auth_support= true;
  }
  var is_linux = false;
  if (platform.os["family"] == "Linux") {
    is_linux = true;
  }
  return {
	  "platform_description": platform_description,
	  "web_auth_support": web_auth_support,
	  "is_linux": is_linux
	  };
}
/* 
If the wasm module was properly initialized
This function would prints "Hello from SmartCardHsmApdu wasm" in the console log
*/
async function wasm_test(){
	Module._wasmTestPrint();
}

async function get_api_version(){
	return Module.ccall('getApiVersion', 'string', 'null', 'null');
}

function smartcardhsm_init(){
	handle.memory = Module._malloc(1024);
	handle.init = true;
}

async function apdu_exchange(apdu){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if (typeof apdu != 'string'){
		console.log("input should be a string");
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	var apdu_arr = hex2array(apdu);

	if(handle.init){
		Module.HEAPU8.set(apdu_arr, handle.memory);
		return await Module.ccall('apduExchange', 'number', ['number', 'number'], [handle.memory, apdu_arr.length], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				console.log(resp);
				ret.status = 0;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = -1;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}


async function select_hsm_applet(){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if(handle.init){
		return await Module.ccall('selectHsmApplet', 'number', ['number'], [handle.memory], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}

async function initialize_device(initialize_device_config){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	let user_pin = initialize_device_config.user_pin;
	let so_pin = initialize_device_config.original_so_pin;
	let try_cnt = initialize_device_config.max_pin_retry_count;
	let dkek_num = initialize_device_config.number_of_DKEK;
	let is_transport = initialize_device_config.transport_pin;
	let is_fingerprint = initialize_device_config.use_fingerprint;
	
	if (so_pin.length != 8 || user_pin.length > 15 || try_cnt > 15 || dkek_num > 15){
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	if(handle.init){
		return await Module.ccall('initializeDevice', 'number', ['number', 'string', 'string', 'number', 'number', 'number', 'number'], [handle.memory, so_pin, user_pin, try_cnt, dkek_num, is_transport, is_fingerprint], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}

async function enumerate_objects(){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if(handle.init){
		return await Module.ccall('enumerateObjects', 'number', ['number'], [handle.memory], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}


async function generate_random_number(size){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if(handle.init){
		return await Module.ccall('generateRandomNumber', 'number', ['number','number'], [handle.memory,size], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}

async function select_object(fid){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if (typeof fid != 'number'){
		console.log("input should be a number");
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	if(handle.init){
		return await Module.ccall('selectObject', 'number', ['number', 'number'], [handle.memory, fid], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}

async function delete_object(fid){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if (typeof fid != 'number'){
		console.log("input should be a number");
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	if(handle.init){
		return await Module.ccall('deleteObject', 'number', ['number', 'number'], [handle.memory, fid], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}

async function create_object(fid){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if (typeof fid != 'number'){
		console.log("input should be a number");
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	if(handle.init){
		return await Module.ccall('createObject', 'number', ['number', 'number'], [handle.memory, fid], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}

// use empty string input for default DKEK
async function import_dkek_share(dkek){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if(handle.init){
		return await Module.ccall('importDKEKShare', 'number', ['number', 'number', 'number', 'number'], [handle.memory, null, 0 , 1], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}

async function query_dkek_status(){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if(handle.init){
		return await Module.ccall('queryDKEKStatus', 'number', ['number'], [handle.memory], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}

async function query_login_status(){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if(handle.init){
		return await Module.ccall('verifyUserPinStatus', 'number', ['number'], [handle.memory], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}

async function query_so_pin_status(){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if(handle.init){
		return await Module.ccall('verifySoPinStatus', 'number', ['number'], [handle.memory], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}

async function login_user_pin(user_pin){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if (typeof user_pin != 'string'){
		console.log("input should be a string");
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	if(user_pin.length > 15){
		ret.status = HSM_ERR_CODE.hsm_err_invalid_length;
		return ret;		
	}
	
	if(handle.init){
		return await Module.ccall('verifyUserPin', 'number', ['number','string'], [handle.memory, user_pin], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}

async function reset_user_pin_try_count(so_pin){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if (typeof so_pin != 'string'){
		console.log("input should be a string");
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	if(so_pin.length != 8){
		ret.status = HSM_ERR_CODE.hsm_err_invalid_length;
		return ret;		
	}
	
	if(handle.init){
		return await Module.ccall('resetRetryCounter', 'number', ['number','string'], [handle.memory, so_pin], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}

async function change_user_pin(old_user_pin, new_user_pin){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if (typeof old_user_pin != 'string' || typeof new_user_pin != 'string' ){
		console.log("input should be a string");
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	if(old_user_pin.length > 15 || new_user_pin.length > 15){
		ret.status = HSM_ERR_CODE.hsm_err_invalid_length;
		return ret;		
	}
	
	if(handle.init){
		return await Module.ccall('changeUserPin', 'number', ['number','string','string'], [handle.memory, old_user_pin, new_user_pin], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}

async function change_so_pin(old_so_pin, new_so_pin){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if (typeof old_so_pin != 'string' || typeof new_so_pin != 'string' ){
		console.log("input should be a string");
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	if(old_so_pin.length!= 8 || new_so_pin.length != 8){
		ret.status = HSM_ERR_CODE.hsm_err_invalid_length;
		return ret;		
	}
	
	if(handle.init){
		return await Module.ccall('changeSoPin', 'number', ['number','string','string'], [handle.memory, old_so_pin, new_so_pin], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}

async function change_user_pin_by_so_pin(so_pin, new_user_pin){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if (typeof so_pin != 'string' || typeof new_user_pin != 'string' ){
		console.log("input should be a string");
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	if(so_pin.length != 8 || new_user_pin.length > 15){
		ret.status = HSM_ERR_CODE.hsm_err_invalid_length;
		return ret;		
	}
	
	if(handle.init){
		return await Module.ccall('changeUserPinBySoPin', 'number', ['number','string','string'], [handle.memory, so_pin, new_user_pin], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}

async function generate_rsa_private_key_info(fid, key_size, label, id){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if (typeof label != 'string' || typeof id != 'string' || typeof fid != 'number' || typeof key_size != 'number' ){
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	if(handle.init){
		return await Module.ccall('generateRsaPrivateKeyInfo', 'number', ['number','number','number','string','string'], [handle.memory, fid, key_size, label, id], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0);
				ret.sw = 0;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}

async function generate_ecc_private_key_info(fid, key_curve, label, id){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if (typeof label != 'string' || typeof id != 'string' || typeof fid != 'number' || typeof key_curve != 'number' ){
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	if(handle.init){
		var key_size = 0;
		if(key_curve ==  HSM_EC_KEY_CURVE.hsm_ec_secp256k1 ||  key_curve == HSM_EC_KEY_CURVE.hsm_ec_secp256k1){
			key_size = 256;
		}
		return await Module.ccall('generateEccPrivateKeyInfo', 'number', ['number','number','number','string','string'], [handle.memory, fid, key_size, label, id], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0);
				ret.sw = 0;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}

async function generate_certificate_container_info(fid, label, id){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if (typeof label != 'string' || typeof id != 'string' || typeof fid != 'number'){
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	if(handle.init){
		return await Module.ccall('generateCertContainerInfo', 'number', ['number','number','string','string'], [handle.memory, fid, label, id], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0);
				ret.sw = 0;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}

async function generate_certificate_private_key_info(fid, key_size, label, id, common, email){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if (typeof label != 'string' || typeof id != 'string' || typeof common != 'string' || typeof email != 'string' || typeof key_size != 'number' || typeof fid != 'number'){
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	if(handle.init){
		return await Module.ccall('generateCertPrivateKeyInfo', 'number', ['number','number','number','string','string','string','string'], [handle.memory, fid, key_size, label, id, common, email], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0);
				ret.sw = 0;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}

async function generate_data_container_info(fid, is_private, label, appinfo, oid){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if (typeof label != 'string' || typeof appinfo != 'string' || typeof oid != 'string' || typeof fid != 'number'){
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	if(handle.init){
		return await Module.ccall('generateDataContainerInfo', 'number', ['number','number','number','string','string','string'], [handle.memory, fid, is_private, label, appinfo, oid], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0);
				ret.sw = 0;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}

async function generae_rsa_key_pair(key_id, key_size){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if (typeof key_id != 'number' || typeof key_size != 'number'){
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	if(handle.init){
		return await Module.ccall('generateRsaAsymmetricKeyPair', 'number', ['number','number','number'], [handle.memory, key_id, key_size], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}

async function generae_ec_key_pair(key_id, key_curve){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if (typeof key_id != 'number' || typeof key_curve != 'number'){
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	if(handle.init){
		return await Module.ccall('generateEccAsymmetricKeyPair', 'number', ['number','number','number'], [handle.memory, key_id, key_curve], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}

//  Plain RSA Signature
async function generate_rsa_signature(fid, data){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if (typeof fid != 'number' || !(data.constructor == Uint8Array)){
		console.log("input parameter error")
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	if(handle.init){
		var dataPtr = Module._malloc(data.length);
		Module.HEAPU8.set(data, dataPtr);
		
		return await Module.ccall('generateRsaSignature', 'number', ['number','number','number','number'], [handle.memory, fid, dataPtr, data.length], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			Module._free(dataPtr);
			return ret;
		});
	}
	else{
		return ret;
	}
}

// Plain ECDSA Signature
async function generate_ecc_signature(fid, data){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if (typeof fid != 'number' || !(data.constructor == Uint8Array)){
		console.log("input parameter error")
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	if(handle.init){
		var dataPtr = Module._malloc(data.length);
		Module.HEAPU8.set(data, dataPtr);
		
		return await Module.ccall('generateEccSignature', 'number', ['number','number','number','number'], [handle.memory, fid, dataPtr, data.length], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			Module._free(dataPtr);
			return ret;
		});
	}
	else{
		return ret;
	}
}

// Plain RSA Decryption
async function generate_rsa_decrypt(fid, data){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if (typeof fid != 'number' || !(data.constructor == Uint8Array)){
		console.log("input parameter error")
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	if(handle.init){
		var dataPtr = Module._malloc(data.length);
		Module.HEAPU8.set(data, dataPtr);
		
		return await Module.ccall('generateRsaDecrypt', 'number', ['number','number','number','number'], [handle.memory, fid, dataPtr, data.length], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			Module._free(dataPtr);
			return ret;
		});
	}
	else{
		return ret;
	}
}


// ECDH
async function generate_ecdh(fid, data){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if (typeof fid != 'number' || !(data.constructor == Uint8Array)){
		console.log("input parameter error")
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	if(handle.init){
		var dataPtr = Module._malloc(data.length);
		Module.HEAPU8.set(data, dataPtr);
		
		return await Module.ccall('generateECDH', 'number', ['number','number','number','number'], [handle.memory, fid, dataPtr, data.length], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			Module._free(dataPtr);
			return ret;
		});
	}
	else{
		return ret;
	}
}


async function wrap_key(fid){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if (typeof fid != 'number'){
		console.log("input parameter error")
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	if(handle.init){
		return await Module.ccall('wrapKey', 'number', ['number','number'], [handle.memory, fid], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}

async function unwrap_key(fid, data){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if (typeof fid != 'number' || !(data.constructor == Uint8Array)){
		console.log("input parameter error")
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	if(handle.init){
		var dataPtr = Module._malloc(data.length);
		Module.HEAPU8.set(data, dataPtr);
		
		return await Module.ccall('unWrapKey', 'number', ['number','number','number','number'], [handle.memory, fid, dataPtr, data.length], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			Module._free(dataPtr);
			return ret;
		});
	}
	else{
		return ret;
	}
}

// if read_size == 0, it would try to read all data
async function read_binary(fid, offset, read_size){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if (typeof fid != 'number' || typeof read_size != 'number' || typeof offset != 'number' ){
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	if(handle.init){
		return await Module.ccall('readBinary', 'number', ['number','number','number','number'], [handle.memory, fid, offset, read_size], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			return ret;
		});
	}
	else{
		return ret;
	}
}

async function update_binary(fid, offset, data){
	var ret = {
		"status": HSM_ERR_CODE.hsm_err_undefined,
		"resp": null,
		"data": null,
		"sw": 0
	};
	if (typeof offset != 'number' || !(data.constructor == Uint8Array)){
		console.log("input parameter error")
		ret.status = HSM_ERR_CODE.hsm_err_invalid_parameter;
		return ret;
	}
	if(handle.init){
		var dataPtr = Module._malloc(data.length);
		Module.HEAPU8.set(data, dataPtr);
		
		return await Module.ccall('updateBinary', 'number', ['number','number','number','number','number'], [handle.memory, fid, offset, dataPtr, data.length], {async: true}).then(result => {
			if(result > 0){
				var resp = new Uint8Array(Module.HEAPU8.buffer, handle.memory, result);
				ret.status = HSM_ERR_CODE.hsm_success;
				ret.resp = resp.slice(0);
				ret.data = resp.slice(0, result-2);
				var a = resp[result-2];
				var b = resp[result-1];
				ret.sw = a*256 + b;
			}				
			else{
				ret.status = HSM_ERR_CODE.hsm_err_ctap_error;
				ret.data = null;
				ret.sw = 0;
			}
			Module._free(dataPtr);
			return ret;
		});
	}
	else{
		return ret;
	}
}

function hex2array(string)
{
    if (string.slice(0,2) == '0x')
    {
        string = string.slice(2,string.length);
    }
    if (string.length & 1)
    {
        throw new Error('Odd length hex string');
    }
    let arr = new Uint8Array(string.length/2);
    var i;
    for (i = 0; i < string.length; i+=2)
    {
        arr[i/2] = parseInt(string.slice(i,i+2),16);
    }
    return arr;
}

function array2hex(buffer) {
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}
