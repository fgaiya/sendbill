import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('レンダリングされること', () => {
    render(<Button>テストボタン</Button>)
    expect(screen.getByRole('button', { name: 'テストボタン' })).toBeInTheDocument()
  })

  it('クリックイベントが発火すること', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>クリック</Button>)
    
    await user.click(screen.getByRole('button', { name: 'クリック' }))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('無効状態が正しく適用されること', () => {
    render(<Button disabled>無効ボタン</Button>)
    const button = screen.getByRole('button', { name: '無効ボタン' })
    
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('disabled')
  })

  it('variantプロップが正しく適用されること', () => {
    const { rerender } = render(<Button>デフォルト</Button>)
    let button = screen.getByRole('button', { name: 'デフォルト' })
    expect(button).toHaveClass('bg-primary')

    rerender(<Button variant="destructive">削除</Button>)
    button = screen.getByRole('button', { name: '削除' })
    expect(button).toHaveClass('bg-destructive')

    rerender(<Button variant="outline">アウトライン</Button>)
    button = screen.getByRole('button', { name: 'アウトライン' })
    expect(button).toHaveClass('border')

    rerender(<Button variant="secondary">セカンダリ</Button>)
    button = screen.getByRole('button', { name: 'セカンダリ' })
    expect(button).toHaveClass('bg-secondary')

    rerender(<Button variant="ghost">ゴースト</Button>)
    button = screen.getByRole('button', { name: 'ゴースト' })
    expect(button).toHaveClass('hover:bg-accent')

    rerender(<Button variant="link">リンク</Button>)
    button = screen.getByRole('button', { name: 'リンク' })
    expect(button).toHaveClass('text-primary', 'underline-offset-4')
  })

  it('sizeプロップが正しく適用されること', () => {
    const { rerender } = render(<Button>デフォルトサイズ</Button>)
    let button = screen.getByRole('button', { name: 'デフォルトサイズ' })
    expect(button).toHaveClass('h-9')

    rerender(<Button size="sm">小サイズ</Button>)
    button = screen.getByRole('button', { name: '小サイズ' })
    expect(button).toHaveClass('h-8')

    rerender(<Button size="lg">大サイズ</Button>)
    button = screen.getByRole('button', { name: '大サイズ' })
    expect(button).toHaveClass('h-10')

    rerender(<Button size="icon">アイコン</Button>)
    button = screen.getByRole('button', { name: 'アイコン' })
    expect(button).toHaveClass('size-9')
  })

  it('カスタムクラスが適用されること', () => {
    render(<Button className="custom-class">カスタム</Button>)
    const button = screen.getByRole('button', { name: 'カスタム' })
    expect(button).toHaveClass('custom-class')
  })

  it('asChild=trueの場合、Slotコンポーネントが使用されること', () => {
    render(
      <Button asChild>
        <a href="/test">リンクボタン</a>
      </Button>
    )
    
    const link = screen.getByRole('link', { name: 'リンクボタン' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
    expect(link).toHaveAttribute('data-slot', 'button')
  })

  it('asChildでvariantとsizeが適用されること', () => {
    render(
      <Button asChild variant="destructive" size="lg">
        <a href="/delete">削除リンク</a>
      </Button>
    )
    
    const link = screen.getByRole('link', { name: '削除リンク' })
    expect(link).toHaveClass('bg-destructive', 'h-10')
  })

  it('無効状態ではクリックイベントが発火しないこと', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    
    render(<Button disabled onClick={handleClick}>無効ボタン</Button>)
    
    const button = screen.getByRole('button', { name: '無効ボタン' })
    await user.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
  })
})