console.log("done!");

const importObject = {
    env: {
        __memory_base: 0,
        __table_base: 0,
        memory: new WebAssembly.Memory({ initial: 1, maximum: 10 })
        //책에는 없는 2줄 
    }
};
//웹 어셈블리 웹 API
WebAssembly.instantiateStreaming(fetch("side_module.wasm"), importObject).then(
    //파일 불러오기 성공 시 실행되는 콜백 함수, result를 매개변수로 받고, 객체를 return 
    result => {
        const value = result.instance.exports.Increment(17);
        console.log(value.toString());
    }
);
