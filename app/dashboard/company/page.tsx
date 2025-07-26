'use client';

import { CompanyForm } from '@/components/features/settings/company';

export default function CompanyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto">
        <CompanyForm />
      </div>
    </div>
  );
}
