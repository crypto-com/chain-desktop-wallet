import React from 'react';

import { Trans } from 'react-i18next';

import { Tag } from 'antd';

import { VoteOption } from '../../models/Transaction';

export function processVoteTag(vote) {
  let voteColor;
  let voteMessage;
  switch (vote) {
    case VoteOption.VOTE_OPTION_YES:
      voteColor = 'success';
      voteMessage = `Yes - ${(<Trans>governance.voteOption.yes</Trans>)}`;
      break;
    case VoteOption.VOTE_OPTION_NO:
      voteColor = 'error';
      voteMessage = `No - ${(<Trans>governance.voteOption.no</Trans>)}`;
      break;
    case VoteOption.VOTE_OPTION_NO_WITH_VETO:
      voteColor = 'error';
      voteMessage = `No with Veto - ${(<Trans>governance.voteOption.noWithVeto</Trans>)}`;
      break;
    case VoteOption.VOTE_OPTION_ABSTAIN:
      voteColor = 'default';
      voteMessage = `Abstain - ${(<Trans>governance.voteOption.abstain</Trans>)}`;
      break;
    default:
      voteColor = 'default';
  }
  return (
    <Tag style={{ border: 'none', padding: '5px 14px' }} color={voteColor}>
      {voteMessage}
    </Tag>
  );
}
