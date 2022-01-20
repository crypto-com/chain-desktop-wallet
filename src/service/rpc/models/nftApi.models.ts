export interface ExternalNftMetadataResponse {
    data: Data;
    errors?: any;
}

export interface Data {
    externalNftMetadata: ExternalNftMetadata;
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
    video?: string;
    mimeType: string;
}

export interface Attribute {
    trait_type: string;
    value: string;
}
