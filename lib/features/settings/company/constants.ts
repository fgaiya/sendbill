import { CompanyFormData } from './types';

// 成功メッセージ表示時間（3秒）
export const SUCCESS_MESSAGE_DURATION = 3000;

// フォームのデフォルト値
export const DEFAULT_FORM_VALUES: CompanyFormData = {
  companyName: '',
  businessName: '',
  logoUrl: '',
  address: '',
  phone: '',
  contactEmail: '',
  invoiceRegistrationNumber: '',
  representativeName: '',
  bankName: '',
  bankBranch: '',
  bankAccountNumber: '',
  bankAccountHolder: '',
};
