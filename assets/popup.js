// popup.js


document.addEventListener('DOMContentLoaded', function () {
    var closeButton = document.querySelector('.close-btn');
    closeButton.addEventListener('click', function () {
        window.close();
    });
});


document.addEventListener('DOMContentLoaded', function () {
    loadSettings();

    document.querySelector('.btn').addEventListener('click', saveSettings);
});

function saveSettings() {
    var linkedCollections = document.getElementById('linkedCollections').checked;
    var WIP1 = document.getElementById('WIP1').checked;
    var WIP2 = document.getElementById('WIP2').checked;

    chrome.storage.sync.set({
        linkedCollections: linkedCollections,
        WIP1: WIP1,
        WIP2: WIP2
    }, function () {
        var saveText = document.querySelector('.save');
        saveText.classList.add('visible');

        setTimeout(function () {
            saveText.classList.remove("visible");
        }, 3000);
    });
}


function loadSettings() {
    chrome.storage.sync.get({
        linkedCollections: false,
        WIP1: false,
        WIP2: false
    }, function (items) {
        document.getElementById('linkedCollections').checked = items.linkedCollections;
        document.getElementById('WIP1').checked = items.WIP1;
        document.getElementById('WIP2').checked = items.WIP2;
    });
}