/** Wires the save transport to the real stores: localStorage always, CloudStorage inside Telegram. */
import { cloudKV, createSaves, localKV } from "./storage";
import { cloudStorage } from "./telegram";

export const saves = createSaves(localKV(window.localStorage), cloudStorage ? cloudKV(cloudStorage) : undefined);
