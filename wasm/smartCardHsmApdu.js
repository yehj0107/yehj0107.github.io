var Module=typeof Module!=="undefined"?Module:{};var moduleOverrides={};var key;for(key in Module){if(Module.hasOwnProperty(key)){moduleOverrides[key]=Module[key]}}var arguments_=[];var thisProgram="./this.program";var quit_=function(status,toThrow){throw toThrow};var ENVIRONMENT_IS_WEB=false;var ENVIRONMENT_IS_WORKER=false;var ENVIRONMENT_IS_NODE=false;var ENVIRONMENT_IS_SHELL=false;ENVIRONMENT_IS_WEB=typeof window==="object";ENVIRONMENT_IS_WORKER=typeof importScripts==="function";ENVIRONMENT_IS_NODE=typeof process==="object"&&typeof process.versions==="object"&&typeof process.versions.node==="string";ENVIRONMENT_IS_SHELL=!ENVIRONMENT_IS_WEB&&!ENVIRONMENT_IS_NODE&&!ENVIRONMENT_IS_WORKER;var scriptDirectory="";function locateFile(path){if(Module["locateFile"]){return Module["locateFile"](path,scriptDirectory)}return scriptDirectory+path}var read_,readAsync,readBinary,setWindowTitle;var nodeFS;var nodePath;if(ENVIRONMENT_IS_NODE){if(ENVIRONMENT_IS_WORKER){scriptDirectory=require("path").dirname(scriptDirectory)+"/"}else{scriptDirectory=__dirname+"/"}read_=function shell_read(filename,binary){if(!nodeFS)nodeFS=require("fs");if(!nodePath)nodePath=require("path");filename=nodePath["normalize"](filename);return nodeFS["readFileSync"](filename,binary?null:"utf8")};readBinary=function readBinary(filename){var ret=read_(filename,true);if(!ret.buffer){ret=new Uint8Array(ret)}assert(ret.buffer);return ret};if(process["argv"].length>1){thisProgram=process["argv"][1].replace(/\\/g,"/")}arguments_=process["argv"].slice(2);if(typeof module!=="undefined"){module["exports"]=Module}process["on"]("uncaughtException",function(ex){if(!(ex instanceof ExitStatus)){throw ex}});process["on"]("unhandledRejection",abort);quit_=function(status){process["exit"](status)};Module["inspect"]=function(){return"[Emscripten Module object]"}}else if(ENVIRONMENT_IS_SHELL){if(typeof read!="undefined"){read_=function shell_read(f){return read(f)}}readBinary=function readBinary(f){var data;if(typeof readbuffer==="function"){return new Uint8Array(readbuffer(f))}data=read(f,"binary");assert(typeof data==="object");return data};if(typeof scriptArgs!="undefined"){arguments_=scriptArgs}else if(typeof arguments!="undefined"){arguments_=arguments}if(typeof quit==="function"){quit_=function(status){quit(status)}}if(typeof print!=="undefined"){if(typeof console==="undefined")console={};console.log=print;console.warn=console.error=typeof printErr!=="undefined"?printErr:print}}else if(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER){if(ENVIRONMENT_IS_WORKER){scriptDirectory=self.location.href}else if(typeof document!=="undefined"&&document.currentScript){scriptDirectory=document.currentScript.src}if(scriptDirectory.indexOf("blob:")!==0){scriptDirectory=scriptDirectory.substr(0,scriptDirectory.lastIndexOf("/")+1)}else{scriptDirectory=""}{read_=function(url){var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.send(null);return xhr.responseText};if(ENVIRONMENT_IS_WORKER){readBinary=function(url){var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.responseType="arraybuffer";xhr.send(null);return new Uint8Array(xhr.response)}}readAsync=function(url,onload,onerror){var xhr=new XMLHttpRequest;xhr.open("GET",url,true);xhr.responseType="arraybuffer";xhr.onload=function(){if(xhr.status==200||xhr.status==0&&xhr.response){onload(xhr.response);return}onerror()};xhr.onerror=onerror;xhr.send(null)}}setWindowTitle=function(title){document.title=title}}else{}var out=Module["print"]||console.log.bind(console);var err=Module["printErr"]||console.warn.bind(console);for(key in moduleOverrides){if(moduleOverrides.hasOwnProperty(key)){Module[key]=moduleOverrides[key]}}moduleOverrides=null;if(Module["arguments"])arguments_=Module["arguments"];if(Module["thisProgram"])thisProgram=Module["thisProgram"];if(Module["quit"])quit_=Module["quit"];var wasmBinary;if(Module["wasmBinary"])wasmBinary=Module["wasmBinary"];var noExitRuntime=Module["noExitRuntime"]||true;if(typeof WebAssembly!=="object"){abort("no native wasm support detected")}var wasmMemory;var ABORT=false;var EXITSTATUS;function assert(condition,text){if(!condition){abort("Assertion failed: "+text)}}function getCFunc(ident){var func=Module["_"+ident];assert(func,"Cannot call unknown function "+ident+", make sure it is exported");return func}function ccall(ident,returnType,argTypes,args,opts){var toC={"string":function(str){var ret=0;if(str!==null&&str!==undefined&&str!==0){var len=(str.length<<2)+1;ret=stackAlloc(len);stringToUTF8(str,ret,len)}return ret},"array":function(arr){var ret=stackAlloc(arr.length);writeArrayToMemory(arr,ret);return ret}};function convertReturnValue(ret){if(returnType==="string")return UTF8ToString(ret);if(returnType==="boolean")return Boolean(ret);return ret}var func=getCFunc(ident);var cArgs=[];var stack=0;if(args){for(var i=0;i<args.length;i++){var converter=toC[argTypes[i]];if(converter){if(stack===0)stack=stackSave();cArgs[i]=converter(args[i])}else{cArgs[i]=args[i]}}}var ret=func.apply(null,cArgs);var asyncMode=opts&&opts.async;var runningAsync=typeof Asyncify==="object"&&Asyncify.currData;var prevRunningAsync=typeof Asyncify==="object"&&Asyncify.asyncFinalizers.length>0;if(runningAsync&&!prevRunningAsync){return new Promise(function(resolve){Asyncify.asyncFinalizers.push(function(ret){if(stack!==0)stackRestore(stack);resolve(convertReturnValue(ret))})})}ret=convertReturnValue(ret);if(stack!==0)stackRestore(stack);if(opts&&opts.async)return Promise.resolve(ret);return ret}function cwrap(ident,returnType,argTypes,opts){argTypes=argTypes||[];var numericArgs=argTypes.every(function(type){return type==="number"});var numericRet=returnType!=="string";if(numericRet&&numericArgs&&!opts){return getCFunc(ident)}return function(){return ccall(ident,returnType,argTypes,arguments,opts)}}var UTF8Decoder=typeof TextDecoder!=="undefined"?new TextDecoder("utf8"):undefined;function UTF8ArrayToString(heap,idx,maxBytesToRead){var endIdx=idx+maxBytesToRead;var endPtr=idx;while(heap[endPtr]&&!(endPtr>=endIdx))++endPtr;if(endPtr-idx>16&&heap.subarray&&UTF8Decoder){return UTF8Decoder.decode(heap.subarray(idx,endPtr))}else{var str="";while(idx<endPtr){var u0=heap[idx++];if(!(u0&128)){str+=String.fromCharCode(u0);continue}var u1=heap[idx++]&63;if((u0&224)==192){str+=String.fromCharCode((u0&31)<<6|u1);continue}var u2=heap[idx++]&63;if((u0&240)==224){u0=(u0&15)<<12|u1<<6|u2}else{u0=(u0&7)<<18|u1<<12|u2<<6|heap[idx++]&63}if(u0<65536){str+=String.fromCharCode(u0)}else{var ch=u0-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023)}}}return str}function UTF8ToString(ptr,maxBytesToRead){return ptr?UTF8ArrayToString(HEAPU8,ptr,maxBytesToRead):""}function stringToUTF8Array(str,heap,outIdx,maxBytesToWrite){if(!(maxBytesToWrite>0))return 0;var startIdx=outIdx;var endIdx=outIdx+maxBytesToWrite-1;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343){var u1=str.charCodeAt(++i);u=65536+((u&1023)<<10)|u1&1023}if(u<=127){if(outIdx>=endIdx)break;heap[outIdx++]=u}else if(u<=2047){if(outIdx+1>=endIdx)break;heap[outIdx++]=192|u>>6;heap[outIdx++]=128|u&63}else if(u<=65535){if(outIdx+2>=endIdx)break;heap[outIdx++]=224|u>>12;heap[outIdx++]=128|u>>6&63;heap[outIdx++]=128|u&63}else{if(outIdx+3>=endIdx)break;heap[outIdx++]=240|u>>18;heap[outIdx++]=128|u>>12&63;heap[outIdx++]=128|u>>6&63;heap[outIdx++]=128|u&63}}heap[outIdx]=0;return outIdx-startIdx}function stringToUTF8(str,outPtr,maxBytesToWrite){return stringToUTF8Array(str,HEAPU8,outPtr,maxBytesToWrite)}function writeArrayToMemory(array,buffer){HEAP8.set(array,buffer)}var buffer,HEAP8,HEAPU8,HEAP16,HEAPU16,HEAP32,HEAPU32,HEAPF32,HEAPF64;function updateGlobalBufferAndViews(buf){buffer=buf;Module["HEAP8"]=HEAP8=new Int8Array(buf);Module["HEAP16"]=HEAP16=new Int16Array(buf);Module["HEAP32"]=HEAP32=new Int32Array(buf);Module["HEAPU8"]=HEAPU8=new Uint8Array(buf);Module["HEAPU16"]=HEAPU16=new Uint16Array(buf);Module["HEAPU32"]=HEAPU32=new Uint32Array(buf);Module["HEAPF32"]=HEAPF32=new Float32Array(buf);Module["HEAPF64"]=HEAPF64=new Float64Array(buf)}var INITIAL_MEMORY=Module["INITIAL_MEMORY"]||16777216;var wasmTable;var __ATPRERUN__=[];var __ATINIT__=[];var __ATPOSTRUN__=[];var runtimeInitialized=false;function preRun(){if(Module["preRun"]){if(typeof Module["preRun"]=="function")Module["preRun"]=[Module["preRun"]];while(Module["preRun"].length){addOnPreRun(Module["preRun"].shift())}}callRuntimeCallbacks(__ATPRERUN__)}function initRuntime(){runtimeInitialized=true;callRuntimeCallbacks(__ATINIT__)}function postRun(){if(Module["postRun"]){if(typeof Module["postRun"]=="function")Module["postRun"]=[Module["postRun"]];while(Module["postRun"].length){addOnPostRun(Module["postRun"].shift())}}callRuntimeCallbacks(__ATPOSTRUN__)}function addOnPreRun(cb){__ATPRERUN__.unshift(cb)}function addOnInit(cb){__ATINIT__.unshift(cb)}function addOnPostRun(cb){__ATPOSTRUN__.unshift(cb)}var runDependencies=0;var runDependencyWatcher=null;var dependenciesFulfilled=null;function addRunDependency(id){runDependencies++;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies)}}function removeRunDependency(id){runDependencies--;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies)}if(runDependencies==0){if(runDependencyWatcher!==null){clearInterval(runDependencyWatcher);runDependencyWatcher=null}if(dependenciesFulfilled){var callback=dependenciesFulfilled;dependenciesFulfilled=null;callback()}}}Module["preloadedImages"]={};Module["preloadedAudios"]={};function abort(what){if(Module["onAbort"]){Module["onAbort"](what)}what+="";err(what);ABORT=true;EXITSTATUS=1;what="abort("+what+"). Build with -s ASSERTIONS=1 for more info.";var e=new WebAssembly.RuntimeError(what);throw e}var dataURIPrefix="data:application/octet-stream;base64,";function isDataURI(filename){return filename.startsWith(dataURIPrefix)}function isFileURI(filename){return filename.startsWith("file://")}var wasmBinaryFile="smartCardHsmApdu.wasm";if(!isDataURI(wasmBinaryFile)){wasmBinaryFile=locateFile(wasmBinaryFile)}function getBinary(file){try{if(file==wasmBinaryFile&&wasmBinary){return new Uint8Array(wasmBinary)}if(readBinary){return readBinary(file)}else{throw"both async and sync fetching of the wasm failed"}}catch(err){abort(err)}}function getBinaryPromise(){if(!wasmBinary&&(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER)){if(typeof fetch==="function"&&!isFileURI(wasmBinaryFile)){return fetch(wasmBinaryFile,{credentials:"same-origin"}).then(function(response){if(!response["ok"]){throw"failed to load wasm binary file at '"+wasmBinaryFile+"'"}return response["arrayBuffer"]()}).catch(function(){return getBinary(wasmBinaryFile)})}else{if(readAsync){return new Promise(function(resolve,reject){readAsync(wasmBinaryFile,function(response){resolve(new Uint8Array(response))},reject)})}}}return Promise.resolve().then(function(){return getBinary(wasmBinaryFile)})}function createWasm(){var info={"a":asmLibraryArg};function receiveInstance(instance,module){var exports=instance.exports;exports=Asyncify.instrumentWasmExports(exports);Module["asm"]=exports;wasmMemory=Module["asm"]["e"];updateGlobalBufferAndViews(wasmMemory.buffer);wasmTable=Module["asm"]["O"];addOnInit(Module["asm"]["f"]);removeRunDependency("wasm-instantiate")}addRunDependency("wasm-instantiate");function receiveInstantiationResult(result){receiveInstance(result["instance"])}function instantiateArrayBuffer(receiver){return getBinaryPromise().then(function(binary){var result=WebAssembly.instantiate(binary,info);return result}).then(receiver,function(reason){err("failed to asynchronously prepare wasm: "+reason);abort(reason)})}function instantiateAsync(){if(!wasmBinary&&typeof WebAssembly.instantiateStreaming==="function"&&!isDataURI(wasmBinaryFile)&&!isFileURI(wasmBinaryFile)&&typeof fetch==="function"){return fetch(wasmBinaryFile,{credentials:"same-origin"}).then(function(response){var result=WebAssembly.instantiateStreaming(response,info);return result.then(receiveInstantiationResult,function(reason){err("wasm streaming compile failed: "+reason);err("falling back to ArrayBuffer instantiation");return instantiateArrayBuffer(receiveInstantiationResult)})})}else{return instantiateArrayBuffer(receiveInstantiationResult)}}if(Module["instantiateWasm"]){try{var exports=Module["instantiateWasm"](info,receiveInstance);exports=Asyncify.instrumentWasmExports(exports);return exports}catch(e){err("Module.instantiateWasm callback failed with error: "+e);return false}}instantiateAsync();return{}}function callRuntimeCallbacks(callbacks){while(callbacks.length>0){var callback=callbacks.shift();if(typeof callback=="function"){callback(Module);continue}var func=callback.func;if(typeof func==="number"){if(callback.arg===undefined){(function(){dynCall_v.call(null,func)})()}else{(function(a1){dynCall_vi.apply(null,[func,a1])})(callback.arg)}}else{func(callback.arg===undefined?null:callback.arg)}}}function _ctap_apdu_exchange(data,size,timeout){return Asyncify.handleSleep(wakeUp=>{var challenge=window.crypto.getRandomValues(new Uint8Array(32));var keyhandle=new Uint8Array(191);keyhandle.fill(255);var apdu=new Uint8Array(Module.HEAPU8.buffer,data,size);var c=new Uint8Array(2);c[0]=144;c[1]=0;var pkg_keyhandle=new Uint8Array(size+6);pkg_keyhandle[0]=75;pkg_keyhandle[1]=88;pkg_keyhandle[2]=65;pkg_keyhandle[3]=80;pkg_keyhandle[4]=68;pkg_keyhandle[5]=85;pkg_keyhandle.set(apdu,6);var request_options={challenge:challenge,allowCredentials:[{id:pkg_keyhandle,type:"public-key"}],timeout:6e4,userVerification:"discouraged"};navigator.credentials.get({publicKey:request_options}).then(assertion=>{var signature=new Uint8Array(assertion.response.signature);Module.HEAPU8.set(signature,data);wakeUp(signature.length)}).catch(error=>{console.log("THE ERROR:",error);Module.HEAPU8.set(c,data);wakeUp(-1)})})}function _emscripten_memcpy_big(dest,src,num){HEAPU8.copyWithin(dest,src,src+num)}function abortOnCannotGrowMemory(requestedSize){abort("OOM")}function _emscripten_resize_heap(requestedSize){var oldSize=HEAPU8.length;requestedSize=requestedSize>>>0;abortOnCannotGrowMemory(requestedSize)}var SYSCALLS={mappings:{},buffers:[null,[],[]],printChar:function(stream,curr){var buffer=SYSCALLS.buffers[stream];if(curr===0||curr===10){(stream===1?out:err)(UTF8ArrayToString(buffer,0));buffer.length=0}else{buffer.push(curr)}},varargs:undefined,get:function(){SYSCALLS.varargs+=4;var ret=HEAP32[SYSCALLS.varargs-4>>2];return ret},getStr:function(ptr){var ret=UTF8ToString(ptr);return ret},get64:function(low,high){return low}};function _fd_write(fd,iov,iovcnt,pnum){var num=0;for(var i=0;i<iovcnt;i++){var ptr=HEAP32[iov+i*8>>2];var len=HEAP32[iov+(i*8+4)>>2];for(var j=0;j<len;j++){SYSCALLS.printChar(fd,HEAPU8[ptr+j])}num+=len}HEAP32[pnum>>2]=num;return 0}function runAndAbortIfError(func){try{return func()}catch(e){abort(e)}}var Asyncify={State:{Normal:0,Unwinding:1,Rewinding:2},state:0,StackSize:4096,currData:null,handleSleepReturnValue:0,exportCallStack:[],callStackNameToId:{},callStackIdToName:{},callStackId:0,afterUnwind:null,asyncFinalizers:[],sleepCallbacks:[],getCallStackId:function(funcName){var id=Asyncify.callStackNameToId[funcName];if(id===undefined){id=Asyncify.callStackId++;Asyncify.callStackNameToId[funcName]=id;Asyncify.callStackIdToName[id]=funcName}return id},instrumentWasmExports:function(exports){var ret={};for(var x in exports){(function(x){var original=exports[x];if(typeof original==="function"){ret[x]=function(){Asyncify.exportCallStack.push(x);try{return original.apply(null,arguments)}finally{if(ABORT)return;var y=Asyncify.exportCallStack.pop();assert(y===x);Asyncify.maybeStopUnwind()}}}else{ret[x]=original}})(x)}return ret},maybeStopUnwind:function(){if(Asyncify.currData&&Asyncify.state===Asyncify.State.Unwinding&&Asyncify.exportCallStack.length===0){Asyncify.state=Asyncify.State.Normal;runAndAbortIfError(Module["_asyncify_stop_unwind"]);if(typeof Fibers!=="undefined"){Fibers.trampoline()}if(Asyncify.afterUnwind){Asyncify.afterUnwind();Asyncify.afterUnwind=null}}},allocateData:function(){var ptr=_malloc(12+Asyncify.StackSize);Asyncify.setDataHeader(ptr,ptr+12,Asyncify.StackSize);Asyncify.setDataRewindFunc(ptr);return ptr},setDataHeader:function(ptr,stack,stackSize){HEAP32[ptr>>2]=stack;HEAP32[ptr+4>>2]=stack+stackSize},setDataRewindFunc:function(ptr){var bottomOfCallStack=Asyncify.exportCallStack[0];var rewindId=Asyncify.getCallStackId(bottomOfCallStack);HEAP32[ptr+8>>2]=rewindId},getDataRewindFunc:function(ptr){var id=HEAP32[ptr+8>>2];var name=Asyncify.callStackIdToName[id];var func=Module["asm"][name];return func},handleSleep:function(startAsync){if(ABORT)return;noExitRuntime=true;if(Asyncify.state===Asyncify.State.Normal){var reachedCallback=false;var reachedAfterCallback=false;startAsync(function(handleSleepReturnValue){if(ABORT)return;Asyncify.handleSleepReturnValue=handleSleepReturnValue||0;reachedCallback=true;if(!reachedAfterCallback){return}Asyncify.state=Asyncify.State.Rewinding;runAndAbortIfError(function(){Module["_asyncify_start_rewind"](Asyncify.currData)});if(typeof Browser!=="undefined"&&Browser.mainLoop.func){Browser.mainLoop.resume()}var start=Asyncify.getDataRewindFunc(Asyncify.currData);var asyncWasmReturnValue=start();if(!Asyncify.currData){var asyncFinalizers=Asyncify.asyncFinalizers;Asyncify.asyncFinalizers=[];asyncFinalizers.forEach(function(func){func(asyncWasmReturnValue)})}});reachedAfterCallback=true;if(!reachedCallback){Asyncify.state=Asyncify.State.Unwinding;Asyncify.currData=Asyncify.allocateData();runAndAbortIfError(function(){Module["_asyncify_start_unwind"](Asyncify.currData)});if(typeof Browser!=="undefined"&&Browser.mainLoop.func){Browser.mainLoop.pause()}}}else if(Asyncify.state===Asyncify.State.Rewinding){Asyncify.state=Asyncify.State.Normal;runAndAbortIfError(Module["_asyncify_stop_rewind"]);_free(Asyncify.currData);Asyncify.currData=null;Asyncify.sleepCallbacks.forEach(function(func){func()})}else{abort("invalid state: "+Asyncify.state)}return Asyncify.handleSleepReturnValue},handleAsync:function(startAsync){return Asyncify.handleSleep(function(wakeUp){startAsync().then(wakeUp)})}};var asmLibraryArg={"a":_ctap_apdu_exchange,"d":_emscripten_memcpy_big,"c":_emscripten_resize_heap,"b":_fd_write};var asm=createWasm();var ___wasm_call_ctors=Module["___wasm_call_ctors"]=function(){return(___wasm_call_ctors=Module["___wasm_call_ctors"]=Module["asm"]["f"]).apply(null,arguments)};var _getApiVersion=Module["_getApiVersion"]=function(){return(_getApiVersion=Module["_getApiVersion"]=Module["asm"]["g"]).apply(null,arguments)};var _wasmTestPrint=Module["_wasmTestPrint"]=function(){return(_wasmTestPrint=Module["_wasmTestPrint"]=Module["asm"]["h"]).apply(null,arguments)};var _apduExchange=Module["_apduExchange"]=function(){return(_apduExchange=Module["_apduExchange"]=Module["asm"]["i"]).apply(null,arguments)};var _selectHsmApplet=Module["_selectHsmApplet"]=function(){return(_selectHsmApplet=Module["_selectHsmApplet"]=Module["asm"]["j"]).apply(null,arguments)};var _selectObject=Module["_selectObject"]=function(){return(_selectObject=Module["_selectObject"]=Module["asm"]["k"]).apply(null,arguments)};var _createObject=Module["_createObject"]=function(){return(_createObject=Module["_createObject"]=Module["asm"]["l"]).apply(null,arguments)};var _deleteObject=Module["_deleteObject"]=function(){return(_deleteObject=Module["_deleteObject"]=Module["asm"]["m"]).apply(null,arguments)};var _enumerateObjects=Module["_enumerateObjects"]=function(){return(_enumerateObjects=Module["_enumerateObjects"]=Module["asm"]["n"]).apply(null,arguments)};var _initializeDevice=Module["_initializeDevice"]=function(){return(_initializeDevice=Module["_initializeDevice"]=Module["asm"]["o"]).apply(null,arguments)};var _importDKEKShare=Module["_importDKEKShare"]=function(){return(_importDKEKShare=Module["_importDKEKShare"]=Module["asm"]["p"]).apply(null,arguments)};var _queryDKEKStatus=Module["_queryDKEKStatus"]=function(){return(_queryDKEKStatus=Module["_queryDKEKStatus"]=Module["asm"]["q"]).apply(null,arguments)};var _verifyUserPin=Module["_verifyUserPin"]=function(){return(_verifyUserPin=Module["_verifyUserPin"]=Module["asm"]["r"]).apply(null,arguments)};var _verifyUserPinStatus=Module["_verifyUserPinStatus"]=function(){return(_verifyUserPinStatus=Module["_verifyUserPinStatus"]=Module["asm"]["s"]).apply(null,arguments)};var _verifySoPinStatus=Module["_verifySoPinStatus"]=function(){return(_verifySoPinStatus=Module["_verifySoPinStatus"]=Module["asm"]["t"]).apply(null,arguments)};var _resetRetryCounter=Module["_resetRetryCounter"]=function(){return(_resetRetryCounter=Module["_resetRetryCounter"]=Module["asm"]["u"]).apply(null,arguments)};var _changeUserPin=Module["_changeUserPin"]=function(){return(_changeUserPin=Module["_changeUserPin"]=Module["asm"]["v"]).apply(null,arguments)};var _changeSoPin=Module["_changeSoPin"]=function(){return(_changeSoPin=Module["_changeSoPin"]=Module["asm"]["w"]).apply(null,arguments)};var _changeUserPinBySoPin=Module["_changeUserPinBySoPin"]=function(){return(_changeUserPinBySoPin=Module["_changeUserPinBySoPin"]=Module["asm"]["x"]).apply(null,arguments)};var _generateRandomNumber=Module["_generateRandomNumber"]=function(){return(_generateRandomNumber=Module["_generateRandomNumber"]=Module["asm"]["y"]).apply(null,arguments)};var _generateRsaSignature=Module["_generateRsaSignature"]=function(){return(_generateRsaSignature=Module["_generateRsaSignature"]=Module["asm"]["z"]).apply(null,arguments)};var _generateEccSignature=Module["_generateEccSignature"]=function(){return(_generateEccSignature=Module["_generateEccSignature"]=Module["asm"]["A"]).apply(null,arguments)};var _generateRsaDecrypt=Module["_generateRsaDecrypt"]=function(){return(_generateRsaDecrypt=Module["_generateRsaDecrypt"]=Module["asm"]["B"]).apply(null,arguments)};var _generateECDH=Module["_generateECDH"]=function(){return(_generateECDH=Module["_generateECDH"]=Module["asm"]["C"]).apply(null,arguments)};var _wrapKey=Module["_wrapKey"]=function(){return(_wrapKey=Module["_wrapKey"]=Module["asm"]["D"]).apply(null,arguments)};var _unWrapKey=Module["_unWrapKey"]=function(){return(_unWrapKey=Module["_unWrapKey"]=Module["asm"]["E"]).apply(null,arguments)};var _generateRsaAsymmetricKeyPair=Module["_generateRsaAsymmetricKeyPair"]=function(){return(_generateRsaAsymmetricKeyPair=Module["_generateRsaAsymmetricKeyPair"]=Module["asm"]["F"]).apply(null,arguments)};var _generateEccAsymmetricKeyPair=Module["_generateEccAsymmetricKeyPair"]=function(){return(_generateEccAsymmetricKeyPair=Module["_generateEccAsymmetricKeyPair"]=Module["asm"]["G"]).apply(null,arguments)};var _generateRsaPrivateKeyInfo=Module["_generateRsaPrivateKeyInfo"]=function(){return(_generateRsaPrivateKeyInfo=Module["_generateRsaPrivateKeyInfo"]=Module["asm"]["H"]).apply(null,arguments)};var _generateEccPrivateKeyInfo=Module["_generateEccPrivateKeyInfo"]=function(){return(_generateEccPrivateKeyInfo=Module["_generateEccPrivateKeyInfo"]=Module["asm"]["I"]).apply(null,arguments)};var _generateDataContainerInfo=Module["_generateDataContainerInfo"]=function(){return(_generateDataContainerInfo=Module["_generateDataContainerInfo"]=Module["asm"]["J"]).apply(null,arguments)};var _generateCertContainerInfo=Module["_generateCertContainerInfo"]=function(){return(_generateCertContainerInfo=Module["_generateCertContainerInfo"]=Module["asm"]["K"]).apply(null,arguments)};var _generateCertPrivateKeyInfo=Module["_generateCertPrivateKeyInfo"]=function(){return(_generateCertPrivateKeyInfo=Module["_generateCertPrivateKeyInfo"]=Module["asm"]["L"]).apply(null,arguments)};var _readBinary=Module["_readBinary"]=function(){return(_readBinary=Module["_readBinary"]=Module["asm"]["M"]).apply(null,arguments)};var _updateBinary=Module["_updateBinary"]=function(){return(_updateBinary=Module["_updateBinary"]=Module["asm"]["N"]).apply(null,arguments)};var stackSave=Module["stackSave"]=function(){return(stackSave=Module["stackSave"]=Module["asm"]["P"]).apply(null,arguments)};var stackRestore=Module["stackRestore"]=function(){return(stackRestore=Module["stackRestore"]=Module["asm"]["Q"]).apply(null,arguments)};var stackAlloc=Module["stackAlloc"]=function(){return(stackAlloc=Module["stackAlloc"]=Module["asm"]["R"]).apply(null,arguments)};var _malloc=Module["_malloc"]=function(){return(_malloc=Module["_malloc"]=Module["asm"]["S"]).apply(null,arguments)};var _free=Module["_free"]=function(){return(_free=Module["_free"]=Module["asm"]["T"]).apply(null,arguments)};var _asyncify_start_unwind=Module["_asyncify_start_unwind"]=function(){return(_asyncify_start_unwind=Module["_asyncify_start_unwind"]=Module["asm"]["U"]).apply(null,arguments)};var _asyncify_stop_unwind=Module["_asyncify_stop_unwind"]=function(){return(_asyncify_stop_unwind=Module["_asyncify_stop_unwind"]=Module["asm"]["V"]).apply(null,arguments)};var _asyncify_start_rewind=Module["_asyncify_start_rewind"]=function(){return(_asyncify_start_rewind=Module["_asyncify_start_rewind"]=Module["asm"]["W"]).apply(null,arguments)};var _asyncify_stop_rewind=Module["_asyncify_stop_rewind"]=function(){return(_asyncify_stop_rewind=Module["_asyncify_stop_rewind"]=Module["asm"]["X"]).apply(null,arguments)};Module["ccall"]=ccall;Module["cwrap"]=cwrap;var calledRun;function ExitStatus(status){this.name="ExitStatus";this.message="Program terminated with exit("+status+")";this.status=status}dependenciesFulfilled=function runCaller(){if(!calledRun)run();if(!calledRun)dependenciesFulfilled=runCaller};function run(args){args=args||arguments_;if(runDependencies>0){return}preRun();if(runDependencies>0){return}function doRun(){if(calledRun)return;calledRun=true;Module["calledRun"]=true;if(ABORT)return;initRuntime();if(Module["onRuntimeInitialized"])Module["onRuntimeInitialized"]();postRun()}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout(function(){setTimeout(function(){Module["setStatus"]("")},1);doRun()},1)}else{doRun()}}Module["run"]=run;if(Module["preInit"]){if(typeof Module["preInit"]=="function")Module["preInit"]=[Module["preInit"]];while(Module["preInit"].length>0){Module["preInit"].pop()()}}run();
