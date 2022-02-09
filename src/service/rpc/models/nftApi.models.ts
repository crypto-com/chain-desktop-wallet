export interface ExternalNftMetadataResponse {
  data: Data;
  errors?: any;
}

export interface Data {
  translatedNft: ExternalNftMetadata;
}

export interface ExternalNftMetadata {
  translatable: boolean;
  metadata?: Metadata;
}

export interface Metadata {
  description: string;
  name: string;
  collectionId: string;
  attributes: Attribute[];
  dropId: string;
  image?: string;
  animationUrl?: string;
  mimeType?: string;
  animationMimeType?: string;
}

export interface Attribute {
  traitType: string;
  value: string;
}
