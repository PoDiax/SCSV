// content.js

if (!document.getElementsByClassName("collectionChildren").length > 0) {
    console.debug(":<");
} else {

    async function getLinkedCollections() {
        return new Promise(function(resolve) {
            chrome.storage.sync.get({
                linkedCollections: false
            }, function (items) {
                resolve(items.linkedCollections || false);
            });
        });
    }

    const linkedCollections = await getLinkedCollections();

    console.log(`Linked collections: ${linkedCollections}`);
    
    const getAllItems = () => { //TODO Get all Linked Collections and check them as well
        const itemsContainer = document.getElementsByClassName("collectionChildren");
        const items = [];

        if (itemsContainer[0]) {
            const collectionItems = itemsContainer[0].querySelectorAll('div.collectionItem');

            for (const item of collectionItems) {
                if (item.id && item.id.startsWith('sharedfile_')) {
                    const fileId = item.id.replace('sharedfile_', '');
                    items.push(fileId);
                }
            }
        }
        return items;
    };

    async function calculateWorkshopItemsSize(workshopItemIds) {
        return new Promise((resolve, reject) => {
            if ('serviceWorker' in navigator) {
                const port = chrome.runtime.connect({
                    name: 'content-script'
                });

                port.onMessage.addListener((message) => {
                    if (message.type === 'CALCULATE_WORKSHOP_SIZE_RESULT') {
                        const {
                            totalSizeMb,
                            error
                        } = message;

                        if (error) {
                            console.error('Error calculating workshop item size:', error);
                        } else {
                            document.getElementsByClassName("_calcSpan")[0].textContent = `${totalSizeMb} MB`;
                        }
                    }
                });

                port.postMessage({
                    type: 'CALCULATE_WORKSHOP_SIZE',
                    workshopItemIds: workshopItemIds
                });
            } else {
                reject('Service workers are not supported in this browser.');
            }
        });
    }

    const workshopItemDesc = document.getElementsByClassName("workshopItemDescriptionTitle");
    const buttonLocation = workshopItemDesc.length > 2 ? workshopItemDesc[workshopItemDesc.length - 2] : workshopItemDesc[workshopItemDesc.length - 1];
    
    if (buttonLocation) {
        const calcButton = document.createElement("span");
        calcButton.className = "general_btn _calc";
        calcButton.innerHTML = `
          <span class="_calcSpan">Calculate Size</span>
        `;

        const allItems = getAllItems();

        calcButton.onclick = async function () {
            if (allItems.length > 0) {
                if (buttonClicked) return;
                try {
                    await calculateWorkshopItemsSize(allItems);
                    buttonClicked = true;
                } catch (error) {
                    buttonClicked = false;
                    console.error('Error calculating workshop items size:', error);
                }
            } else {
                console.debug('No workshop items found.');
            }
        };

        buttonLocation.appendChild(calcButton);
    } else {
        console.debug("Button container not found.");
    }
}