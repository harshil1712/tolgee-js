import React from 'react';
import { FunctionComponent } from 'react';
import { styled } from '@mui/material/styles';
import { keyframes } from '@mui/styled-engine';

import { useDialogContext, useDialogActions } from './dialogContext';
import { ScFieldTitle } from '../common/FieldTitle';
import { getPreferredLanguages } from './dialogContext/tools';
import { TranslationTextField } from './TranslationTextField';

const inputLoading = keyframes`
  0%   { background-position: 0%; }
  100% { background-position: 100%; }
`;

const LoadingTextArea = styled('div')`
  margin-top: 10px;
  padding: 5px;
  border: 1px solid #ccc;
  width: 100%;
  border-radius: 5px;
  font-style: inherit;
  font-family: inherit;
  box-sizing: border-box;
  display: block;
  height: 42px;
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0),
    rgba(0, 0, 0, 0),
    rgba(0, 0, 0, 0.1),
    rgba(0, 0, 0, 0),
    rgba(0, 0, 0, 0)
  );
  background-size: 500% 500%;
  animation: ${inputLoading} 1.5s linear infinite alternate;
`;

export const TranslationFields: FunctionComponent = () => {
  const { onInputChange, onStateChange } = useDialogActions();

  const permissions = useDialogContext((c) => c.permissions);
  const selectedLanguages = useDialogContext((c) => c.selectedLanguages);
  const langFields = selectedLanguages.length
    ? selectedLanguages
    : getPreferredLanguages();
  const availableLanguages = useDialogContext((c) => c.availableLanguages);
  const translationsForm = useDialogContext((c) => c.translationsForm);
  const formDisabled = useDialogContext((c) => c.formDisabled);
  const loading = useDialogContext((c) => c.loading);

  const keyData = useDialogContext((c) => c.keyData);

  const Loading = () => (
    <>
      {langFields.map((lang) => (
        <LoadingTextArea key={lang} />
      ))}
    </>
  );

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        selectedLanguages.map((key) => {
          const lang = availableLanguages?.find((l) => l.tag === key);

          const editPermitted = permissions.canEditTranslation(key);
          const stateChangePermitted = permissions.canEditState(key);

          const translation = keyData?.translations[key];

          return (
            <React.Fragment key={key}>
              <ScFieldTitle>{lang?.name || key}</ScFieldTitle>
              <TranslationTextField
                disabled={
                  formDisabled ||
                  !editPermitted ||
                  translation?.state === 'DISABLED'
                }
                stateChangeDisabled={!stateChangePermitted}
                language={lang?.tag}
                value={translationsForm[key]?.text || ''}
                onChange={(value) => onInputChange(key, value)}
                onStateChange={(value) => onStateChange(key, value)}
                state={translationsForm[key]?.state}
              />
            </React.Fragment>
          );
        })
      )}
    </>
  );
};
