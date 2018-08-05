/*
 * 递归遍历
 * @param data array
 * @param id int
 * return array
 * */
function recursion(data, id) {
    var list = [];
    for(var index in data) {
        var v = data[index];
        if(v['pid'] == id) {
            v['son'] = recursion(data, v['id']);
            if(v['son'].length == 0) {
                //unset(v['son']);
            }
            list.push(v);
        }
    }
    return list;
}

var list = [{
    id: 1,
    pid:0,
    name:"a"
},{
    id: 2,
    pid:0,
    name:"b"
},{
    id: 3,
    pid:0,
    name:"c"
},{
    id: 4,
    pid:1,
    name:"d"
},{
    id: 5,
    pid:1,
    name:"e"
},{
    id: 6,
    pid:2,
    name:"e"
}];
console.log(JSON.stringify(recursion(list, 0)));