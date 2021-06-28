#pragma once

// Biometric Authentication
#define BIOMETRIC_AUTHENTICATION_FIRST_TEMPLATE     0x85
#define BIOMETRIC_AUTHENTICATION_SECOND_TEMPLATE    0x86

// CLA: Class
#define CLA_00  0x00
#define CLA_0C  0x0C
#define CLA_80  0x80
#define CLA_8C  0x8C

// INS: Instruction
#define INS_SELECT                              0xA4
#define INS_READ_BINARY                         0xB1
#define INS_UPDATE_BINARY                       0xD7
#define INS_ENUMERATE_OBJECTS                   0x58
#define INS_DELETE_FILE                         0xE4
#define INS_GENERATE_ASYMMETRIC_KEY_PAIR        0x46
#define INS_GET_CHALLENGE                       0x84
#define INS_DECIPHER                            0x62
#define INS_SIGN                                0x68
#define INS_WRAP_KEY                            0x72
#define INS_UNWRAP_KEY                          0x74
#define INS_VERIFY                              0x20
#define INS_CHANGE_REFERENCE_DATA               0x24
#define INS_RESET_RETRY_COUNTER                 0x2C
#define INS_GENERATE_SESSION_PIN                0x5A
#define INS_MANAGE_SECURITY_ENVIRONMENT         0x22
#define INS_GENERAL_AUTHENTICATE                0x86
#define INS_PERFORM_SECURITY_OPERATION          0x2A
#define INS_EXTERNAL_AUTHENTICATE               0x82
#define INS_INITIALIZE_DEVICE                   0x50
#define INS_IMPORT_DKEK_SHARE                   0x52
#define INS_MANAGE_PUBLIC_KEY_AUTHENTICATION    0x54

// EC Key curve definition
#define EC_KEY_CURVE_SECP192R1					0x01
#define EC_KEY_CURVE_SECP256R1					0x02
#define EC_KEY_CURVE_BRAINPOOL192R1				0x03
#define EC_KEY_CURVE_BRAINPOOL224R1				0x04
#define EC_KEY_CURVE_BRAINPOOL256R1				0x05
#define EC_KEY_CURVE_BRAINPOOL320R1				0x06
#define EC_KEY_CURVE_SECP19K1					0x07
#define EC_KEY_CURVE_SECP256K1					0x08
