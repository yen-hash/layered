// lib/notify.js — lead notification dispatch.
//
// This ships with a zero-dependency "log" driver so the app runs out of the
// box with no API keys. Swap in real providers by setting env vars — the
// call sites (routes/leads.js) never need to change.
//
// EMAIL: set RESEND_API_KEY (https://resend.com) to send real emails via
//        their HTTPS API (fetch, no SDK needed). Falls back to console/log
//        file if unset.
// SMS/WhatsApp: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
//        (a WhatsApp-enabled Twilio number, e.g. "whatsapp:+14155238886")
//        to send via Twilio's HTTPS API. Falls back to console/log file if unset.

import fs from 'node:fs';
import path from 'node:path';

const LOG_PATH = path.join(process.cwd(), 'data', 'notifications.log');

function logNotification(entry) {
  const line = `[${new Date().toISOString()}] ${entry}\n`;
  fs.appendFileSync(LOG_PATH, line);
  console.log(line.trim());
}

export async function sendLeadEmail(business, lead) {
  const subject = `New lead: ${lead.name} is looking for a ${lead.property_type || 'renovation'} designer`;
  const body = [
    `Hi ${business.contact_name || business.company_name},`,
    ``,
    `You have a new lead from Layered:`,
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Phone: ${lead.phone || '-'}`,
    `Property type: ${lead.property_type || '-'}`,
    `Style: ${lead.style || '-'}`,
    `Budget: ${lead.budget_range || '-'}`,
    `Location: ${lead.location || '-'}`,
    `Message: ${lead.message || '-'}`,
    ``,
    `Reply to this homeowner directly, or view it in your dashboard.`,
  ].join('\n');

  if (!business.notify_email) return;

  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'leads@designmatch.example',
          to: business.email,
          subject,
          text: body,
        }),
      });
      if (!res.ok) throw new Error(`Resend API responded ${res.status}`);
      logNotification(`EMAIL sent via Resend to ${business.email} for lead #${lead.id}`);
      return;
    } catch (err) {
      logNotification(`EMAIL FAILED via Resend to ${business.email} for lead #${lead.id}: ${err.message}`);
      // fall through to log driver so the lead is never silently dropped
    }
  }

  logNotification(`EMAIL (log driver, no RESEND_API_KEY set) to ${business.email}:\nSubject: ${subject}\n${body}`);
}

export async function sendLeadSms(business, lead) {
  if (!business.notify_sms || !business.notify_phone) return;
  const text = `New Layered lead: ${lead.name} (${lead.property_type || 'renovation'}, budget ${lead.budget_range || 'n/a'}). Check your dashboard to respond.`;

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) {
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: process.env.TWILIO_FROM,
          To: business.notify_phone,
          Body: text,
        }),
      });
      if (!res.ok) throw new Error(`Twilio API responded ${res.status}`);
      logNotification(`SMS/WhatsApp sent via Twilio to ${business.notify_phone} for lead #${lead.id}`);
      return;
    } catch (err) {
      logNotification(`SMS/WhatsApp FAILED via Twilio to ${business.notify_phone} for lead #${lead.id}: ${err.message}`);
    }
  }

  logNotification(`SMS/WhatsApp (log driver, no TWILIO_* env vars set) to ${business.notify_phone || '(no number on file)'}:\n${text}`);
}

export async function dispatchLeadNotifications(business, lead) {
  await Promise.all([sendLeadEmail(business, lead), sendLeadSms(business, lead)]);
}
