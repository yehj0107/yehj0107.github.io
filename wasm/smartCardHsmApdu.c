#include <stdio.h>
#include <string.h>
#include <emscripten/emscripten.h>
#include "smartCardHsmApduDef.h"

#ifdef __cplusplus
extern "C" {
#endif

extern int ctap_apdu_exchange(uint8_t *data, uint16_t size, uint32_t timeout);

EMSCRIPTEN_KEEPALIVE
char* getApiVersion() {
	return "0.0.1";
}

EMSCRIPTEN_KEEPALIVE
void wasmTestPrint() {
	printf("Hello from SmartCardHsmApdu wasm\n");
}

EMSCRIPTEN_KEEPALIVE
int apduExchange(uint8_t *apdu, int size) {
	return ctap_apdu_exchange(apdu, size, 60000);
}

EMSCRIPTEN_KEEPALIVE
int selectHsmApplet(uint8_t *buf) {
	uint8_t select[] = {CLA_00, INS_SELECT,0x04,0x04,0x0B,0xE8,0x2B,0x06,0x01,0x04,0x01,0x81,0xC3,0x1F,0x02,0x01};
	memcpy(buf, select, sizeof(select));
 	int ret = ctap_apdu_exchange(buf,sizeof(select), 10000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int selectObject(uint8_t *buf, int fid) {
    uint8_t cmd_data[] = {
        CLA_00,
        INS_SELECT,
        0x00,
        0x00,
        0x02,
        0x00, 0x00, // FID
        0x00
    };
	uint16_t file_id = fid & 0xffff;
	cmd_data[5] = file_id >> 8;
	cmd_data[6] = file_id & 0xff;
	memcpy(buf, cmd_data, sizeof(cmd_data));
 	int ret = ctap_apdu_exchange(buf,sizeof(cmd_data), 10000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int createObject(uint8_t *buf, int fid) {
    uint8_t cmd_data[] = {
        CLA_00,
        INS_UPDATE_BINARY,
        0x00, 0x00, // FID
        0x06,       // C-Data-Length
        0x54, 0x02,
        0x00, 0x00, // Data-Offset
        0x53,
        0x00        // Data-Length
                    // Data ...
    };
	uint16_t file_id = fid & 0xffff;
	cmd_data[2] = file_id >> 8;
	cmd_data[3] = file_id & 0xff;
	memcpy(buf, cmd_data, sizeof(cmd_data));
 	int ret = ctap_apdu_exchange(buf,sizeof(cmd_data), 10000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int deleteObject(uint8_t *buf, int fid) {
    uint8_t cmd_data[] = {
        CLA_00,
        INS_DELETE_FILE,
        0x02,
        0x00,
        0x02,
        0x00, 0x00 // FID
    };
	uint16_t file_id = fid & 0xffff;
	cmd_data[5] = file_id >> 8;
	cmd_data[6] = file_id & 0xff;
	memcpy(buf, cmd_data, sizeof(cmd_data));
 	int ret = ctap_apdu_exchange(buf,sizeof(cmd_data), 10000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int enumerateObjects(uint8_t *buf) {
    uint8_t cmd_data[] = {
        CLA_80,
        INS_ENUMERATE_OBJECTS,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00
    };
	memcpy(buf, cmd_data, sizeof(cmd_data));
 	int ret = ctap_apdu_exchange(buf, sizeof(cmd_data), 10000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int initializeDevice(uint8_t *buf, char *sopin, char *userPin, int retryCount, int dkekNum, int isTransportPin, int isFingerprint) {
	uint8_t payloadLen = 0, offset = 0;
	uint8_t *lenByte;
	buf[0] = CLA_80;
	buf[1] = INS_INITIALIZE_DEVICE;
	buf[2] = 0x00;
	buf[3] = 0x00;
	buf[4] = 0x00;
	lenByte = &buf[4];
	offset = 5;
	
	// config options
	buf[offset++] = 0x80;
	buf[offset++] = 0x02;
	buf[offset++] = 0x00;
	buf[offset++] = isTransportPin == 1 ? 0x03 : 0x01;
	payloadLen += 4;
	
	// user pin
	int pinLen = strlen(userPin);
	buf[offset++] = 0x81;
	buf[offset++] = pinLen;
	strncpy((char *)&buf[offset], userPin, pinLen);
	offset += pinLen;
	payloadLen += pinLen + 2;
	
	// so pin
	pinLen = strlen(sopin);
	buf[offset++] = 0x82;
	buf[offset++] = 0x08;
	strncpy((char *)&buf[offset], sopin, pinLen);
	offset += pinLen;
	payloadLen += pinLen + 2;

	// retry count
	buf[offset++] = 0x91;
	buf[offset++] = 0x01;
	buf[offset++] = retryCount & 0x0f;
	payloadLen += 3;
	
	// DKEK share numbber
	buf[offset++] = 0x92;
	buf[offset++] = 0x01;
	buf[offset++] = dkekNum;
	payloadLen += 3;
	
	if (isFingerprint == 1) {
		uint8_t ntServerAid[] = {0xF1, 0x4E, 0x46, 0x53, 0x65, 0x72, 0x76, 0x65, 0x72, 0x53, 0x61, 0x6D, 0x70, 0x6C, 0x65};
		buf[offset++] = 0x95;
		buf[offset++] = sizeof(ntServerAid) + 1;
		buf[offset++] = 0x01;
		memcpy(&buf[offset], ntServerAid, sizeof(ntServerAid));
		offset += sizeof(ntServerAid);
		payloadLen += 3 + sizeof(ntServerAid);
		
		buf[offset++] = 0x96;
		buf[offset++] = sizeof(ntServerAid) + 1;
		buf[offset++] = 0x02;
		memcpy(&buf[offset], ntServerAid, sizeof(ntServerAid));
		offset += sizeof(ntServerAid);
		payloadLen += 3 + sizeof(ntServerAid);
	}
	*lenByte = payloadLen;
	
 	int ret = ctap_apdu_exchange(buf, offset, 10000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int importDKEKShare(uint8_t *buf, uint8_t *newDkek, uint8_t dkekLen, uint8_t isDefault) {
    uint8_t cmd_data[] = {
        CLA_80,
        INS_IMPORT_DKEK_SHARE,
        0x00,
        0x00,
        0x20,
        0x9C, 0x39, 0x68, 0x5E, 0xB5, 0x6A, 0x6F, 0x19, 0x84, 0xC7, 0x93, 0xD6, 0xF7, 0xA5, 0x48, 0xE8,
        0xF0, 0x45, 0x11, 0xB2, 0x6A, 0x59, 0xE8, 0x26, 0x20, 0xF6, 0x82, 0x69, 0x5F, 0x8F, 0xB9, 0xDC,
        0x00
    };
	if(!isDefault){
		memcpy(&cmd_data[5], newDkek, sizeof(dkekLen));
	}
	memcpy(buf, cmd_data, sizeof(cmd_data));
 	int ret = ctap_apdu_exchange(buf, sizeof(cmd_data), 10000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int queryDKEKStatus(uint8_t *buf) {
	uint8_t cmd_data[] = {
        CLA_80,
        INS_IMPORT_DKEK_SHARE,
        0x00,
        0x00,
        0x00
    };
	memcpy(buf, cmd_data, sizeof(cmd_data));
 	int ret = ctap_apdu_exchange(buf, sizeof(cmd_data), 10000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int verifyUserPin(uint8_t *buf, char *pin) {
	int pinLen = strlen(pin);
    buf[0] = CLA_00;
	buf[1] = INS_VERIFY;
	buf[2] = 0x00;
	buf[3] = 0x81;
	buf[4] = pinLen;
	strncpy((char *)&buf[5], pin, pinLen);
 	int ret = ctap_apdu_exchange(buf, pinLen + 5, 10000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int verifyUserPinStatus(uint8_t *buf) {
    buf[0] = CLA_00;
	buf[1] = INS_VERIFY;
	buf[2] = 0x00;
	buf[3] = 0x81;
 	int ret = ctap_apdu_exchange(buf, 4, 10000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int verifySoPinStatus(uint8_t *buf) {
    buf[0] = CLA_00;
	buf[1] = INS_VERIFY;
	buf[2] = 0x00;
	buf[3] = 0x88;
 	int ret = ctap_apdu_exchange(buf, 4, 10000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int resetRetryCounter(uint8_t *buf, char *soPin) {
	int pinLen = strlen(soPin);
    buf[0] = CLA_00;
	buf[1] = INS_RESET_RETRY_COUNTER;
	buf[2] = 0x01;
	buf[3] = 0x81;
	buf[4] = pinLen;
	strncpy((char *)&buf[5], soPin, pinLen);
 	int ret = ctap_apdu_exchange(buf, pinLen + 5, 10000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int changeUserPin(uint8_t *buf, char *oldPin, char *newPin) {
	int offset = 0;
	int oldPinLen = strlen(oldPin);
	int newPinLen = strlen(newPin);
    buf[0] = CLA_00;
	buf[1] = INS_CHANGE_REFERENCE_DATA;
	buf[2] = 0x00;
	buf[3] = 0x81;
	buf[4] = oldPinLen + newPinLen;
	offset = 5;
	strncpy((char *)&buf[offset], oldPin, oldPinLen);
	offset += oldPinLen;
	strncpy((char *)&buf[offset], newPin, newPinLen);
	offset += newPinLen;
 	int ret = ctap_apdu_exchange(buf, offset, 10000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int changeSoPin(uint8_t *buf, char *oldPin, char *newPin) {
	int offset = 0;
	int oldPinLen = strlen(oldPin);
	int newPinLen = strlen(newPin);
    buf[0] = CLA_00;
	buf[1] = INS_CHANGE_REFERENCE_DATA;
	buf[2] = 0x00;
	buf[3] = 0x88;
	buf[4] = oldPinLen + newPinLen;
	offset = 5;
	strncpy((char *)&buf[offset], oldPin, oldPinLen);
	offset += oldPinLen;
	strncpy((char *)&buf[offset], newPin, newPinLen);
	offset += newPinLen;
 	int ret = ctap_apdu_exchange(buf, offset, 10000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int changeUserPinBySoPin(uint8_t *buf, char *soPin, char *newPin) {
	int offset = 0;
	int soPinLen = strlen(soPin);
	int newPinLen = strlen(newPin);
    buf[0] = CLA_00;
	buf[1] = INS_RESET_RETRY_COUNTER;
	buf[2] = 0x00;
	buf[3] = 0x81;
	buf[4] = soPinLen + newPinLen;
	offset = 5;
	strncpy((char *)&buf[offset], soPin, soPinLen);
	offset += soPinLen;
	strncpy((char *)&buf[offset], newPin, newPinLen);
	offset += newPinLen;
 	int ret = ctap_apdu_exchange(buf, offset, 10000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int generateRandomNumber(uint8_t *buf, int size) {
    buf[0] = CLA_00;
	buf[1] = INS_GET_CHALLENGE;
	buf[2] = 0x00;
	buf[3] = 0x00;
	buf[4] = size & 0xff;
 	int ret = ctap_apdu_exchange(buf, 5, 10000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int generateRsaSignature(uint8_t *buf, int fid, uint8_t *data, int dataSize) {
	int offset = 0;
    buf[offset++] = CLA_80;
	buf[offset++] = INS_SIGN;
	buf[offset++] = fid & 0xff;
	buf[offset++] = 0x20,   // Plain RSA Signature
	buf[offset++] = 0x00;
	buf[offset++] = dataSize >> 8;
	buf[offset++] = dataSize & 0xff;
	memcpy(&buf[offset], data, dataSize);
	offset += dataSize;
	buf[offset++] = 0x00;
	buf[offset++] = 0x00;
 	int ret = ctap_apdu_exchange(buf, offset, 10000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int generateEccSignature(uint8_t *buf, int fid, uint8_t *data, int dataSize) {
	int offset = 0;
    buf[offset++] = CLA_80;
	buf[offset++] = INS_SIGN;
	buf[offset++] = fid & 0xff;
	buf[offset++] = 0x70;   // Plain ECDSA Signature
	buf[offset++] = 0x00;
	buf[offset++] = dataSize >> 8;
	buf[offset++] = dataSize & 0xff;
	memcpy(&buf[offset], data, dataSize);
	offset += dataSize;
	buf[offset++] = 0x00;
	buf[offset++] = 0x00;
 	int ret = ctap_apdu_exchange(buf, offset, 10000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int generateRsaDecrypt(uint8_t *buf, int fid, uint8_t *data, int dataSize) {
	int offset = 0;
    buf[offset++] = CLA_80;
	buf[offset++] = INS_DECIPHER;
	buf[offset++] = fid & 0xff;
	buf[offset++] = 0x21,   // Plain RSA Decryption
	buf[offset++] = 0x00;
	buf[offset++] = dataSize >> 8;
	buf[offset++] = dataSize & 0xff;
	memcpy(&buf[offset], data, dataSize);
	offset += dataSize;
	buf[offset++] = 0x00;
	buf[offset++] = 0x00;
 	int ret = ctap_apdu_exchange(buf, offset, 10000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int generateECDH(uint8_t *buf, int fid, uint8_t *ecKey, int ecKeySize) {
	int offset = 0;
    buf[offset++] = CLA_80;
	buf[offset++] = INS_DECIPHER;
	buf[offset++] = fid & 0xff;
	buf[offset++] = 0x80;               // ECC Diffie-Hellmann Primitive
	buf[offset++] = 0x00;
	buf[offset++] = ecKeySize >> 8;
	buf[offset++] = ecKeySize & 0xff;
	memcpy(&buf[offset], ecKey, ecKeySize);
	offset += ecKeySize;
	buf[offset++] = 0x00;
	buf[offset++] = 0x00;
 	int ret = ctap_apdu_exchange(buf, offset, 10000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int wrapKey(uint8_t *buf, int fid) {
	int offset = 0;
    buf[offset++] = CLA_80;
	buf[offset++] = INS_WRAP_KEY;
	buf[offset++] = fid & 0xff;
	buf[offset++] = 0x92;               // Algorithm identifier
	buf[offset++] = 0x00;
	buf[offset++] = 0x00;
	buf[offset++] = 0x00;
 	int ret = ctap_apdu_exchange(buf, offset, 10000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int unWrapKey(uint8_t *buf, int fid, uint8_t *data, int dataSize) {
	int offset = 0;
    buf[offset++] = CLA_80;
	buf[offset++] = INS_UNWRAP_KEY;
	buf[offset++] = fid & 0xff;
	buf[offset++] = 0x93;               // Algorithm identifier
	buf[offset++] = 0x00;
	buf[offset++] = dataSize >> 8;
	buf[offset++] = dataSize & 0xff;
	memcpy(&buf[offset], data, dataSize);
	offset += dataSize;
 	int ret = ctap_apdu_exchange(buf, offset, 10000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int generateRsaAsymmetricKeyPair(uint8_t *buf, int fid, int keySizeinBit) {
	uint8_t cmd_data[] = {
        CLA_00,
        INS_GENERATE_ASYMMETRIC_KEY_PAIR,
        0x00,               // Key identifier in the range 1 to 255 of the key to be generated
        0x00,               // Key identifier for signing authenticated request or '00' for PrK_DevAut
        0x00, 0x00, 0x33,   // Length of C-Data
        // C-Data ...
        0x5F, 0x29, 0x01, 0x00,                                                 // Certification Profile Indicator
        0x42, 0x09, 0x55, 0x54, 0x43, 0x41, 0x30, 0x30, 0x30, 0x30, 0x31,       // Certification Authority Reference
        0x7F, 0x49, 0x15,                                                       // Public Key
        0x06, 0x0A, 0x04, 0x00, 0x7F, 0x00, 0x07, 0x02, 0x02, 0x02, 0x01, 0x02, // Public Key Algorithm
        0x82, 0x03, 0x01, 0x00, 0x01,                                           // Public exponent
        0x02, 0x02, 0x08, 0x00,                                                 // Key size in bits
        0x5F, 0x20, 0x09, 0x55, 0x54, 0x54, 0x4D, 0x30, 0x30, 0x30, 0x30, 0x31, // Certificate Holder Reference
        0x00,
        0x00
    };
	
    cmd_data[2] = fid & 0xff;  // Key index
    cmd_data[44] = keySizeinBit >> 8;  // Key size in bits
    cmd_data[45] = keySizeinBit & 0xff;  // Key size in bits
 	memcpy(buf, cmd_data, sizeof(cmd_data));
	int ret = ctap_apdu_exchange(buf, sizeof(cmd_data), 120000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int generateEccAsymmetricKeyPair(uint8_t *buf, int fid, int curve) {
	// only two curves support at this moment,
	// to support more cruves, refer to the cardcontact SmartCard-HSM datasheet and the curve parameter defined in https://www.secg.org/SEC2-Ver-1.0.pdf
	uint8_t *cmd;
	int cmd_len = 0;
	uint8_t cmd_data_secp256k1[] = {
        CLA_00,
        INS_GENERATE_ASYMMETRIC_KEY_PAIR,
        0x00,               // Key identifier in the range 1 to 255 of the key to be generated
        0x00,               // Key identifier for signing authenticated request or '00' for PrK_DevAut
        0x00, 0x00, 0xF9,   // Length of C-Data
        // C-Data ...
        0x5F, 0x29, 0x01, 0x00,                                                 // Certification Profile Indicator
        0x42, 0x09, 0x55, 0x54, 0x43, 0x41, 0x30, 0x30, 0x30, 0x30, 0x31,       // Certification Authority Reference
        0x7F, 0x49, 0x81, 0xDA,                                                 // Public Key
        0x06, 0x0A, 0x04, 0x00, 0x7F, 0x00, 0x07, 0x02, 0x02, 0x02, 0x02, 0x03, // Public Key Algorithm
        0x81, 0x20, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFE, 0xFF, 0xFF, 0xFC, 0x2F, // Prime modulus p (Unsigned Integer, fixed length)
        0x82, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // First coefficient a (Unsigned Integer, fixed length)
        0x83, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x07, // Second coefficient b (Unsigned Integer, fixed length)
        0x84, 0x41, 0x04, 0x79, 0xBE, 0x66, 0x7E, 0xF9, 0xDC, 0xBB, 0xAC, 0x55, 0xA0, 0x62, 0x95, 0xCE, 0x87, 0x0B, 0x07, 0x02, 0x9B, 0xFC, 0xDB, 0x2D, 0xCE, 0x28, 0xD9, 0x59, 0xF2, 0x81, 0x5B, 0x16, 0xF8, 0x17, // Base point G, encoded '04' || x || y
        0x98, 0x48, 0x3A, 0xDA, 0x77, 0x26, 0xA3, 0xC4, 0x65, 0x5D, 0xA4, 0xFB, 0xFC, 0x0E, 0x11, 0x08, 0xA8, 0xFD, 0x17, 0xB4, 0x48, 0xA6, 0x85, 0x54, 0x19, 0x9C, 0x47, 0xD0, 0x8F, 0xFB, 0x10, 0xD4,
        0xB8,
        0x85, 0x20, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFE, 0xBA, 0xAE, 0xDC, 0xE6, 0xAF, 0x48, 0xA0, 0x3B, 0xBF, 0xD2, 0x5E, 0x8C, 0xD0, 0x36, 0x41, 0x41, // Order of the base point (Unsigned Integer, fixed length)
        0x87,0x01,0x01,     // Cofactor f
        0x5F, 0x20, 0x09, 0x55, 0x54, 0x54, 0x4D, 0x30, 0x30, 0x30, 0x30, 0x31, // Certificate Holder Reference
        0x00,
        0x00
    };
	
	uint8_t cmd_data_secp256r1[] = {
        CLA_00,
        INS_GENERATE_ASYMMETRIC_KEY_PAIR,
        0x00,               // Key identifier in the range 1 to 255 of the key to be generated
        0x00,               // Key identifier for signing authenticated request or '00' for PrK_DevAut
        0x00, 0x00, 0xF9,   // Length of C-Data
        // C-Data ...
        0x5F, 0x29, 0x01, 0x00,                                                 // Certification Profile Indicator
        0x42, 0x09, 0x55, 0x54, 0x43, 0x41, 0x30, 0x30, 0x30, 0x30, 0x31,       // Certification Authority Reference
        0x7F, 0x49, 0x81, 0xDA,                                                 // Public Key
        0x06, 0x0A, 0x04, 0x00, 0x7F, 0x00, 0x07, 0x02, 0x02, 0x02, 0x02, 0x03, // Public Key Algorithm
        0x81, 0x20, 0xFF ,0xFF ,0xFF ,0xFF ,0x00 ,0x00 ,0x00 ,0x01 ,0x00 ,0x00 ,0x00 ,0x00 ,0x00 ,0x00 ,0x00 ,0x00 ,0x00 ,0x00 ,0x00 ,0x00 ,0xFF ,0xFF ,0xFF ,0xFF ,0xFF ,0xFF ,0xFF ,0xFF ,0xFF ,0xFF ,0xFF ,0xFF, // Prime modulus p (Unsigned Integer, fixed length)
        0x82, 0x20, 0xFF ,0xFF ,0xFF ,0xFF ,0x00 ,0x00 ,0x00 ,0x01 ,0x00 ,0x00 ,0x00 ,0x00 ,0x00 ,0x00 ,0x00 ,0x00 ,0x00 ,0x00 ,0x00 ,0x00 ,0xFF ,0xFF ,0xFF ,0xFF ,0xFF ,0xFF ,0xFF ,0xFF ,0xFF ,0xFF ,0xFF ,0xFC, // First coefficient a (Unsigned Integer, fixed length)
        0x83, 0x20, 0x5A ,0xC6 ,0x35 ,0xD8 ,0xAA ,0x3A ,0x93 ,0xE7 ,0xB3 ,0xEB ,0xBD ,0x55 ,0x76 ,0x98 ,0x86 ,0xBC ,0x65 ,0x1D ,0x06 ,0xB0 ,0xCC ,0x53 ,0xB0 ,0xF6 ,0x3B ,0xCE ,0x3C ,0x3E ,0x27 ,0xD2 ,0x60 ,0x4B, // Second coefficient b (Unsigned Integer, fixed length)
        0x84, 0x41, 0x04 ,0x6B ,0x17 ,0xD1 ,0xF2 ,0xE1 ,0x2C ,0x42 ,0x47 ,0xF8 ,0xBC ,0xE6 ,0xE5 ,0x63 ,0xA4 ,0x40 ,0xF2 ,0x77 ,0x03 ,0x7D ,0x81 ,0x2D ,0xEB ,0x33 ,0xA0 ,0xF4 ,0xA1 ,0x39 ,0x45 ,0xD8 ,0x98 ,0xC2, // Base point G, encoded '04' || x || y
		0x96 ,0x4F ,0xE3 ,0x42 ,0xE2 ,0xFE ,0x1A ,0x7F ,0x9B ,0x8E ,0xE7 ,0xEB ,0x4A ,0x7C ,0x0F ,0x9E ,0x16 ,0x2B ,0xCE ,0x33 ,0x57 ,0x6B ,0x31 ,0x5E ,0xCE ,0xCB ,0xB6 ,0x40 ,0x68 ,0x37 ,0xBF ,0x51 ,0xF5,
        0x85, 0x20, 0xFF ,0xFF ,0xFF ,0xFF ,0x00 ,0x00 ,0x00 ,0x00 ,0xFF ,0xFF ,0xFF ,0xFF ,0xFF ,0xFF ,0xFF ,0xFF ,0xBC ,0xE6 ,0xFA ,0xAD ,0xA7 ,0x17 ,0x9E ,0x84 ,0xF3 ,0xB9 ,0xCA ,0xC2 ,0xFC ,0x63 ,0x25 ,0x51, // Order of the base point (Unsigned Integer, fixed length)
        0x87,0x01,0x01,     // Cofactor f
        0x5F, 0x20, 0x09, 0x55, 0x54, 0x54, 0x4D, 0x30, 0x30, 0x30, 0x30, 0x31, // Certificate Holder Reference
        0x00,
        0x00
    };
	
	if(curve == EC_KEY_CURVE_SECP256R1){
		cmd = cmd_data_secp256r1;
		cmd_len = sizeof(cmd_data_secp256r1);
	}
	else{
		cmd = cmd_data_secp256k1;
		cmd_len = sizeof(cmd_data_secp256k1);
	}
    cmd[2] = fid & 0xff;  // Key index
 	memcpy(buf, cmd, cmd_len);
	int ret = ctap_apdu_exchange(buf, cmd_len, 120000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int generateRsaPrivateKeyInfo(uint8_t *buf, int fid, int keySizeinBit, char *label, char *id) {
	int offset = 0;
	uint8_t *lenByte;
	buf[offset++] = 0x30;
	lenByte = &buf[offset];
	buf[offset++] = 0x00;
	
	// Key Label
	uint8_t label_end_data[] = {
        0x03, 0x02, 0x06, 0xC0, 0x04, 0x01, 0x01
    };
	int labelLen = strlen(label);
	buf[offset++] = 0x30;
	buf[offset++] = labelLen + sizeof(label_end_data) + 2;   // Label-Length
	buf[offset++] = 0x0C;
	buf[offset++] = labelLen; // Label-Data-Length
	strncpy((char *)&buf[offset], label, labelLen);
	offset += labelLen;
	memcpy(&buf[offset], label_end_data, sizeof(label_end_data));
	offset += sizeof(label_end_data);	
	
	// Key ID
	int idLen = strlen(id);
	uint8_t id_end_data[] = {
        0x03, 0x02, 0x04, 0x74, // Private Key Attribute, Sign
        0x02, 0x01, 0x00        // Key index
    };
	buf[offset++] = 0x30;
	buf[offset++] = idLen + sizeof(id_end_data) + 2,   // Label-Length
	buf[offset++] = 0x04;
	buf[offset++] = idLen;
	id_end_data[6] = fid & 0xff;  // Key index
	strncpy((char *)&buf[offset], id, idLen);
	offset += idLen;
	memcpy(&buf[offset], id_end_data, sizeof(id_end_data));
	offset += sizeof(id_end_data);	
	
	// Key Info
	uint8_t info_data[] = {
        0xA1, 0x0A, 0x30, 0x08,
        0x30, 0x02, 0x04, 0x00,
        0x02, 0x02, 0x08, 0x00  // Key size in bits
    };
	info_data[10] = keySizeinBit >> 8; // Key size in bits
    info_data[11] = keySizeinBit & 0xff; // Key size in bits
	memcpy(&buf[offset], info_data, sizeof(info_data));
	offset += sizeof(info_data);
	
	*lenByte = offset-2;
	return offset;
}

EMSCRIPTEN_KEEPALIVE
int generateEccPrivateKeyInfo(uint8_t *buf, int fid, int keySizeinBit, char *label, char *id) {
	int offset = 0;
	uint8_t *lenByte;
	buf[offset++] = 0xA0;
	lenByte = &buf[offset];
	buf[offset++] = 0x00;
	
	// Key Label
	uint8_t label_end_data[] = {
        0x03, 0x02, 0x06, 0xC0, 0x04, 0x01, 0x01
    };
	int labelLen = strlen(label);
	buf[offset++] = 0x30;
	buf[offset++] = labelLen + sizeof(label_end_data) + 2;   // Label-Length
	buf[offset++] = 0x0C;
	buf[offset++] = labelLen; // Label-Data-Length
	strncpy((char *)&buf[offset], label, labelLen);
	offset += labelLen;
	memcpy(&buf[offset], label_end_data, sizeof(label_end_data));
	offset += sizeof(label_end_data);	
	
	// Key ID
	int idLen = strlen(id);
	uint8_t id_end_data[] = {
        0x03, 0x02, 0x04, 0x30, // Private Key Attribute, Sign
        0x02, 0x01, 0x00        // Key index
    };
	buf[offset++] = 0x30;
	buf[offset++] = idLen + sizeof(id_end_data) + 2,   // Label-Length
	buf[offset++] = 0x04;
	buf[offset++] = idLen;
	id_end_data[6] = fid & 0xff;  // Key index
	strncpy((char *)&buf[offset], id, idLen);
	offset += idLen;
	memcpy(&buf[offset], id_end_data, sizeof(id_end_data));
	offset += sizeof(id_end_data);	
	
	// Key Info
	uint8_t info_data[] = {
        0xA1, 0x0A, 0x30, 0x08,
        0x30, 0x02, 0x04, 0x00,
        0x02, 0x02, 0x01, 0x00  // Key size in bits
    };
	info_data[10] = keySizeinBit >> 8; // Key size in bits
    info_data[11] = keySizeinBit & 0xff; // Key size in bits
	memcpy(&buf[offset], info_data, sizeof(info_data));
	offset += sizeof(info_data);
	
	*lenByte = offset-2;
	return offset;
}

EMSCRIPTEN_KEEPALIVE
int generateDataContainerInfo(uint8_t *buf, int fid, int isPrivate, char *label, char *appinfo, char *oid) {
	int offset = 0;
	uint8_t *lenByte;
	buf[offset++] = 0x30;
	lenByte = &buf[offset];
	buf[offset++] = 0x00;
	
	// Label
    uint8_t public_label_end_data[] = {
        0x03, 0x02, 0x06, 0x40
    };
    uint8_t private_label_end_data[] = {
        0x03, 0x02, 0x06, 0xC0, 0x04, 0x01, 0x01
    };
	uint8_t *label_end_data = (isPrivate == 1) ? private_label_end_data : public_label_end_data;
    int label_end_data_size = (isPrivate == 1) ? sizeof(private_label_end_data) : sizeof(public_label_end_data);
	
	int labelLen = strlen(label);
	buf[offset++] = 0x30;
	buf[offset++] = labelLen + label_end_data_size + 2;   // Label-Length
	buf[offset++] = 0x0C;
	buf[offset++] = labelLen; // Label-Data-Length
	strncpy((char *)&buf[offset], label, labelLen);
	offset += labelLen;
	memcpy(&buf[offset], label_end_data, label_end_data_size);
	offset += label_end_data_size;	
	
	// App Info
	int appInfoLen = strlen(appinfo);
	buf[offset++] = 0x30;
	buf[offset++] = appInfoLen + 2;   // App Info-Length
	buf[offset++] = 0x0C;
	buf[offset++] = appInfoLen; // App Info-Data-Length
	strncpy((char *)&buf[offset], appinfo, appInfoLen);
	offset += appInfoLen;
	
	// OID
	int oidLen = strlen(oid);
	
	if(oidLen > 0){
		buf[offset++] = 0x06;
		buf[offset++] = oidLen;
		strncpy((char *)&buf[offset], oid, oidLen);
		offset += oidLen;
	}
	
	uint8_t cmd_end_data[] = {
        0xA1, 0x06, 0x30, 0x04,
        0x04, 0x02, 0xCD, 0x00  // Index
    };
	cmd_end_data[6] = (isPrivate == 1) ? 0xCD : 0xCF;  // Data type
    cmd_end_data[7] = fid & 0xff;  // Data index
	memcpy(&buf[offset], cmd_end_data, sizeof(cmd_end_data));
	offset += sizeof(cmd_end_data);
	
	*lenByte = offset-2;
	return offset;
}

EMSCRIPTEN_KEEPALIVE
int generateCertContainerInfo(uint8_t *buf, int fid, char *label, char *id) {
	int offset = 0;
	uint8_t *lenByte;
	buf[offset++] = 0x30;
	lenByte = &buf[offset];
	buf[offset++] = 0x00;
	
	// Label
    uint8_t label_end_data[] = {
        0x03, 0x02, 0x06, 0x40
    };
    int label_end_data_size = sizeof(label_end_data);
	
	int labelLen = strlen(label);
	buf[offset++] = 0x30;
	buf[offset++] = labelLen + label_end_data_size + 2;   // Label-Length
	buf[offset++] = 0x0C;
	buf[offset++] = labelLen; // Label-Data-Length
	strncpy((char *)&buf[offset], label, labelLen);
	offset += labelLen;
	memcpy(&buf[offset], label_end_data, label_end_data_size);
	offset += label_end_data_size;	
	
	// ID
	int idLen = strlen(id);
	buf[offset++] = 0x30;
	buf[offset++] = idLen + 2;   // Label-Length
	buf[offset++] = 0x04;
	buf[offset++] = idLen; // Label-Data-Length
	strncpy((char *)&buf[offset], id, idLen);
	offset += idLen;
	
	uint8_t cmd_end_data[] = {
        0xA1, 0x08, 0x30, 0x06,
        0x30, 0x04, 0x04, 0x02, 0xCA, 0x00  // Index
    };
	cmd_end_data[8] = 0xCA;  // Cert type
	cmd_end_data[9] = fid & 0xff;  // Cert index
	memcpy(&buf[offset], cmd_end_data, sizeof(cmd_end_data));
	offset += sizeof(cmd_end_data);
	
	*lenByte = offset-2;
	return offset;
}


EMSCRIPTEN_KEEPALIVE
int generateCertPrivateKeyInfo(uint8_t *buf, int fid, int keySizeinBit, char *label, char *id, char *common, char *email) {
	int offset = 0;
	uint8_t *lenByte, *certData;
	buf[offset++] = 0x30;
	buf[offset++] = 0x81;
	lenByte = &buf[offset];
	buf[offset++] = 0x00;
	
	// Label
    uint8_t label_end_data[] = {
		0x03, 0x02, 0x06, 0xC0, 0x04, 0x01, 0x01
    };
    int label_end_data_size = sizeof(label_end_data);
	
	int labelLen = strlen(label);
	buf[offset++] = 0x30;
	buf[offset++] = labelLen + label_end_data_size + 2;   // Label-Length
	buf[offset++] = 0x0C;
	buf[offset++] = labelLen; // Label-Data-Length
	strncpy((char *)&buf[offset], label, labelLen);
	offset += labelLen;
	memcpy(&buf[offset], label_end_data, label_end_data_size);
	offset += label_end_data_size;	
	
	// Key ID
	int idLen = strlen(id);
	uint8_t id_end_data[] = {
        0x03, 0x02, 0x04, 0x74, // Private Key Attribute, Sign
        0x03, 0x02, 0x03, 0xB8,
        0x02, 0x01, 0x00        // Key index
    };
	id_end_data[10] = fid & 0xff;  // Key index
	buf[offset++] = 0x30;
	buf[offset++] = idLen + 2 + sizeof(id_end_data);   // Label-Length
	buf[offset++] = 0x04;
	buf[offset++] = idLen; // Label-Data-Length
	strncpy((char *)&buf[offset], id, idLen);
	offset += idLen;
	memcpy(&buf[offset], id_end_data, sizeof(id_end_data));
	offset += sizeof(id_end_data);
	
	// Certificate
	certData = &buf[offset];
    uint8_t cert_data[] = {
        0xA0, 0x00,
        0x30, 0x00,
        0x30, 0x00,
    };
	memcpy(&buf[offset], cert_data, sizeof(cert_data));
	offset += sizeof(cert_data);
	
	// Common
    uint8_t common_end_data[] = {
        0x06, 0x03, 0x55, 0x04, 0x03,
        0x0C, 0x00  // Common-Data-Length
                    // Common-Data ...
    };
	int commonSize = strlen(common);
	common_end_data[6] = commonSize;
	buf[offset++] = 0x31;
	buf[offset++] = commonSize + 2 + sizeof(common_end_data);   // Label-Length
	buf[offset++] = 0x30;
	buf[offset++] = commonSize + sizeof(common_end_data); // Label-Data-Length
	memcpy(&buf[offset], common_end_data, sizeof(common_end_data));
	offset += sizeof(common_end_data);
	strncpy((char *)&buf[offset], common, commonSize);
	offset += commonSize;
	
	// Email
	uint8_t email_end_data[] = {
        0x06, 0x09, 0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x09, 0x01,
        0x16, 0x00  // Email-Data-Length
                    // Email-Data ...
    };
	int emailSize = strlen(email);
	email_end_data[12] = emailSize;
	buf[offset++] = 0x31;
	buf[offset++] = emailSize + 2 + sizeof(email_end_data);   // Label-Length
	buf[offset++] = 0x30;
	buf[offset++] = emailSize + sizeof(email_end_data); // Label-Data-Length
	memcpy(&buf[offset], email_end_data, sizeof(email_end_data));
	offset += sizeof(email_end_data);
	strncpy((char *)&buf[offset], email, emailSize);
	offset += emailSize;
	
	// Certificate
	certData[5] = 4 + sizeof(common_end_data) + commonSize + 4 + sizeof(email_end_data) + emailSize;
	certData[3] = certData[5] + 2;
	certData[1] = certData[3] + 2;
	
	// Key Info
	uint8_t info_data[] = {
        0xA1, 0x0A, 0x30, 0x08,
        0x30, 0x02, 0x04, 0x00,
        0x02, 0x02, 0x08, 0x00  // Key size in bits
    };
	info_data[10] = keySizeinBit >> 8; // Key size in bits
	info_data[11] = keySizeinBit & 0xff; // Key size in bits
	memcpy(&buf[offset], info_data, sizeof(info_data));
	offset += sizeof(info_data);
	
	*lenByte = offset-3;
	return offset;
}

EMSCRIPTEN_KEEPALIVE
int readBinary(uint8_t *buf, int fid, int readOffset, int readSize) {
    uint8_t cmd_data[] = {
        CLA_00,
        INS_READ_BINARY,
        0x00, 0x00, 0x00, 0x00, // currently selected EF
        0x04,
        0x54, 0x02,
        0x00, 0x00, // Data-Offset
        0x00, 0x00  // Number of bytes expected in response
                    // 0x00, 0x00 in extended APDU is up to 65536.
                    // 0x06, 0x6F 1782 bytes is max in CCID.
                    // 0x03, 0x00 768 bytes is max in UART. 
    };
	cmd_data[2] = fid >> 8;
	cmd_data[3] = fid & 0xff;
    cmd_data[9] = readOffset >> 8;
    cmd_data[10] = readOffset & 0xff;
    cmd_data[11] = readSize >> 8;
	cmd_data[12] = readSize & 0xff;
	
	
	memcpy(buf, cmd_data, sizeof(cmd_data));
	int ret = ctap_apdu_exchange(buf, sizeof(cmd_data), 2000);
	return ret;
}

EMSCRIPTEN_KEEPALIVE
int updateBinary(uint8_t *buf, int fid, int offset, uint8_t *data, int dataSize) {
    uint8_t cmd_data[] = {
        CLA_00,
        INS_UPDATE_BINARY,
        0x00, 0x00,         // FID
        0x00, 0x00, 0x00,   // C-Data-Length
        0x54, 0x02,
        0x00, 0x00, // Data-Offset
        0x53, 0x00,
    };
	int totalSize = dataSize + 6;
	cmd_data[2] = fid >> 8;
	cmd_data[3] = fid & 0xff;
	cmd_data[5] = totalSize >> 8;
	cmd_data[6] = totalSize & 0xff;
    cmd_data[9] = offset >> 8;
    cmd_data[10] = offset & 0xff;
	
	memcpy(buf, cmd_data, sizeof(cmd_data));
	memcpy(&buf[13], data, dataSize);
	int ret = ctap_apdu_exchange(buf, dataSize + 13, 2000);
	return ret;
}


#ifdef __cplusplus
}
#endif