const initialData = {
    name: "Women's Mid Rise Skinny Jeans",
    categoryId: "100",
};

const MAXIMUM_NAME_LENGTH = 50;
const VALID_CATEGORY_IDS = [100, 101];

let validateOnSuccessNameIndex = -1;
let validateOnSuccessCategoryIndex = -1;
let validateOnErrorNameIndex = -1;
let validateOnErrorCategoryIndex = -1;

let validateNameCallbacks = { resolve: null, reject: null };
let validateCategoryCallbacks = { resolve: null, reject: null };

let moduleMemory = null;
let moduleExports = null;
let moduleTable = null;

function initializePage() {
    document.getElementById("name").value = initialData.name;

    const category = document.getElementById("category");
    const count = category.length;
    for (let index = 0; index < count; index++) {
        if (category[index].value === initialData.categoryId) {
            category.selectedIndex = index;
            break;
        }
    }

    const importObject = {
        wasi_snapshot_preview1: {
            proc_exit: (value) => { }
        }
    };

    WebAssembly.instantiateStreaming(fetch("validate.wasm"), importObject).then(result => {
        moduleExports = result.instance.exports;
        moduleMemory = moduleExports.memory;
        moduleTable = moduleExports.__indirect_function_table;

        validateOnSuccessNameIndex = addToTable(() => {
            onSuccessCallback(validateNameCallbacks);
        }, 'v');

        validateOnSuccessCategoryIndex = addToTable(() => {
            onSuccessCallback(validateCategoryCallbacks);
        }, 'v');

        validateOnErrorNameIndex = addToTable((errorMessagePointer) => {
            onErrorCallback(validateNameCallbacks, errorMessagePointer);
        }, 'vi');

        validateOnErrorCategoryIndex = addToTable((errorMessagePointer) => {
            onErrorCallback(validateCategoryCallbacks, errorMessagePointer);
        }, 'vi');
    });
}

function addToTable(jsFunction, signature) {
    
    const index = moduleTable.length;


    moduleTable.grow(1);
    moduleTable.set(index, convertJsFunctionToWasm(jsFunction, signature));

    // Tell the caller the index of JavaScript function in the Table
    return index;
}

// validate.js 내부 헬퍼 함수 복사 (/Web-Assembly-Practice-code/static/chapter6/6-1/frontend/) 
function convertJsFunctionToWasm(func, sig) {
    // The module is static, with the exception of the type section, which is
    // generated based on the signature passed in.
    var typeSection = [
        0x01, // id: section,
        0x00, // length: 0 (placeholder)
        0x01, // count: 1
        0x60, // form: func
    ];
    var sigRet = sig.slice(0, 1);
    var sigParam = sig.slice(1);
    var typeCodes = {
        'i': 0x7f, // i32
        'j': 0x7e, // i64
        'f': 0x7d, // f32
        'd': 0x7c, // f64
    };

    // Parameters, length + signatures
    typeSection.push(sigParam.length);
    for (var i = 0; i < sigParam.length; ++i) {
        typeSection.push(typeCodes[sigParam[i]]);
    }

    // Return values, length + signatures
    // With no multi-return in MVP, either 0 (void) or 1 (anything else)
    if (sigRet == 'v') {
        typeSection.push(0x00);
    } else {
        typeSection = typeSection.concat([0x01, typeCodes[sigRet]]);
    }

    // Write the overall length of the type section back into the section header
    // (excepting the 2 bytes for the section id and length)
    typeSection[1] = typeSection.length - 2;

    // Rest of the module is static
    var bytes = new Uint8Array([
        0x00, 0x61, 0x73, 0x6d, // magic ("\0asm")
        0x01, 0x00, 0x00, 0x00, // version: 1
    ].concat(typeSection, [
        0x02, 0x07, // import section
        // (import "e" "f" (func 0 (type 0)))
        0x01, 0x01, 0x65, 0x01, 0x66, 0x00, 0x00,
        0x07, 0x05, // export section
        // (export "f" (func 0 (type 0)))
        0x01, 0x01, 0x66, 0x00, 0x00,
    ]));

    // 작은 모듈이므로 동기적으로 컴파일하고 모듈화 가능함
    // This accepts an import (at "e.f"), that it reroutes to an export (at "f")
    var module = new WebAssembly.Module(bytes);
    var instance = new WebAssembly.Instance(module, {
        e: {
            f: func
        }
    });
    var wrappedFunc = instance.exports.f;
    return wrappedFunc;
}

