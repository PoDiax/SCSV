// popup.js
if (typeof browser === "undefined" && typeof chrome !== "undefined") {
    var browser = chrome;
}

document.addEventListener('DOMContentLoaded', () => {
    const unitToggle = document.getElementById('unit-toggle');

    browser.storage.local.get('useGB').then((result) => {
        if (result.useGB !== undefined) {
            unitToggle.checked = result.useGB;
        }
    }).catch((error) => {
        console.error("Error loading unit setting:", error);
    });

    unitToggle.addEventListener('change', () => {
        const useGB = unitToggle.checked;
        browser.storage.local.set({ useGB }).then(() => {
            console.log('Unit preference saved:', useGB ? 'GB' : 'MB');
            console.error("Error saving unit setting:", error);
        });
    });
});
