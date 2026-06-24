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
