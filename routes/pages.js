// routes/pages.js — About, Privacy and Terms. Plain-English drafts: have them reviewed before heavy promotion.
import { esc, layout } from '../lib/render.js';
import { breadcrumbNav } from '../lib/components.js';

const contact = () => {
  const e = process.env.CONTACT_EMAIL || '';
  return /^[^@\s<>"]+@[^@\s<>"]+$/.test(e)
    ? `email us at <a href="mailto:${esc(e)}">${esc(e)}</a>`
    : 'send us a message through the enquiry form on the <a href="/">home page</a>';
};

const PAGES = {
  about: {
    title: 'About Layered',
    description: 'Layered helps Singapore homeowners compare interior designers, check HDB licence and CaseTrust credentials, and plan a renovation with free guides.',
    h1: 'About Layered',
    html: () => `
    <p>Layered is a directory of Singapore interior designers and renovation firms, with free tools and guides for homeowners. We built it because choosing a designer is a big decision, and the basic facts (who is licensed, what a job should cost, what to put in a contract) are harder to find than they should be.</p>
    <h2>What you can do here</h2>
    <ul>
      <li><a href="/designers">Compare designers</a> by property type, style and budget, and shortlist the ones you like.</li>
      <li>See each firm's HDB licence and CaseTrust details, and whether our team has checked them.</li>
      <li>Estimate a budget with the <a href="/tools/renovation-cost-calculator">renovation cost calculator</a>.</li>
      <li>Read the <a href="/guides/renovation-for-beginners-singapore">beginner's guide</a>, the <a href="/guides/renovation-checklist-singapore">checklist</a> and the <a href="/blog">blog</a>.</li>
    </ul>
    <h2>How we work</h2>
    <p>Homeowners use Layered for free. Firms list their business and can receive enquiries that match the work they take on. Credentials shown on a profile are declared by the firm unless the profile says our team checked them against the official lookups, with the date. Reviews on Layered come from homeowners who were invited to review a real enquiry.</p>
    <h2>Get in touch</h2>
    <p>Questions, corrections or a firm that wants to be listed: ${contact()}.</p>`,
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'How Layered collects, uses and shares personal data from homeowners and renovation firms in Singapore, and the choices you have under the PDPA.',
    h1: 'Privacy Policy',
    html: () => `
    <p>This policy explains what personal data Layered collects, why, and who sees it. We handle personal data in line with Singapore's Personal Data Protection Act (PDPA).</p>
    <h2>What we collect</h2>
    <ul>
      <li><strong>Homeowner enquiries:</strong> your name, email, phone number, property type, location, budget and the project details you write.</li>
      <li><strong>Firm accounts:</strong> business name, contact details, credentials, portfolio photos and project information, plus your login email and a hashed password.</li>
      <li><strong>Reviews:</strong> the review you write and your name as you choose to show it.</li>
      <li><strong>Usage data:</strong> basic technical information such as pages visited and device type, collected through cookies and, if enabled, Google Analytics.</li>
    </ul>
    <h2>How we use it</h2>
    <ul>
      <li>To pass your enquiry to the firms that match it. Matched firms receive the details you submitted so they can contact you.</li>
      <li>To run accounts, send service emails such as password resets and review invitations, and keep the site secure.</li>
      <li>To understand which pages are useful and improve the site.</li>
    </ul>
    <p>We do not sell your personal data.</p>
    <h2>Who we share it with</h2>
    <ul>
      <li><strong>Matched firms</strong>, for homeowner enquiries.</li>
      <li><strong>Service providers</strong> that host the site and send email on our behalf, and Google if analytics is switched on.</li>
      <li>Authorities, where the law requires it.</li>
    </ul>
    <h2>Cookies</h2>
    <p>We use a session cookie to keep firms logged in, and a small cookie or local storage to remember your shortlist. If analytics is enabled, Google Analytics sets cookies to measure traffic. You can block cookies in your browser settings, though logging in will not work without the session cookie.</p>
    <h2>Keeping and deleting data</h2>
    <p>We keep personal data only as long as we need it for the purposes above or the law requires. You can ask us to delete your enquiry or account.</p>
    <h2>Your choices</h2>
    <p>You can ask to access or correct the personal data we hold about you, or withdraw your consent to our using it. To do so, ${contact()}. Firms can edit their own profile and photos from their dashboard.</p>
    <h2>Changes</h2>
    <p>We may update this policy and will change the date below when we do. Last updated: October 2026.</p>`,
  },
  terms: {
    title: 'Terms of Use',
    description: 'The terms for using Layered: how the directory works, what firms and homeowners are responsible for, and the limits of our role.',
    h1: 'Terms of Use',
    html: () => `
    <p>By using Layered you agree to these terms. If you do not agree, please do not use the site.</p>
    <h2>What Layered is</h2>
    <p>Layered is a directory and information service. We are not a renovation contractor, and we are not a party to any contract between a homeowner and a firm. Any agreement, payment or dispute is between you and the firm.</p>
    <h2>Information on the site</h2>
    <p>Guides, cost ranges and estimates are general information and indicative only. They are not professional, legal or financial advice. Check current rules with HDB, your management corporation and the relevant authorities, and get written quotes before you commit.</p>
    <h2>Firm listings and credentials</h2>
    <p>Firms are responsible for the accuracy of their profiles, credentials, photos and project details, and must have the right to publish the photos they upload. Credentials are declared by the firm unless the profile shows a verification mark and date from our team. We may remove or correct a listing, review or photo that is inaccurate, misleading or infringing.</p>
    <h2>Homeowners</h2>
    <p>Enquiries must be genuine and accurate. Do not use the site to send spam or to harass firms. Do your own checks on any firm before you pay a deposit.</p>
    <h2>Reviews</h2>
    <p>Reviews must be honest and based on your own experience. We may decline or remove reviews that are abusive, fake or off topic.</p>
    <h2>Liability</h2>
    <p>The site is provided as is. To the extent the law allows, Layered is not liable for losses arising from your dealings with any firm or from reliance on information on the site.</p>
    <h2>Changes and contact</h2>
    <p>We may update these terms. Continued use means you accept the updated terms. Questions: ${contact()}. Last updated: October 2026.</p>`,
  },
};

export const PAGE_PATHS = Object.keys(PAGES).map((k) => `/${k}`);

export function infoPageRoute(req, res, ctx, key) {
  const p = PAGES[key];
  if (!p) return false;
  const path = `/${key}`;
  const body = `<section class="wrap page-head prose">
    ${breadcrumbNav([{ name: 'Home', path: '/' }, { name: p.h1, path }])}
    <h1>${esc(p.h1)}</h1>
    ${p.html()}
  </section>`;
  res.end(layout({ title: p.title, description: p.description, path, site: ctx.site, business: ctx.business, flash: ctx.flash, body }));
  return true;
}
