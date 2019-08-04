function $() {}

function ajax(method, url, success, data, type){
    data = data || null;
    var r = new XMLHttpRequest();
    if (success instanceof Function) {
        r.onreadystatechange = function(){
            if(r.readyState==4 && (r.status==200 || r.status==0))
                success(r.responseText);
        };
    }
    r.open(method,url,true);
    if (type) r.setRequestHeader("Accept", type );
    if (data instanceof Object) data = JSON.stringify(data), r.setRequestHeader('Content-Type','application/json');
    r.setRequestHeader('X-Requested-With','XMLHttpRequest');
    r.send(data);
}


$.get = function(url, success){ ajax('GET', url, success); };
$.post = function(url, data, success, type){
    if (data instanceof Function) type = type || success, success = data, data = null;
    ajax('POST', url, success, data, type);
};
$.getJSON = function(url, success){
    $.get(url, function(json){ success(JSON.parse(json)) });
};

export default $;
