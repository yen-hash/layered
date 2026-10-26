# Browser prompt: send and receive email as hello@layeredsg.com

Paste everything under the line into your Chrome AI. You stay logged in and do the secret steps yourself.

---

You are helping me set up email for my website layeredsg.com. Work in my own logged-in Chrome. Go step by step, tell me what you see before each click that changes anything, and stop and ask me if anything looks different from what I describe.

Rules:
- Never read out, copy, screenshot or type any API key, password or one-time code. When a key or password must be entered, STOP and tell me to do that step myself.
- Do not change billing, plans, payment methods, or delete anything.
- Do not click any link inside an email.
- Only touch layeredsg.com. Do not change DNS records that already exist for other services (website, Render, Cloudflare proxy). Only ADD the records Resend asks for.

Goal: hello@layeredsg.com can (1) receive mail into my Gmail, and (2) be used as the "From" address when I send from Gmail, through Resend.

Part 1: Resend (resend.com, already logged in)
1. Open Domains. If layeredsg.com is not listed, click Add Domain and add layeredsg.com (region: the closest, Singapore if offered).
2. Resend will show DNS records (usually SPF, DKIM and optionally DMARC). Keep this page open.

Part 2: Cloudflare (dash.cloudflare.com, layeredsg.com, DNS, Records)
3. Add each record Resend lists, exactly as shown (type, name, value). For every record Resend gives, set Proxy status to "DNS only" (grey cloud), not proxied. If a record with the same name and type already exists, stop and ask me.
4. Go back to Resend and click Verify DNS Records. It can take a few minutes. Tell me the status of each record.

Part 3: Cloudflare Email Routing (receiving)
5. In Cloudflare for layeredsg.com open Email, then Email Routing. Enable it (accept the MX and TXT records it offers to add).
6. Create a custom address: hello@layeredsg.com, action "Send to an email", destination my Gmail address yenlauzengbin@gmail.com. Cloudflare will email a verification link to that Gmail: tell me, and I will click it myself.

Part 4: Resend API key (I do this part)
7. STOP and tell me: "Please open Resend, API Keys, Create API Key, name it layered-send, permission Sending access, domain layeredsg.com, and keep the key copied. Do not paste it to me." Wait for me to say done.

Part 5: Gmail "Send mail as" (I paste the key)
8. In Gmail open Settings (gear), See all settings, Accounts and Import, "Send mail as", Add another email address.
9. Name: Layered. Email: hello@layeredsg.com. Untick "Treat as an alias" only if I tell you to. Next.
10. SMTP server: smtp.resend.com. Port: 465. Secured connection using SSL. Username: resend. STOP before the Password box and tell me to paste the Resend API key myself and click Add Account.
11. Gmail will send a confirmation code to hello@layeredsg.com, which Cloudflare forwards to my Gmail. Tell me to read the code and enter it myself.

Part 6: Check
12. Tell me when it is done. Then I will send a test email from hello@layeredsg.com to another address of mine and check it arrives in the inbox (not spam), and that a reply to it reaches my Gmail.

After this I will separately set RESEND_API_KEY and EMAIL_FROM on the Render dashboard myself.
