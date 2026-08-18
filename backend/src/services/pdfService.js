const PDFDocument = require('pdfkit');

const generatePaymentReceiptPDF = (payment, person, account, adminSettings, res) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  // Stream directly to response or file
  if (res) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Receipt_${payment.receiptNumber}.pdf`);
    doc.pipe(res);
  }

  const symbol = adminSettings?.currencySymbol || '₹';
  const bizName = adminSettings?.businessName || 'Payment Management & Lending Tracker';
  const bizAddress = adminSettings?.businessAddress || 'Official Admin Financial Services';
  const bizPhone = adminSettings?.businessPhone || '';

  // Header Banner
  doc.rect(40, 40, 515, 60).fill('#1E293B');
  doc.fillColor('#FFFFFF').fontSize(20).text(bizName.toUpperCase(), 60, 52, { bold: true });
  doc.fontSize(10).fillColor('#94A3B8').text(bizAddress, 60, 76);

  // Title
  doc.fillColor('#0F172A').fontSize(16).text('PAYMENT RECEIPT', 40, 120, { align: 'center', bold: true });
  doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(40, 142).lineTo(555, 142).stroke();

  // Receipt Meta
  doc.fontSize(10).fillColor('#475569');
  doc.text(`Receipt No: `, 40, 155, { continued: true }).fillColor('#0F172A').text(payment.receiptNumber, { bold: true });
  doc.fillColor('#475569').text(`Payment Date: `, 350, 155, { continued: true }).fillColor('#0F172A').text(new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));

  // Borrower Info
  doc.rect(40, 180, 515, 75).fill('#F8FAFC').stroke('#E2E8F0');
  doc.fillColor('#334155').fontSize(11).text('RECEIVED FROM:', 55, 192, { bold: true });
  doc.fontSize(13).fillColor('#0F172A').text(person.name, 55, 210);
  doc.fontSize(10).fillColor('#64748B').text(`Mobile: ${person.mobile} ${person.email ? '| Email: ' + person.email : ''}`, 55, 230);

  // Financial Table
  doc.rect(40, 270, 515, 30).fill('#3B82F6');
  doc.fillColor('#FFFFFF').fontSize(11).text('Particulars / Account ID', 55, 280);
  doc.text('Payment Method', 260, 280);
  doc.text('Amount Received', 420, 280, { align: 'right' });

  doc.rect(40, 300, 515, 45).fill('#FFFFFF').stroke('#E2E8F0');
  doc.fillColor('#0F172A').fontSize(11).text(`Account: ${account.accountNumber} (${account.purpose || 'General Loan'})`, 55, 315);
  doc.text(payment.paymentMethod.toUpperCase() + (payment.transactionId ? ` (${payment.transactionId})` : ''), 260, 315);
  doc.fontSize(14).fillColor('#16A34A').text(`${symbol}${payment.amount.toLocaleString('en-IN')}`, 420, 315, { align: 'right' });

  // Account Financial Summary Box
  doc.rect(40, 365, 515, 100).fill('#F1F5F9').stroke('#CBD5E1');
  doc.fillColor('#1E293B').fontSize(11).text('ACCOUNT FINANCIAL SUMMARY', 55, 378, { bold: true });
  
  doc.fontSize(10).fillColor('#475569');
  doc.text('Total Expected Return:', 55, 400);
  doc.fillColor('#0F172A').text(`${symbol}${account.expectedReturn.toLocaleString('en-IN')}`, 200, 400);

  doc.fillColor('#475569').text('Total Received till date:', 55, 420);
  doc.fillColor('#16A34A').text(`${symbol}${account.totalReceived.toLocaleString('en-IN')}`, 200, 420);

  doc.fillColor('#475569').text('Current Outstanding Balance:', 55, 440);
  doc.fillColor('#DC2626').text(`${symbol}${account.outstanding.toLocaleString('en-IN')}`, 200, 440, { bold: true });

  // Status Badge inside summary box
  doc.fillColor('#475569').text('Account Status:', 350, 400);
  doc.fillColor('#2563EB').text(account.status.toUpperCase(), 450, 400, { bold: true });

  // Footer Note
  const footerNote = adminSettings?.receiptFooterText || 'This is a computer-generated receipt. Thank you for your payment.';
  doc.fontSize(9).fillColor('#94A3B8').text(footerNote, 40, 520, { align: 'center', width: 515 });

  doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(40, 550).lineTo(555, 550).dash(5, { space: 5 }).stroke();
  doc.fontSize(8).fillColor('#CBD5E1').text('Lending Tracker Management System - Official Record', 40, 560, { align: 'center' });

  doc.end();
  return doc;
};

module.exports = { generatePaymentReceiptPDF };
