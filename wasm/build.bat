emcc %~dp0smartCardHsmApdu.c -O3 -s WASM=1 -s "EXPORTED_RUNTIME_METHODS=['ccall','cwrap']" -s EXPORTED_FUNCTIONS="['_free', '_malloc']" -o %~dp0smartCardHsmApdu.wasm -o %~dp0smartCardHsmApdu.js --js-library %~dp0ctapApduExchange.js -s ASYNCIFY -s "ASYNCIFY_IMPORTS=['ctap_apdu_exchange']" 