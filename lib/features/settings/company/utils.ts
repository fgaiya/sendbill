import { DEFAULT_FORM_VALUES } from './constants';
import { Company, CompanyFormData } from './types';

/**
 * 会社データをフォームデータに変換するヘルパー関数
 */
export const getFormDataFromCompany = (
  company: Company | null
): CompanyFormData => {
  if (!company) return DEFAULT_FORM_VALUES;

  return {
    companyName: company.companyName || '',
    businessName: company.businessName || '',
    logoUrl: company.logoUrl || '',
    postalCode: company.postalCode || '',
    prefecture: company.prefecture || '',
    city: company.city || '',
    street: company.street || '',
    phone: company.phone || '',
    contactEmail: company.contactEmail || '',
    invoiceRegistrationNumber: company.invoiceRegistrationNumber || '',
    representativeName: company.representativeName || '',
    bankName: company.bankName || '',
    bankBranch: company.bankBranch || '',
    bankAccountNumber: company.bankAccountNumber || '',
    bankAccountHolder: company.bankAccountHolder || '',
  };
};
