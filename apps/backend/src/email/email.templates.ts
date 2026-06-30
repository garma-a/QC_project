export const alertEmailTemplate = (data: {
  priority: string;
  machineName: string;
  testName: string;
  sectionName: string;
  measuredValue: number;
  zScore: number;
  ruleViolated: string;
  suggestedSolution: string;
  message: string;
  qcSystemUrl: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .header { background-color: #c41e3a; padding: 20px; color: white; text-align: center; }
    .content { padding: 20px; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
    .badge-high { background-color: #fee2e2; color: #991b1b; border: 1px solid #f87171; }
    .badge-medium { background-color: #fef3c7; color: #92400e; border: 1px solid #fbbf24; }
    .details { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .details th, .details td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .details th { width: 40%; color: #6b7280; font-weight: 500; }
    .action { margin-top: 30px; text-align: center; }
    .button { display: inline-block; padding: 12px 24px; background-color: #003366; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">QC System Alert</h2>
    </div>
    <div class="content">
      <p>A Quality Control deviation has been detected in the <strong>${data.sectionName}</strong> section.</p>
      
      <div style="margin: 15px 0;">
        <span class="badge ${data.priority === 'HIGH' ? 'badge-high' : 'badge-medium'}">
          ${data.priority} PRIORITY
        </span>
      </div>

      <p style="font-weight: 500; color: #111827;">${data.message}</p>

      <table class="details">
        <tr><th>Machine</th><td>${data.machineName}</td></tr>
        <tr><th>Test</th><td>${data.testName}</td></tr>
        <tr><th>Measured Value</th><td>${data.measuredValue}</td></tr>
        <tr><th>Z-Score</th><td>${data.zScore.toFixed(2)}</td></tr>
        <tr><th>Violated Rule</th><td>${data.ruleViolated}</td></tr>
      </table>

      ${data.suggestedSolution ? `
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; border-left: 4px solid #b8860b;">
        <p style="margin: 0; font-weight: bold; color: #4b5563; font-size: 14px;">Suggested Action:</p>
        <p style="margin: 5px 0 0 0;">${data.suggestedSolution}</p>
      </div>` : ''}

      <div class="action">
        <a href="${data.qcSystemUrl}/alerts" class="button">View in QC System</a>
      </div>

      <div class="footer">
        <p>You are receiving this email because you are subscribed to alerts for the ${data.sectionName} section.</p>
        <p>To manage your email preferences, <a href="${data.qcSystemUrl}/profile" style="color: #6b7280;">update your profile</a>.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const otpEmailTemplate = (data: {
  otp: string;
  purpose: 'signup' | 'reset-password';
  firstName?: string;
}) => {
  const title = data.purpose === 'signup' ? 'Verify Your Email' : 'Reset Your Password';
  const greeting = data.firstName ? `Hello ${data.firstName},` : 'Hello,';
  const description =
    data.purpose === 'signup'
      ? 'You are registering for the QC Management System. Use the OTP below to verify your email address.'
      : 'You requested to reset your password. Use the OTP below to proceed.';

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; background: #f9fafb; }
    .container { max-width: 520px; margin: 40px auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #c41e3a 0%, #003366 100%); padding: 28px 24px; color: white; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.85; }
    .content { padding: 32px 28px; }
    .otp-box { background: linear-gradient(135deg, #f0f4ff 0%, #fef3e2 100%); border: 2px dashed #b8860b; border-radius: 10px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #003366; font-family: "Courier New", monospace; }
    .otp-label { font-size: 12px; color: #6b7280; margin-top: 8px; }
    .warning { background: #fef3c7; border-left: 4px solid #b8860b; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #78350f; margin-top: 20px; }
    .footer { background: #f9fafb; padding: 16px 28px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 QC Management System</h1>
      <p>Magdi Yacoub Heart Center — Aswan Branch</p>
    </div>
    <div class="content">
      <p>${greeting}</p>
      <p>${description}</p>
      <div class="otp-box">
        <div class="otp-code">${data.otp}</div>
        <div class="otp-label">One-Time Password — Valid for 10 minutes</div>
      </div>
      <div class="warning">
        ⚠️ Do not share this code with anyone. If you did not request this, please ignore this email.
      </div>
    </div>
    <div class="footer">
      <p>© 2025 Magdi Yacoub Heart Center · Laboratory Quality Control System</p>
    </div>
  </div>
</body>
</html>
`;
};

