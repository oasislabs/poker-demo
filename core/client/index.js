const bindings = import('./bindings/client.js');
bindings.then(b => { window.bindings = b })

export default bindings;
