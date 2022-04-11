import React from 'react';
import ReactPlayer from 'react-player';
import { CommonNftModel, isCronosNftModel, isCryptoOrgNftModel } from '../../../models/Transaction';
import { NftUtils } from '../../../utils/NftUtils';
import nftThumbnail from '../../../assets/nft-thumbnail.png';

interface INftPreviewProps {
  nft: CommonNftModel | undefined;
  showThumbnail?: boolean;
  videoUrl?: string;
  isVideoPlaying?: boolean;
}

const NftPreview = (props: INftPreviewProps) => {
  const { nft, showThumbnail = true, videoUrl, isVideoPlaying } = props;
  if (nft !== undefined) {
    if (isCryptoOrgNftModel(nft)) {
      const { model, tokenData } = nft;
      if (
        !showThumbnail &&
        (NftUtils.supportedVideo(tokenData?.mimeType) ||
          NftUtils.supportedVideo(tokenData?.animationMimeType))
      ) {
        return (
          <ReactPlayer
            url={videoUrl}
            config={{
              file: {
                attributes: {
                  controlsList: 'nodownload',
                },
              },
            }}
            controls
            playing={isVideoPlaying}
          />
        );
      }
      return (
        <img
          alt={model.denomName}
          src={tokenData?.image ? tokenData.image : nftThumbnail}
          onError={e => {
            (e.target as HTMLImageElement).src = nftThumbnail;
          }}
        />
      );
    }

    if (isCronosNftModel(nft)) {
      const { model } = nft;
      return (
        <img
          alt={`${model.token_address}-${model.token_id}`}
          src={model.image_url ? model.image_url : nftThumbnail}
          onError={e => {
            (e.target as HTMLImageElement).src = nftThumbnail;
          }}
        />
      );
    }
  }

  return (
    <img
      alt="default-nft-thumbnail"
      src={nftThumbnail}
      onError={e => {
        (e.target as HTMLImageElement).src = nftThumbnail;
      }}
    />
  );
};

export default NftPreview;
