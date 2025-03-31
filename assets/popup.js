// popup.js
if (typeof browser === "undefined" && typeof chrome !== "undefined") {
    var browser = chrome;
}

document.addEventListener('DOMContentLoaded', () => {
    const unitToggle = document.getElementById('unit-toggle');
    const clearButton = document.getElementById("clear-liked-addons");


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
        }).catch((error) => {
            console.error("Error saving unit setting:", error);
        });
    });


    clearButton.addEventListener("click", async () => {
        try {
            const allStorage = await browser.storage.local.get(null);
            const likedKeys = Object.keys(allStorage).filter(key => key.startsWith("likedItems_"));

            for (const key of likedKeys) {
                await browser.storage.local.remove(key);
            }

            console.log("All liked addons cleared.");
            alert("Cleared all liked addons!");
        } catch (error) {
            console.error("Error clearing liked addons:", error);
        }
    });
});
