import { createI18n, type I18nResources } from '@/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const I18n = createI18n({
  en: {
    title: 'Hi!',
    desc: 'Lets localize your app with {lib} and {framework}',
  },
  vi: {
    title: 'Xin chào!',
    desc: 'Bắt đầu địa phương hoá ứng dụng của bạn với {lib} và {framework}',
  },
} as const satisfies I18nResources);

it('throws error if used outside Provider', () => {
  expect(() => render(<I18n.T id="title" />)).toThrow(
    'LocaleContext not found',
  );
});

it('renders translations', async () => {
  function SwitchLocale() {
    const [, setLocale] = I18n.useLocale();

    return (
      <button type="button" onClick={() => setLocale('vi')}>
        Switch to VI
      </button>
    );
  }

  render(
    <I18n.Provider defaultLocale="en">
      <h1>
        <I18n.T id="title" />
      </h1>
      <p>
        <I18n.T
          id="desc"
          params={{ lib: '@everybase/i18n', framework: 'React' }}
        />
      </p>
      <SwitchLocale />
    </I18n.Provider>,
  );

  const h1 = screen.getByRole('heading');
  const p = screen.getByRole('paragraph');

  expect(h1).toHaveTextContent('Hi!');
  expect(p).toHaveTextContent(
    'Lets localize your app with @everybase/i18n and React',
  );

  await userEvent.click(screen.getByRole('button', { name: 'Switch to VI' }));

  expect(h1).toHaveTextContent('Xin chào!');
  expect(p).toHaveTextContent(
    'Bắt đầu địa phương hoá ứng dụng của bạn với @everybase/i18n và React',
  );
});
