import { createI18n } from '@/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const I18n = createI18n({
  en: {
    title: 'Hi!',
    desc: 'This is @everybase/i18n',
  },
  vi: {
    title: 'Xin chào!',
    desc: 'Đây là @everybase/i18n',
  },
});

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
        <I18n.T id="desc" />
      </p>
      <SwitchLocale />
    </I18n.Provider>,
  );

  const h1 = screen.getByRole('heading');
  const p = screen.getByRole('paragraph');

  expect(h1).toHaveTextContent('Hi!');
  expect(p).toHaveTextContent('This is @everybase/i18n');

  await userEvent.click(screen.getByRole('button', { name: 'Switch to VI' }));

  expect(h1).toHaveTextContent('Xin chào!');
  expect(p).toHaveTextContent('Đây là @everybase/i18n');
});
