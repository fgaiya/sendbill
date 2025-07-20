'use client'

import React, { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FormFieldWrapper } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { commonValidationSchemas } from '@/lib/shared/forms'

// フォームのバリデーションスキーマ
const demoFormSchema = z.object({
  name: commonValidationSchemas.requiredString('名前'),
  email: commonValidationSchemas.email,
  phone: commonValidationSchemas.phoneNumber,
  website: commonValidationSchemas.url,
})

type DemoFormData = z.infer<typeof demoFormSchema>

export default function FormDemoPage() {
  const [submitError, setSubmitError] = useState<string>()
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const form = useForm<DemoFormData>({
    resolver: zodResolver(demoFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      website: '',
    },
    mode: 'onBlur',
  })

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid, isDirty }
  } = form

  const onSubmit = async (data: DemoFormData) => {
    try {
      setSubmitError(undefined)
      setSubmitSuccess(false)
      
      // シミュレートされた送信処理
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // 10%の確率でエラーをシミュレート
          if (Math.random() < 0.1) {
            reject(new Error('サーバーエラーが発生しました'))
          } else {
            resolve(undefined)
          }
        }, 1000)
      })
      
      console.log('フォームデータ:', data)
      setSubmitSuccess(true)
      
      // 3秒後に成功メッセージを自動で非表示
      setTimeout(() => setSubmitSuccess(false), 3000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'エラーが発生しました'
      setSubmitError(message)
    }
  }

  const handleReset = () => {
    reset({
      name: '',
      email: '',
      phone: '',
      website: '',
    })
    setSubmitError(undefined)
    setSubmitSuccess(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto">
        <Card className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">フォームデモ</h1>
            <p className="text-gray-600 mt-2">
              react-hook-form と zod を使用したフォーム例
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 基本情報 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">基本情報</h3>
              
              {/* 名前 */}
              <Controller
                control={control}
                name="name"
                render={({ field }) => (
                  <FormFieldWrapper
                    label="名前"
                    id="name"
                    required
                    error={errors.name?.message}
                  >
                    <Input
                      {...field}
                      id="name"
                      placeholder="田中太郎"
                      disabled={isSubmitting}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormFieldWrapper>
                )}
              />

              {/* メールアドレス */}
              <Controller
                control={control}
                name="email"
                render={({ field }) => (
                  <FormFieldWrapper
                    label="メールアドレス"
                    id="email"
                    required
                    error={errors.email?.message}
                  >
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      placeholder="example@example.com"
                      disabled={isSubmitting}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormFieldWrapper>
                )}
              />
            </div>

            {/* 連絡先（任意） */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">連絡先（任意）</h3>
              
              {/* 電話番号 */}
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <FormFieldWrapper
                    label="電話番号"
                    id="phone"
                    error={errors.phone?.message}
                    description="ハイフンありまたはなしで入力してください"
                  >
                    <Input
                      {...field}
                      id="phone"
                      placeholder="090-1234-5678"
                      disabled={isSubmitting}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormFieldWrapper>
                )}
              />

              {/* ウェブサイト */}
              <Controller
                control={control}
                name="website"
                render={({ field }) => (
                  <FormFieldWrapper
                    label="ウェブサイト"
                    id="website"
                    error={errors.website?.message}
                    description="https://から始まるURLを入力してください"
                  >
                    <Input
                      {...field}
                      id="website"
                      placeholder="https://example.com"
                      disabled={isSubmitting}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormFieldWrapper>
                )}
              />
            </div>

            {/* 送信結果メッセージ */}
            {submitSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md animate-in fade-in-0 slide-in-from-top-2">
                <p className="text-green-800 text-sm font-medium">
                  ✓ フォームが正常に送信されました！
                </p>
              </div>
            )}
            
            {submitError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md animate-in fade-in-0 slide-in-from-top-2">
                <p className="text-red-800 text-sm font-medium">
                  ✗ {submitError}
                </p>
              </div>
            )}

            {/* アクション */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isSubmitting}
              >
                リセット
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isValid}
                className={isSubmitting ? 'cursor-wait' : ''}
              >
                {isSubmitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                )}
                {isSubmitting ? '送信中...' : '送信'}
              </Button>
            </div>
          </form>

          {/* フォーム状態表示 */}
          <div className="mt-6 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold text-sm text-gray-700 mb-2">フォーム状態</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>有効: {isValid ? 'はい' : 'いいえ'}</li>
              <li>変更済み: {isDirty ? 'はい' : 'いいえ'}</li>
              <li>送信中: {isSubmitting ? 'はい' : 'いいえ'}</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}