// content.js
if (typeof browser === "undefined" && typeof chrome !== "undefined") {
    var browser = chrome;
}

let allowed = ["Collections", "Warsztat", "Workshop", "Oficina", "ワークショップ"];

let useGB = false;

async function loadSettings() {
    try {
        const result = await browser.storage.local.get('useGB');
        useGB = result.useGB !== undefined ? result.useGB : false;
    } catch (error) {
        console.warn("Error while accessing storage:", error);
        useGB = false;
    }
}

loadSettings().then(() => {
    const isCollectionPage = document.getElementsByClassName("breadcrumbs")[0].textContent.trim();

    if (allowed.includes(isCollectionPage)) {
        console.debug(":<");
    } else {
        let buttonClicked = false;

        const getAllItems = async () => {
            try {
                const url = window.location.href;
                const currentUrl = new URL(url);
                const id = currentUrl.searchParams.get('id');

                if (!id) {
                    console.error("ID parameter not found in URL");
                    return [];
                }

                const response = await fetch(
                    'https://api.steampowered.com/ISteamRemoteStorage/GetCollectionDetails/v1/',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: new URLSearchParams({
                            collectioncount: 1,
                            ['publishedfileids[0]']: id,
                        }),
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch collection details");
                }

                const data = await response.json();
                const collectionDetails = data.response.collectiondetails;

                if (!collectionDetails || collectionDetails.length === 0) {
                    throw new Error("No collectiondetails found in the response");
                }

                const items = collectionDetails[0].children.map(item => item.publishedfileid) || [];
                return items;

            } catch (error) {
                console.warn("Error occurred with new method:", error);
                console.debug("Falling back to old method...");
                return fallbackGetAllItems();
            }
        };

        const fallbackGetAllItems = () => {
            const itemsContainer = document.getElementsByClassName("collectionChildren")[0];
            const items = [];

            if (itemsContainer) {
                const collectionItems = itemsContainer.querySelectorAll('div.collectionItem');
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
            let totalSizeMb = 0;

            console.info('Calculating workshop item sizes...');

            await Promise.all(
                workshopItemIds.map(async (workshopItemId) => {
                    try {
                        const response = await fetch(
                            'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/',
                            {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                },
                                body: new URLSearchParams({
                                    itemcount: 1,
                                    ['publishedfileids[0]']: workshopItemId,
                                }),
                            }
                        );

                        const responseData = await response.json();

                        if (
                            responseData.response &&
                            responseData.response.publishedfiledetails &&
                            responseData.response.publishedfiledetails.length > 0
                        ) {
                            const file_size_bytes =
                                responseData.response.publishedfiledetails[0].file_size;
                            const file_size_mb = file_size_bytes / 1024 / 1024;

                            if (!isNaN(file_size_mb) && isFinite(file_size_mb)) {
                                totalSizeMb += file_size_mb;
                            } else {
                                console.warn(`Invalid size for item ${workshopItemId}`);
                            }
                        } else {
                            console.error(`Invalid response structure for item ${workshopItemId}`);
                        }
                    } catch (error) {
                        console.error(
                            `Error processing API response for item ${workshopItemId}: ${error.message}`
                        );
                    }
                })
            );

            return totalSizeMb.toFixed(2);
        }

        const buttonLocations = Array.from(document.querySelectorAll('.workshopItemDescriptionTitle'));

        let buttonLocation = buttonLocations.find(div => div.textContent.includes('Items'));

        if (!buttonLocation) {
            buttonLocation = buttonLocations[1] || buttonLocations[0];
        }

        if (buttonLocation) {
            const calcButton = document.createElement("span");
            calcButton.className = "general_btn _calc _calcSpan";
            calcButton.textContent = "Calculate Size";

            getAllItems().then(allItems => {
                calcButton.onclick = async function () {
                    if (allItems.length > 0) {
                        if (buttonClicked) return;
                        calcButton.textContent = "Loading...";
                        try {
                            const totalSizeMb = await calculateWorkshopItemsSize(allItems);

                            let totalSize = useGB ? (totalSizeMb / 1024).toFixed(2) + ' GB' : totalSizeMb + ' MB';

                            calcButton.textContent = `${totalSize}`;
                            buttonClicked = true;
                        } catch (error) {
                            buttonClicked = false;
                            console.error('Error calculating workshop item size:', error);
                        }
                    } else {
                        console.debug('No workshop items found.');
                    }
                };

                buttonLocation.appendChild(calcButton);
            }).catch((error) => {
                console.error("Error fetching collection items:", error);
            });
        } else {
            console.debug("Button container not found.");
        }
    }
});
