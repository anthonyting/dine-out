import { gzipSync, gunzipSync } from "fflate";

export interface SerializedState {
  s: string; // selected restaurant IDs
}

declare const tags: unique symbol;

export type SerializedStateString = string & {
  [tags]: "SerializedStateString";
};

export type SelectedRestaurants = Record<string, boolean>;

function arrayBufferToBase64(buffer: ArrayBufferLike): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (var i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export class State {
  constructor(readonly selectedRestaurants: SelectedRestaurants) {}

  clone(): State {
    return new State({ ...this.selectedRestaurants });
  }

  static deserialize(json: SerializedStateString): State {
    const parsed: SerializedState = JSON.parse(atob(json));
    const selectedRestaurants: SelectedRestaurants = {};
    const bytes = Uint8Array.from(atob(parsed.s), (c) => c.charCodeAt(0));
    const decompressed = gunzipSync(bytes);
    const uint32Array = new Uint32Array(
      decompressed.buffer,
      decompressed.byteOffset,
      decompressed.byteLength / Uint32Array.BYTES_PER_ELEMENT,
    );

    for (const id of uint32Array) {
      selectedRestaurants[id.toString()] = true;
    }

    return new State(selectedRestaurants);
  }

  serialize(): SerializedStateString | undefined {
    const selectedIds = Object.entries(this.selectedRestaurants).reduce(
      (acc, [key, value]) => {
        if (value) {
          const keyAsNumber = Number(key);
          if (
            isNaN(keyAsNumber) ||
            !Number.isInteger(keyAsNumber) ||
            keyAsNumber < 0
          ) {
            throw new Error(
              "Expected positive integer key for selectedRestaurants",
            );
          }
          acc.push(keyAsNumber);
        }
        return acc;
      },
      [] as number[],
    );

    if (!selectedIds.length) {
      return undefined;
    }

    const bytes = new Uint32Array(selectedIds);
    const compressed = gzipSync(new Uint8Array(bytes.buffer));

    const serializedState: SerializedState = {
      s: arrayBufferToBase64(compressed.buffer),
    };

    return btoa(JSON.stringify(serializedState)) as SerializedStateString;
  }
}
