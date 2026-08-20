export type USDAssetPath = {
  assetPath: string;
  primPath?: string;
};

export type USDScenePath = {
  path: string;
};

export type USDValue =
  | string
  | number
  | boolean
  | null
  | USDAssetPath
  | USDScenePath
  | USDValue[]
  | {[name: string]: USDValue};

export type USDAttribute = {
  name: string;
  type: string;
  value: USDValue;
  metadata: Record<string, USDValue>;
};

export type USDVariant = {
  attributes: Record<string, USDAttribute>;
  metadata: Record<string, USDValue>;
  children: USDPrim[];
};

export type USDPrim = {
  name: string;
  path: string;
  sourceUrl?: string;
  type: string;
  specifier: 'def' | 'over' | 'class';
  attributes: Record<string, USDAttribute>;
  metadata: Record<string, USDValue>;
  variants: Record<string, Record<string, USDVariant>>;
  children: USDPrim[];
};

export type USDStage = {
  format: 'usda' | 'usdz';
  url?: string;
  metadata: Record<string, USDValue>;
  rootPrims: USDPrim[];
  layers: string[];
};

export type USDLoaderOptions = {
  core?: {baseUrl?: string};
  usd?: {
    compose?: boolean;
    loadReferences?: boolean;
    maxReferenceDepth?: number;
    variantSelections?: Record<string, string>;
  };
  [loaderIdentifier: string]: unknown;
};
