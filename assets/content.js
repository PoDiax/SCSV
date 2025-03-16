// content.js
if (typeof browser === "undefined" && typeof chrome !== "undefined") {
    // console.log("Using Chrome browser API");
    var browser = chrome;
}

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

async function checkIfPageIsCollection() {
    const url = window.location.href;
    const currentUrl = new URL(url);
    const id = currentUrl.searchParams.get('id');

    if (!id) {
        console.info("ID parameter not found in URL");
        return false;
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

    if (response.ok) {
        const data = await response.json();
        if (data.response && data.response.collectiondetails[0].children) {
            return true;
        }
    } else {
        console.error('Request failed with status:', response.status);
    }
    return false;
}

function checkUserLoggedIn() {
    const accountElement = document.getElementById("account_pulldown");
    if (accountElement && accountElement.textContent.trim()) {
        // console.info("User is logged in.");
        return true;
    }
    // console.warn("User is not logged in. account_pulldown element is empty or not found.");
    return false;
}

function getSessionId() {
    const cookies = document.cookie.split('; ');
    const sessionCookie = cookies.find(cookie => cookie.startsWith('sessionid='));
    return sessionCookie ? sessionCookie.split('=')[1] : null;
}

loadSettings().then(async () => {
    // const breadcrumbs = document.querySelectorAll(".breadcrumbs a");
    // const breadcrumbTexts = Array.from(breadcrumbs).map(el => el.textContent.trim());

    // if (!breadcrumbTexts.some(text => allowed.includes(text))) {
    //     console.debug(":<");
    //     return;
    // }

    const isCollectionPage = await checkIfPageIsCollection();
    if (!isCollectionPage) {
        console.debug(":<");
        return;
    }
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

    async function likeAllItems(workshopItemIds) {
        const loggedIn = checkUserLoggedIn();
        if (!loggedIn) {
            console.info("You are not logged in.");
            alert("You need to be logged in to like items.");
            return;
        }
    
        const sessionId = getSessionId();
        if (!sessionId) {
            console.warn("Session ID not found.");
            return;
        }
    
        let successCount = 0;
        let failureCount = 0;
    
        for (const itemId of workshopItemIds) {
            try {
                const response = await fetch(
                    'https://steamcommunity.com/sharedfiles/voteup',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: new URLSearchParams({
                            sessionid: sessionId,
                            id: itemId,
                        }),
                    }
                );
    
                if (!response.ok) {
                    console.warn(`Failed to like item ${itemId}`);
                    failureCount++;
                } else {
                    // console.log(`Successfully liked item ${itemId}`);
                    successCount++;
                }
            } catch (error) {
                console.error(`Error liking item ${itemId}:`, error);
                failureCount++;
            }
        }
    
        if (failureCount === 0) {
            alert("All items liked successfully!");
        } else if (successCount > 0) {
            alert(`Partly liked! Successfully liked ${successCount} items, but some failed.`);
        } else {
            alert("Failed to like any items.");
        }
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

        const likeAllButton = document.createElement("span");
        likeAllButton.className = "general_btn _likeAll";
        likeAllButton.textContent = "Like All";

        getAllItems().then(allItems => {
            calcButton.onclick = async function () {
                if (calcButton.disabled) return;
            
                if (allItems.length > 0) {
                    calcButton.disabled = true;
                    calcButton.textContent = "Loading...";
                    try {
                        const totalSizeMb = await calculateWorkshopItemsSize(allItems);
                        let totalSize = useGB ? (totalSizeMb / 1024).toFixed(2) + ' GB' : totalSizeMb + ' MB';
                        calcButton.textContent = `${totalSize}`;
                    } catch (error) {
                        console.error('Error calculating workshop item size:', error);
                        calcButton.textContent = "Error";
                    }
                } else {
                    console.debug('No workshop items found.');
                }
            };
            

            likeAllButton.onclick = async function () {
                if (likeAllButton.disabled) return;

                if (allItems.length > 0) {
                    likeAllButton.disabled = true;
                    likeAllButton.textContent = "Liking...";
                    await likeAllItems(allItems);
                    likeAllButton.textContent = "Liked All";
                } else {
                    console.debug('No workshop items found.');
                }
            };

            buttonLocation.appendChild(calcButton);
            buttonLocation.appendChild(likeAllButton);
        }).catch((error) => {
            console.error("Error fetching collection items:", error);
        });
    } else {
        console.debug("Button container not found.");
    }

});
