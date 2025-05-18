#!/bin/bash

GOOS=js GOARCH=wasm go build -o main.wasm
cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" .
echo $(go env GOROOT)/lib/wasm/wasm_exec.js
cp main.wasm ../public
cp wasm_exec.js ../src