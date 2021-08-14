exports.getNewId = function*() {
    for (let i = 1; ; i++) 
        yield i;
}