function onSuccessCallback(validateCallbacks) {
    
    validateCallbacks.resolve();
    validateCallbacks.resolve = null;
    validateCallbacks.reject = null;
}

function onErrorCallback(validateCallbacks, errorMessagePointer) {
    //모듈 메모리로 부터 저장된 문자열 읽음
    const errorMessage = getStringFromMemory(errorMessagePointer);

    validateCallbacks.reject(errorMessage);
    validateCallbacks.resolve = null;
    validateCallbacks.reject = null;
}

function getSelectedCategoryId() {
    const category = document.getElementById("category");
    const index = category.selectedIndex;
    if (index !== -1) { return category[index].value; }

    return "0";
}

function setErrorMessage(error) {
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.innerText = error;
    errorMessage.style.display = (error === "" ? "none" : "");
}

function onClickSave() {
    
    setErrorMessage("");

    const name = document.getElementById("name").value;
    const categoryId = getSelectedCategoryId();

    Promise.all([
        validateName(name),
        validateCategory(categoryId)
    ])
        .then(() => {
            
        })
        .catch((error) => {
            setErrorMessage(error);
        });
}

function createPointers(isForName, resolve, reject, returnPointers) {
    if (isForName) {
        validateNameCallbacks.resolve = resolve;
        validateNameCallbacks.reject = reject;

        returnPointers.onSuccess = validateOnSuccessNameIndex;
        returnPointers.onError = validateOnErrorNameIndex;
    } else {
        validateCategoryCallbacks.resolve = resolve;
        validateCategoryCallbacks.reject = reject;

        returnPointers.onSuccess = validateOnSuccessCategoryIndex;
        returnPointers.onError = validateOnErrorCategoryIndex;
    }
}

function getStringFromMemory(memoryOffset) {
    let returnValue = "";

    const size = 256;
    const bytes = new Uint8Array(moduleMemory.buffer, memoryOffset, size);

    let character = "";
    for (let i = 0; i < size; i++) {
        character = String.fromCharCode(bytes[i]);
        if (character === "\0") { break; }

        returnValue += character;
    }

    return returnValue;
}

function copyStringToMemory(value, memoryOffset) {
    const bytes = new Uint8Array(moduleMemory.buffer);
    bytes.set(new TextEncoder().encode((value + "\0")), memoryOffset);
}

function validateName(name) {
    return new Promise(function (resolve, reject) {

        const pointers = { onSuccess: null, onError: null };
        createPointers(true, resolve, reject, pointers);

        const namePointer = moduleExports.create_buffer((name.length + 1));
        copyStringToMemory(name, namePointer);

        moduleExports.ValidateName(namePointer, MAXIMUM_NAME_LENGTH, pointers.onSuccess, pointers.onError);

        moduleExports.free_buffer(namePointer);
    });
}

function validateCategory(categoryId) {
    return new Promise(function (resolve, reject) {

        const pointers = { onSuccess: null, onError: null };
        createPointers(false, resolve, reject, pointers);

        const categoryIdPointer = moduleExports.create_buffer((categoryId.length + 1));
        copyStringToMemory(categoryId, categoryIdPointer);

        const arrayLength = VALID_CATEGORY_IDS.length;
        const bytesPerElement = Int32Array.BYTES_PER_ELEMENT;
        const arrayPointer = moduleExports.create_buffer((arrayLength * bytesPerElement));

        const bytesForArray = new Int32Array(moduleMemory.buffer);
        bytesForArray.set(VALID_CATEGORY_IDS, (arrayPointer / bytesPerElement));

        moduleExports.ValidateCategory(categoryIdPointer, arrayPointer, arrayLength, pointers.onSuccess, pointers.onError);

        moduleExports.free_buffer(arrayPointer);
        moduleExports.free_buffer(categoryIdPointer);
    });
}