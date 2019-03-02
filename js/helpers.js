async function get_url_json(file_url) {
    let response = await fetch(file_url);
    let data = await response.blob();
    let metadata = {
      type: 'application/json'
    };
    let file = new File([data], "solo.json", metadata);
    return file;
}

function TEST(bool, test){
    if (bool) {
        if (test ) console.log("PASS: " + test);
    }
    else {
        console.log("FAIL: " + test);
        throw new Error("FAIL: " + test);
    }
}

function hex2array(string)
{
    if (string.slice(0,2) == '0x')
    {
        string = string.slice(2,string.length);
    }
    if (string.length & 1)
    {
        throw new Error('Odd length hex string');
    }
    let arr = new Uint8Array(string.length/2);
    var i;
    for (i = 0; i < string.length; i+=2)
    {
        arr[i/2] = parseInt(string.slice(i,i+2),16);
    }
    return arr;
}

function array2hex(buffer) {
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

function websafe64(base64) {
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function array2websafe(array) {
    var result = "";
    for(var i = 0; i < array.length; ++i){
        result+= (String.fromCharCode(array[i]));
    }
    return websafe64(window.btoa(result));
}

function normal64(base64) {
    return base64.replace(/\-/g, '+').replace(/_/g, '/') + '=='.substring(0, (3*base64.length)%4);
}

function websafe2array(base64) {
    var binary_string = window.atob(normal64(base64));
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
}

function error2string(err)
{
    return lookup_table[err]
}

function websafe2string(string) {
    return window.atob(normal64(string));
}

function wrap_promise(func) {
    var self = this;
    return function() {
        var args = arguments;
        return new Promise(function(resolve, reject) {
           var i;
           var oldfunc = null;
           for (i = 0; i < args.length; i++) {
               if (typeof args[i] == 'function') {
                   oldfunc = args[i];
                   args[i] = function() {
                       oldfunc.apply(self, arguments);
                       resolve.apply(self, arguments);
                   };
                   break;
               }
           }
           if (oldfunc === null) {
               args = Array.prototype.slice.call(args);
               args.push(function() {
                   resolve.apply(self, arguments);
               })
               func.apply(self, args);
           }
        });
    }
}

