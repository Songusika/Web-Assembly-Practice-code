const express = require("express");
const http = require('http');
const fs = require('fs');
const static = require('serve-static');
const app = new express();

const static_file_path = "jang3"

app.listen(3010, ()=> console.log("server started!")); //listen 메서드 서버 시작, 콜백함수는 시작할 떄, 호출

app.use('/static', express.static(__dirname + jang3));
