import type { ModBootJsonAddonPlugin } from "./types.ts";
import { TweeReplacer } from "./twee-replacer.ts";

export const addonPlugin: ModBootJsonAddonPlugin[] = [
  TweeReplacer,
  {
    modName: "ImageLoaderHook",
    addonName: "ImageLoaderAddon",
    modVersion: "^2.12.1",
    params: [],
  },
];
