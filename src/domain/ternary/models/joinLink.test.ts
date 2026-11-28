import { codeFromLink, joinLinkFor } from './joinLink';

describe('join links', () => {
  it('links to the web page with the code', () => {
    expect(joinLinkFor('KTW4QP')).toBe(
      'https://purlieus.dev/tern/join/?code=KTW4QP',
    );
  });

  it('reads the code from the app’s link and the web page’s', () => {
    expect(codeFromLink('tern://join/KTW4QP')).toBe('KTW4QP');
    expect(codeFromLink('tern:///join/ktw-4qp')).toBe('KTW4QP');
    expect(codeFromLink(joinLinkFor('KTW4QP'))).toBe('KTW4QP');
    expect(
      codeFromLink('https://purlieus.dev/tern/join/?from=sms&code=ktw4qp'),
    ).toBe('KTW4QP');
  });

  it('ignores other links and codes that can’t be one', () => {
    expect(codeFromLink(null)).toBeNull();
    expect(codeFromLink('tern://today')).toBeNull();
    expect(codeFromLink('tern://join/ABC')).toBeNull();
    expect(codeFromLink('https://purlieus.dev/tern/privacy/')).toBeNull();
    expect(codeFromLink('tern://join/%E0%A4%A')).toBeNull();
  });
});
