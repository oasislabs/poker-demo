cargo build --target wasm32-unknown-unknown --release && \
mkdir -p bindings && \
wasm-bindgen target/wasm32-unknown-unknown/release/client.wasm --out-dir bindings && \
sed -i "s/client_bg/client_bg.wasm/g" bindings/client.js
