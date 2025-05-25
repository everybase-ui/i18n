import { createI18n } from '@/i18n';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('throws error if used outside Provider', () => {
  const I18n = createI18n({ en: { title: 'Hello' } });
  expect(() => render(<I18n.T id="title" />)).toThrow(
    'LocaleContext not found',
  );
});

it('renders translations', async () => {
  const I18n = createI18n({
    en: {
      title: 'Hi!',
      desc: 'Lets localize your app with {lib} and {framework}',
    },
    vi: {
      title: 'Xin chào!',
      desc: 'Bắt đầu địa phương hoá ứng dụng của bạn với {lib} và {framework}',
    },
  } as const);

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

describe('lazy load translations', () => {
  const loadEn = vi.fn(
    () =>
      new Promise<{ title: 'Hi!' }>((resolve) =>
        setTimeout(() => resolve({ title: 'Hi!' })),
      ),
  );

  const LazyI18n = createI18n({
    en: loadEn,
  });

  function Component() {
    return (
      <LazyI18n.Provider
        defaultLocale="en"
        fallback={<output>Loading...</output>}
      >
        <p>
          <LazyI18n.T id="title" />
        </p>
      </LazyI18n.Provider>
    );
  }

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders fallback while loading translations', () => {
    render(<Component />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders translations after loaded', async () => {
    const { rerender } = await act(() => render(<Component />));
    expect(screen.getByRole('paragraph')).toHaveTextContent('Hi!');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(loadEn).toHaveBeenCalled();

    rerender(<Component />);
    expect(loadEn).toHaveBeenCalledTimes(1);
  });
});
