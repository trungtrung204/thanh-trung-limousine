export type ManualPaymentInfo = {
  accountName: string;
  accountNo: string;
  amount: number;
  bankName: string;
  bookingCode: string;
  note: string;
  qrValue: string;
  reference: string;
};

export function makePaymentReference(bookingCode: string) {
  return `TT_${bookingCode.replace(/[^a-zA-Z0-9]/g, "")}`;
}

export function getManualPaymentConfig() {
  return {
    accountName: process.env.MANUAL_QR_ACCOUNT_NAME || "NGUYEN DUY TRUNG",
    accountNo: process.env.MANUAL_QR_ACCOUNT_NO || "2555 0550 55",
    bankName: process.env.MANUAL_QR_BANK_NAME || "TECHCOMBANK"
  };
}

export function makeManualPaymentInfo(input: {
  amount: number;
  bookingCode: string;
  reference?: string | null;
}): ManualPaymentInfo {
  const config = getManualPaymentConfig();
  const reference = input.reference || makePaymentReference(input.bookingCode);

  return {
    ...config,
    amount: input.amount,
    bookingCode: input.bookingCode,
    note: "Thanh toán QR thủ công - nhà xe sẽ xác nhận sau khi nhận tiền",
    qrValue: [
      `BANK:${config.bankName}`,
      `ACCOUNT:${config.accountNo}`,
      `NAME:${config.accountName}`,
      `AMOUNT:${input.amount}`,
      `CONTENT:${reference}`
    ].join("|"),
    reference
  };
}
