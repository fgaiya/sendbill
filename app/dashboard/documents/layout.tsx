import { ReactNode } from 'react';

interface DocumentsLayoutProps {
  children: ReactNode;
}

export default function DocumentsLayout({ children }: DocumentsLayoutProps) {
  return <>{children}</>;
}
