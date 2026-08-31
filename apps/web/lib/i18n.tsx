'use client'

// ===========================================================================
// i18n — đổi ngôn ngữ VI/EN phía client (localStorage, không route mới).
// - Lớp 1: nav labels (MAIN_NAV/BOTTOM_NAV/PageHeader các trang chính) qua dict.
// - Lớp 2: các chuỗi UI khác giữ tiếng Việt (nội dung y khoa: WHO/ACOG bài bản
//   tiếng Việt — dịch máy sẽ sai chuyên ngữ, ghi nhận trong debt-ledger).
// - Mặc định VI; đổi qua nút 🌐 trên app-shell, lưu localStorage `mv-lang`.
// ===========================================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type Lang = 'vi' | 'en'
const STORAGE_KEY = 'mv-lang'

const dict = {
  // Nav chính (sidebar + bottom nav)
  'nav.home': { vi: 'Trang chủ', en: 'Home' },
  'nav.pregnancy': { vi: 'Thai kỳ', en: 'Pregnancy' },
  'nav.nutrition': { vi: 'Dinh dưỡng', en: 'Nutrition' },
  'nav.baby': { vi: 'Bé & sau sinh', en: 'Baby & postpartum' },
  'nav.babyShort': { vi: 'Bé', en: 'Baby' },
  'nav.handbook': { vi: 'Cẩm nang', en: 'Handbook' },
  'nav.family': { vi: 'Gia đình', en: 'Family' },
  'nav.group.main': { vi: 'Chính', en: 'Main' },
  'nav.group.pregnancy': { vi: 'Thai kỳ', en: 'Pregnancy' },
  'nav.group.nutrition': { vi: 'Dinh dưỡng', en: 'Nutrition' },
  'nav.group.baby': { vi: 'Bé & sau sinh', en: 'Baby & postpartum' },
  'nav.group.handbook': { vi: 'Cẩm nang', en: 'Handbook' },
  'nav.group.family': { vi: 'Gia đình', en: 'Family' },
  // App shell
  'shell.skip': { vi: 'Bỏ qua điều hướng', en: 'Skip navigation' },
  'shell.tagline': { vi: 'Đồng hành thai kỳ cùng gia đình Việt', en: 'Pregnancy companion for Vietnamese families' },
  'shell.logout': { vi: 'Đăng xuất', en: 'Log out' },
  'shell.demoMode': { vi: 'Chế độ demo', en: 'Demo mode' },
  'shell.connected': { vi: 'Đã kết nối', en: 'Connected' },
  'shell.notifications': { vi: 'Thông báo', en: 'Notifications' },
  'shell.settings': { vi: 'Cài đặt', en: 'Settings' },
  'shell.navQuick': { vi: 'Điều hướng nhanh', en: 'Quick navigation' },
  'shell.navMain': { vi: 'Điều hướng chính', en: 'Main navigation' },
  // Auth
  'auth.loginTitle': { vi: 'Đăng nhập để tiếp tục', en: 'Log in to continue' },
  'auth.registerTitle': { vi: 'Tạo tài khoản mới', en: 'Create a new account' },
  'auth.name': { vi: 'Tên của bạn', en: 'Your name' },
  'auth.email': { vi: 'Email', en: 'Email' },
  'auth.password': { vi: 'Mật khẩu', en: 'Password' },
  'auth.invite': { vi: 'Mã mời gia đình (không bắt buộc)', en: 'Family invite code (optional)' },
  'auth.submit': { vi: 'Đăng nhập', en: 'Log in' },
  'auth.submitRegister': { vi: 'Đăng ký', en: 'Sign up' },
  'auth.processing': { vi: 'Đang xử lý…', en: 'Processing…' },
  'auth.toRegister': { vi: 'Đăng ký ngay', en: 'Sign up now' },
  'auth.toLogin': { vi: 'Đăng nhập', en: 'Log in' },
  'auth.noAccount': { vi: 'Chưa có tài khoản?', en: "Don't have an account?" },
  'auth.haveAccount': { vi: 'Đã có tài khoản?', en: 'Already have an account?' },
  // Language toggle
  'lang.label': { vi: 'Ngôn ngữ', en: 'Language' },
} as const

export type LangKey = keyof typeof dict

interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: LangKey) => string
}

const LangContext = createContext<LangContextValue | undefined>(undefined)

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('vi')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'vi') setLangState(saved)
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
    document.documentElement.lang = l
  }, [])

  const t = useCallback((key: LangKey) => dict[key]?.[lang] ?? key, [lang])

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang phải dùng trong <LangProvider>')
  return ctx
}

/** Map href → dict key (nav). */
export const NAV_I18N: Record<string, { label: LangKey; group?: LangKey }> = {
  '/dashboard': { label: 'nav.home' },
  '/tuan': { label: 'nav.pregnancy', group: 'nav.group.pregnancy' },
  '/dinh-duong': { label: 'nav.nutrition', group: 'nav.group.nutrition' },
  '/be': { label: 'nav.baby', group: 'nav.group.baby' },
  '/cam-nang': { label: 'nav.handbook', group: 'nav.group.handbook' },
  '/cong-viec': { label: 'nav.family', group: 'nav.group.family' },
}
