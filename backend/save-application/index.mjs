import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { randomUUID } from "crypto";

const REGION = "ap-south-1";
const TABLE_NAME = process.env.TABLE_NAME;
const MY_EMAIL = process.env.MY_EMAIL;
const STATE_MACHINE_ARN = process.env.STATE_MACHINE_ARN;

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const ses = new SESClient({ region: REGION });
const sfn = new SFNClient({ region: REGION });

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const handler = async (event) => {
  try {
    const body = typeof event.body === "string"
      ? JSON.parse(event.body)
      : (event.body ?? event);

    const { company = "", role = "", email = "",
            date = "", jobUrl = "", status = "", notes = "" , reminderDays= 7} = body;

    // ✅ Validation
    if (!company || !role || !email || !date || !jobUrl || !status) {
      return response(400, { error: "All required fields must be filled" });
    }

    if (!emailRe.test(email)) {
      return response(400, { error: "Invalid email format" });
    }

    // ✅ Generate unique ID and timestamp
    const id = randomUUID();
    const timestamp = new Date().toISOString();

    // ✅ Save to DynamoDB
    await dynamo.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: { id, company, role, email, date, jobUrl, status, notes, timestamp }
    }));

    // ✅ Send confirmation email
    await ses.send(new SendEmailCommand({
      Source: MY_EMAIL,
      Destination: { ToAddresses: [MY_EMAIL] },
      Message: {
          Subject: { Data: `✅ Application Saved — ${company} | ${role}` },
          Body: {
              Text: {
                  Data: `Application saved for ${company} | ${role}. Follow up reminder in ${reminderDays} days.`
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
          .badge { display: inline-block; background: #EFF6FF; color: #1A56DB; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
          .field { margin-bottom: 14px; }
          .field-label { font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; }
          .field-value { font-size: 14px; color: #1E293B; font-weight: 500; }
          .divider { border: none; border-top: 1px solid #E2E8F0; margin: 20px 0; }
          .btn { display: inline-block; background: #1A56DB; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }
          .reminder-box { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 14px 16px; margin-top: 20px; }
          .reminder-box p { margin: 0; font-size: 13px; color: #1E40AF; }
          .footer { background: #F8FAFC; padding: 16px 32px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>✅ Application Saved!</h1>
              <p>Job Application Tracker</p>
          </div>
          <div class="body">
              <span class="badge">${status}</span>
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
              <div class="reminder-box">
                  <p>⏰ A follow-up reminder will be sent in <strong>${reminderDays} days</strong>. Stay proactive!</p>
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
    //Calculate wait seconds dynamically
    const waitSeconds = parseInt(reminderDays) * 24 * 60 * 60;

    // ✅ Start Step Functions workflow
    await sfn.send(new StartExecutionCommand({
      stateMachineArn: STATE_MACHINE_ARN,
      name: `jobtracker-${id}`,
      input: JSON.stringify({
        company, role, email,
        date, jobUrl, status, notes, id,
        waitSeconds
      })
    }));

    return response(200, { ok: true, id });

  } catch (err) {
    console.error("Error:", err);
    return response(500, { error: "Internal server error" });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST",
      "Access-Control-Allow-Headers": "Content-Type"
    },
    body: JSON.stringify(body)
  };
}