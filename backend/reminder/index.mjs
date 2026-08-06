import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const REGION = "ap-south-1";
const MY_EMAIL = process.env.MY_EMAIL;

const ses = new SESClient({ region: REGION });

export const handler = async (event) => {
  try {
    const { company, role, email, date, jobUrl, notes } = event;

    await ses.send(new SendEmailCommand({
      Source: MY_EMAIL,
      Destination: { ToAddresses: [MY_EMAIL] },
      Message: {
        Subject: {
          Data: `⏰ Follow Up Reminder — ${company} | ${role}`
        },
        Body: {
          Text: {
            Data: `Time to follow up with ${company} for ${role} role!`
          },
          Html: {
            Data: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background: #F8FAFC; margin: 0; padding: 20px; }
        .container { max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        .header { background: #0A1628; padding: 24px 32px; }
        .header h1 { color: white; margin: 0; font-size: 18px; }
        .header p { color: #93C5FD; margin: 4px 0 0; font-size: 13px; }
        .body { padding: 28px 32px; }
        .alert-box { background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
        .alert-box p { margin: 0; font-size: 13px; color: #92400E; font-weight: 500; }
        .field { margin-bottom: 14px; }
        .field-label { font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; }
        .field-value { font-size: 14px; color: #1E293B; font-weight: 500; }
        .divider { border: none; border-top: 1px solid #E2E8F0; margin: 20px 0; }
        .btn { display: inline-block; background: #1A56DB; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }
        .tips-box { background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 14px 16px; margin-top: 20px; }
        .tips-box p { margin: 0 0 6px; font-size: 13px; color: #065F46; }
        .tips-box ul { margin: 6px 0 0; padding-left: 18px; }
        .tips-box li { font-size: 12px; color: #065F46; margin-bottom: 4px; }
        .footer { background: #F8FAFC; padding: 16px 32px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ Time to Follow Up!</h1>
            <p>Job Application Tracker</p>
        </div>
        <div class="body">
            <div class="alert-box">
                <p>🎯 It's been a few days since you applied to <strong>${company}</strong> for <strong>${role}</strong>. Now is the perfect time to follow up!</p>
            </div>
            <div class="field">
                <div class="field-label">Company</div>
                <div class="field-value">${company}</div>
            </div>
            <div class="field">
                <div class="field-label">Role</div>
                <div class="field-value">${role}</div>
            </div>
            <div class="field">
                <div class="field-label">Date Applied</div>
                <div class="field-value">${date}</div>
            </div>
            <div class="field">
                <div class="field-label">Notes</div>
                <div class="field-value">${notes || "None"}</div>
            </div>
            <hr class="divider"/>
            <a href="${jobUrl}" class="btn">View Job Posting →</a>
            <div class="tips-box">
                <p><strong>💡 Follow Up Tips:</strong></p>
                <ul>
                    <li>Send a polite email to the recruiter</li>
                    <li>Mention your application date</li>
                    <li>Express continued interest in the role</li>
                    <li>Keep it short and professional</li>
                </ul>
            </div>
        </div>
        <div class="footer">
            Job Application Tracker · Built by RoselinJanice · Powered by AWS
        </div>
    </div>
</body>
</html>`
          }
        }
      }
    }));

    return { status: "Reminder sent successfully!" };

  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
};