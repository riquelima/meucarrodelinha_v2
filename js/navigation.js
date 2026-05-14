window.goBack = function () {
    var stack = JSON.parse(sessionStorage.getItem('mclNavStack') || '[]');
    if (stack.length > 0) {
        var prev = stack.pop();
        sessionStorage.setItem('mclNavStack', JSON.stringify(stack));
        if (prev && prev !== window.location.pathname.split('/').pop()) {
            window.location.href = prev;
            return;
        }
    }
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = 'homepage.html';
    }
};
