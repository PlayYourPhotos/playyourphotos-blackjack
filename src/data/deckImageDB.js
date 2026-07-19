const DATABASE_NAME = "cardLedgendsDeckDatabase";
const DATABASE_VERSION = 1;

const IMAGE_STORE_NAME = "deckImages";

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(
        new Error(
          "This browser does not support IndexedDB."
        )
      );
      return;
    }

    const request = window.indexedDB.open(
      DATABASE_NAME,
      DATABASE_VERSION
    );

    request.onerror = () => {
      reject(
        request.error ||
          new Error(
            "The Card Ledgends image database could not be opened."
          )
      );
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const database = request.result;

      if (
        !database.objectStoreNames.contains(
          IMAGE_STORE_NAME
        )
      ) {
        const imageStore =
          database.createObjectStore(
            IMAGE_STORE_NAME,
            {
              keyPath: "id",
            }
          );

        imageStore.createIndex(
          "deckId",
          "deckId",
          {
            unique: false,
          }
        );

        imageStore.createIndex(
          "deckIdAndType",
          ["deckId", "type"],
          {
            unique: false,
          }
        );
      }
    };
  });
}

function runTransaction(mode, operation) {
  return openDatabase().then(
    (database) =>
      new Promise((resolve, reject) => {
        const transaction =
          database.transaction(
            IMAGE_STORE_NAME,
            mode
          );

        const store =
          transaction.objectStore(
            IMAGE_STORE_NAME
          );

        let result;

        try {
          result = operation(store);
        } catch (error) {
          database.close();
          reject(error);
          return;
        }

        transaction.oncomplete = () => {
          database.close();
          resolve(result);
        };

        transaction.onerror = () => {
          const error =
            transaction.error ||
            new Error(
              "The Card Ledgends image transaction failed."
            );

          database.close();
          reject(error);
        };

        transaction.onabort = () => {
          const error =
            transaction.error ||
            new Error(
              "The Card Ledgends image transaction was cancelled."
            );

          database.close();
          reject(error);
        };
      })
  );
}

export async function saveDeckImage({
  id,
  deckId,
  type,
  suit = null,
  rank = null,
  name,
  blob,
}) {
  if (!id) {
    throw new Error(
      "An image ID is required."
    );
  }

  if (!deckId) {
    throw new Error(
      "A deck ID is required."
    );
  }

  if (!(blob instanceof Blob)) {
    throw new Error(
      "A valid image file is required."
    );
  }

  const imageRecord = {
    id,
    deckId,
    type,
    suit,
    rank,
    name,
    blob,
    updatedAt: new Date().toISOString(),
  };

  await runTransaction(
    "readwrite",
    (store) => {
      store.put(imageRecord);
    }
  );

  return {
    id,
    deckId,
    type,
    suit,
    rank,
    name,
  };
}

export async function getDeckImage(
  imageId
) {
  if (!imageId) {
    return null;
  }

  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction =
      database.transaction(
        IMAGE_STORE_NAME,
        "readonly"
      );

    const store =
      transaction.objectStore(
        IMAGE_STORE_NAME
      );

    const request = store.get(imageId);

    request.onsuccess = () => {
      database.close();
      resolve(request.result || null);
    };

    request.onerror = () => {
      const error =
        request.error ||
        new Error(
          "The deck image could not be loaded."
        );

      database.close();
      reject(error);
    };
  });
}

export async function getDeckImageUrl(
  imageId
) {
  const imageRecord =
    await getDeckImage(imageId);

  if (!imageRecord?.blob) {
    return null;
  }

  return URL.createObjectURL(
    imageRecord.blob
  );
}

export async function getDeckImages(
  deckId
) {
  if (!deckId) {
    return [];
  }

  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction =
      database.transaction(
        IMAGE_STORE_NAME,
        "readonly"
      );

    const store =
      transaction.objectStore(
        IMAGE_STORE_NAME
      );

    const index =
      store.index("deckId");

    const request =
      index.getAll(deckId);

    request.onsuccess = () => {
      database.close();
      resolve(request.result || []);
    };

    request.onerror = () => {
      const error =
        request.error ||
        new Error(
          "The deck images could not be loaded."
        );

      database.close();
      reject(error);
    };
  });
}

export async function deleteDeckImage(
  imageId
) {
  if (!imageId) {
    return;
  }

  await runTransaction(
    "readwrite",
    (store) => {
      store.delete(imageId);
    }
  );
}

export async function deleteDeckImagesBySuit(
  deckId,
  suit
) {
  const images =
    await getDeckImages(deckId);

  const matchingImages =
    images.filter(
      (image) =>
        image.type === "card" &&
        image.suit === suit
    );

  if (matchingImages.length === 0) {
    return;
  }

  await runTransaction(
    "readwrite",
    (store) => {
      matchingImages.forEach(
        (image) => {
          store.delete(image.id);
        }
      );
    }
  );
}

export async function deleteDeckImages(
  deckId
) {
  const images =
    await getDeckImages(deckId);

  if (images.length === 0) {
    return;
  }

  await runTransaction(
    "readwrite",
    (store) => {
      images.forEach((image) => {
        store.delete(image.id);
      });
    }
  );
}

export async function replaceSuitCard({
  deckId,
  suit,
  rank,
  file,
  imageId,
}) {
  if (!(file instanceof File)) {
    throw new Error(
      "A valid card image file is required."
    );
  }

  const existingImages =
    await getDeckImages(deckId);

  const existingCard =
    existingImages.find(
      (image) =>
        image.type === "card" &&
        image.suit === suit &&
        image.rank === rank
    );

  if (existingCard) {
    await deleteDeckImage(
      existingCard.id
    );
  }

  return saveDeckImage({
    id: imageId,
    deckId,
    type: "card",
    suit,
    rank,
    name: file.name,
    blob: file,
  });
}

export async function replaceCardBack({
  deckId,
  file,
  imageId,
}) {
  if (!(file instanceof File)) {
    throw new Error(
      "A valid card-back image file is required."
    );
  }

  const existingImages =
    await getDeckImages(deckId);

  const existingCardBack =
    existingImages.find(
      (image) =>
        image.type === "cardBack"
    );

  if (existingCardBack) {
    await deleteDeckImage(
      existingCardBack.id
    );
  }

  return saveDeckImage({
    id: imageId,
    deckId,
    type: "cardBack",
    name: file.name,
    blob: file,
  });
}
