// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const helloButton = document.getElementById('helloButton');
    const helloText = document.getElementById('helloText');
    
    // 点击事件处理
    helloButton.addEventListener('click', function() {
        // 切换显示/隐藏状态
        if (helloText.classList.contains('show')) {
            helloText.classList.remove('show');
            helloButton.textContent = '显示Hello World';
        } else {
            helloText.classList.add('show');
            helloButton.textContent = '隐藏Hello World';
        }
    });
});