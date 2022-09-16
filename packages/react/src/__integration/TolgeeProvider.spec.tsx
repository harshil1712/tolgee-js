jest.autoMockOff();

import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { act } from 'react-dom/test-utils';

import mockTranslations from './mockTranslations';
import fetchMock, { MockResponseInitFunction } from 'jest-fetch-mock';
import { testConfig } from './testConfig';
import {
  TolgeeProvider,
  useTranslate,
  Tolgee,
  TolgeeInstance,
  DevTools,
} from '..';
import { render, screen, waitFor } from '@testing-library/react';

const API_URL = 'http://localhost';
const API_KEY = 'dummyApiKey';

export const createFetchMock = () => {
  let resolveCzech;
  let resolveEnglish;
  const czechPromise = new Promise((resolve) => {
    resolveCzech = () => {
      resolve(JSON.stringify({ cs: mockTranslations.cs }));
    };
  });

  const englishPromise = new Promise((resolve) => {
    resolveEnglish = () => {
      resolve(JSON.stringify({ en: mockTranslations.en }));
    };
  });

  const fetch = fetchMock.mockResponse(async (req) => {
    if (req.url.includes('/v2/api-keys/current')) {
      return JSON.stringify(testConfig);
    } else if (req.url.includes('/v2/projects/translations/en')) {
      return englishPromise as any;
    } else if (req.url.includes('/v2/projects/translations/cs')) {
      return czechPromise as any;
    }
    throw new Error('Invalid request');
  });
  return { fetch, resolveCzech, resolveEnglish };
};

describe('TolgeeProvider integration', () => {
  const TestComponent = () => {
    const { t } = useTranslate();
    return (
      <>
        <div data-testid="hello_world">{t('hello_world')}</div>
        <div data-testid="english_fallback">
          {t('english_fallback', 'Default value')}
        </div>
        <div data-testid="non_existant">
          {t('non_existant', 'Default value')}
        </div>
      </>
    );
  };

  describe('regular settings', () => {
    let resolveEnglish: any;
    let resolveCzech: any;
    let tolgee: TolgeeInstance;

    beforeEach(async () => {
      const fetchMock = createFetchMock();
      resolveCzech = fetchMock.resolveCzech;
      resolveEnglish = fetchMock.resolveEnglish;
      fetchMock.fetch.enableMocks();
      tolgee = Tolgee().use(DevTools()).init({
        apiUrl: API_URL,
        apiKey: API_KEY,
        language: 'cs',
        fallbackLanguage: 'en',
      });

      act(() => {
        render(
          <TolgeeProvider tolgee={tolgee} fallback="Loading...">
            <TestComponent />
          </TolgeeProvider>
        );
      });
    });

    it('shows correctly loading, fallback and default value', async () => {
      expect(screen.queryByText('Loading...')).toBeInTheDocument();
      act(() => {
        resolveCzech();
      });
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).toBeInTheDocument();
      });
      act(() => {
        resolveEnglish();
      });
      await waitFor(() => {
        expect(screen.queryByTestId('hello_world')).toContainHTML(
          'Ahoj světe!'
        );
        expect(screen.queryByTestId('english_fallback')).toContainHTML(
          'English fallback'
        );
        expect(screen.queryByTestId('non_existant')).toContainHTML(
          'Default value'
        );
      });
    });
  });

  describe('with fallback', () => {
    let resolveEnglish: any;
    let resolveCzech: any;
    let tolgee: TolgeeInstance;

    beforeEach(async () => {
      const fetchMock = createFetchMock();
      resolveCzech = fetchMock.resolveCzech;
      resolveEnglish = fetchMock.resolveEnglish;
      fetchMock.fetch.enableMocks();
      tolgee = Tolgee().use(DevTools()).init({
        apiUrl: API_URL,
        apiKey: API_KEY,
        language: 'cs',
        fallbackLanguage: 'en',
      });
      act(() => {
        render(
          <TolgeeProvider tolgee={tolgee} fallback="Loading...">
            <TestComponent />
          </TolgeeProvider>
        );
      });
    });

    it('shows correctly loading, fallback and default value', async () => {
      expect(screen.queryByText('Loading...')).toBeInTheDocument();
      act(() => {
        resolveCzech();
      });
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).toBeInTheDocument();
        expect(screen.queryByTestId('hello_world')).not.toBeInTheDocument();
      });
      act(() => {
        resolveEnglish();
      });
      await waitFor(() => {
        expect(screen.queryByTestId('hello_world')).toContainHTML(
          'Ahoj světe!'
        );
        expect(screen.queryByTestId('english_fallback')).toContainHTML(
          'English fallback'
        );
        expect(screen.queryByTestId('non_existant')).toContainHTML(
          'Default value'
        );
      });
    });
  });
});
