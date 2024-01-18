// service-worker.js

chrome.runtime.onConnect.addListener((port) => {
  console.assert(port.name === 'content-script');

  port.onMessage.addListener((message) => {
    if (message.type === 'CALCULATE_WORKSHOP_SIZE') {
      const workshopItemIds = message.workshopItemIds;

      handleCalculateItemsSizeManually(workshopItemIds)
        .then((totalSizeMb) => {
          port.postMessage({
            type: 'CALCULATE_WORKSHOP_SIZE_RESULT',
            totalSizeMb
          });
        })
        .catch((error) => {
          port.postMessage({
            type: 'CALCULATE_WORKSHOP_SIZE_RESULT',
            error: error.message
          });
        });
    }
  });
});


async function handleCalculateItemsSizeManually(workshopItemIds) {
  let totalSizeMb = 0;

  console.log('Calculating workshop item sizes...');

  await Promise.all(workshopItemIds.map(async (workshopItemId) => {
    try {
      console.log(`Fetching details for item ${workshopItemId}...`);

      const response = await fetch(
        'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/', {
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
          console.log(`Item ${workshopItemId}: Size = ${file_size_mb.toFixed(2)} MB`);
          totalSizeMb += file_size_mb;
        } else {
          console.error(`Invalid size for item ${workshopItemId}`);
        }
      } else {
        console.error(`Invalid response structure for item ${workshopItemId}`);
      }
    } catch (error) {
      console.error(
        `Error processing API response for item ${workshopItemId}: ${error.message}`
      );
    }
  }));

  console.log(`Total size: ${totalSizeMb.toFixed(2)} MB`);
  return totalSizeMb.toFixed(2);
}