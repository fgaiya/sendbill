import { cn } from '@/lib/shared/utils/ui';

describe('cn function', () => {
  it('単一のクラス名が正しく処理されること', () => {
    expect(cn('text-center')).toBe('text-center');
  });

  it('複数のクラス名が結合されること', () => {
    expect(cn('text-center', 'font-bold')).toBe('text-center font-bold');
  });

  it('条件付きクラス名が正しく処理されること', () => {
    expect(cn('text-center', true && 'font-bold')).toBe(
      'text-center font-bold'
    );
    expect(cn('text-center', false && 'font-bold')).toBe('text-center');
  });

  it('オブジェクト形式のクラス名が正しく処理されること', () => {
    expect(
      cn({
        'text-center': true,
        'font-bold': false,
        'text-red-500': true,
      })
    ).toBe('text-center text-red-500');
  });

  it('配列形式のクラス名が正しく処理されること', () => {
    expect(cn(['text-center', 'font-bold'])).toBe('text-center font-bold');
  });

  it('重複するTailwindクラスが正しくマージされること', () => {
    expect(cn('px-2 py-1', 'p-3')).toBe('p-3');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });

  it('undefinedやnullが無視されること', () => {
    expect(cn('text-center', undefined, null, 'font-bold')).toBe(
      'text-center font-bold'
    );
  });

  it('空文字列が無視されること', () => {
    expect(cn('text-center', '', 'font-bold')).toBe('text-center font-bold');
  });

  it('複雑な条件の組み合わせが正しく処理されること', () => {
    const testCases = [
      {
        isActive: true,
        isDisabled: false,
        variant: 'primary' as const,
        expected: 'btn active btn-primary',
      },
      {
        isActive: false,
        isDisabled: true,
        variant: 'secondary' as const,
        expected: 'btn disabled btn-secondary',
      },
      {
        isActive: true,
        isDisabled: false,
        variant: 'secondary' as const,
        expected: 'btn active btn-secondary',
      },
      {
        isActive: false,
        isDisabled: false,
        variant: 'primary' as const,
        expected: 'btn btn-primary',
      },
    ];

    testCases.forEach(({ isActive, isDisabled, variant, expected }) => {
      expect(
        cn(
          'btn',
          isActive && 'active',
          isDisabled && 'disabled',
          variant === 'primary' && 'btn-primary',
          variant === 'secondary' && 'btn-secondary'
        )
      ).toBe(expected);
    });
  });
});
