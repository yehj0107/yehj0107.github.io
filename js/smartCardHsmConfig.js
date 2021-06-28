
function get_initialize_device_default_config(){
	return{
		"transport_pin": false,
		"user_pin": "648219",
		"original_so_pin": "57621880",
		"new_so_pin": "57621880",
		"max_pin_retry_count": 3,
		"number_of_DKEK": 1,
		"use_fingerprint": true
	}
}

const HSM_RSA_KEY_SIZE = {
	hsm_rsa_key_1024: 1024,
	hsm_rsa_key_1536: 1536,
	hsm_rsa_key_2048: 2048
}

const HSM_EC_KEY_CURVE = {
	hsm_ec_secp256r1: 0x02,
	hsm_ec_secp256k1: 0x08
}

const HSM_STATUS_WORD = {
	success: 0x9000,
	wrong_length: 0x6700,
	incorrect_parameter: 0x6A86,
	incorrect_data: 0x6A80,
	security_status_not_satisfied: 0x6982,
	condition_not_satisfied: 0x6985,
	reference_data_not_found: 0x6A88,
	reference_data_not_usable: 0x6984,
	authentication_methond_blocked: 0x6983,
	file_not_found: 0x6A82
}

const HSM_FILE_ID_PREFIX = {
	private_key_info: 0xC400,
	certificate_info: 0xC800,
	data_container_info: 0xC900,
	ca_certificate: 0xCA00,
	read_only_data_object: 0xCB00,
	private_key: 0xCC00,
	confidential_data: 0xCD00,
	ee_certificate: 0xCE00,
	public_data: 0xCF00
}
