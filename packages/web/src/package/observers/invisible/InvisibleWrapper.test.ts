jest.autoMockOff();
import { InvisibleWrapper } from './InvisibleWrapper';

describe('invisible wrapper', () => {
  it('wraps and unwraps', () => {
    const wrapper = InvisibleWrapper({ fullKeyEncode: false });
    const key = 'hello';
    const translation = 'world';
    const defaultValue = '!';

    const wrapped = wrapper.wrap({ key, translation, defaultValue });
    const unwraped = wrapper.unwrap(wrapped);
    expect(unwraped.text).toEqual(translation);
    expect(unwraped.keys[0].key).toEqual(key);
    expect(unwraped.keys[0].defaultValue).toEqual(defaultValue);
  });

  it('works with external fully encoded keys', () => {
    // simulating external wrapper
    const externalWrapper = InvisibleWrapper({ fullKeyEncode: true });

    const wrapper = InvisibleWrapper({ fullKeyEncode: false });
    const key = 'hello';
    const translation = 'world';
    const defaultValue = '!';

    const wrapped = externalWrapper.wrap({ key, translation, defaultValue });
    const unwraped = wrapper.unwrap(wrapped);
    expect(unwraped.text).toEqual(translation);
    expect(unwraped.keys[0].key).toEqual(key);
    // doesn't include default value
    expect(unwraped.keys[0].defaultValue).toEqual(undefined);
  });
});
