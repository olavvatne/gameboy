

var storedTheme = localStorage.getItem('theme') 
    || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
if (storedTheme) {
    document.documentElement.setAttribute('data-theme', storedTheme)
}

document.addEventListener('DOMContentLoaded', function () {
    var toggle = document.getElementById('theme-toggle');
    function setTitle(theme) {
        if (theme === 'light') {
            toggle.title = 'Switch to dark mode';
        }
        else if (theme === 'dark') {
            toggle.title = 'Switch to light mode';
        }
    }
    if (toggle) {
        setTitle(storedTheme);
        toggle.onclick = function() {
            var currentTheme = document.documentElement.getAttribute('data-theme');
            var targetTheme = 'light';
        
            if (currentTheme === 'light') {
                targetTheme = 'dark';
            }
    
            document.documentElement.setAttribute('data-theme', targetTheme)
            setTitle(targetTheme);
            localStorage.setItem('theme', targetTheme);
        };
    }
});

window.addEventListener('load', function(){
    document.body.style.transition = '0.1s linear';
});
