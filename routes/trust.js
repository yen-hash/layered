// routes/trust.js — /for-designers (why and how a firm lists) and /how-layered-works (verification, reviews, listing order
// and how Layered earns). Everything stated here must stay true to the code: credentials are checked by an admin and the
// mark is voided when the value changes (lib/credentials.js), reviews are invited after an enquiry is won and read before
// publishing (routes/reviews.js), contact details are masked on the server until a firm has access (lib/leadAccess.js).
import { esc, layout } from '../lib/render.js';
import { breadcrumbSchema, faqSchema } from '../lib/seo.js';
import { breadcrumbNav, faqHtml } from '../lib/components.js';
import { TRIAL_MONTHS, PURGE_DAYS } from '../lib/leadAccess.js';

const contact = () => {
  const e = process.env.CONTACT_EMAIL || '';
  return /^[^@\s<>"]+@[^@\s<>"]+$/.test(e) ? `<a href="mailto:${esc(e)}">${esc(e)}</a>` : 'the enquiry form on the <a href="/">home page</a>';
};

const FIRM_FAQS = [
  { q: 'Is it free to list my firm?', a: `Yes. Creating a profile, adding projects and receiving enquiries costs nothing to start. For the first ${TRIAL_MONTHS} months you see the full contact details of every homeowner who enquires.` },
  { q: `What happens after the first ${TRIAL_MONTHS} months?`, a: 'Enquiries still reach your dashboard with the project details: property type, style, budget range, location and the homeowner\'s message. The homeowner\'s name, phone number and email are hidden unless you take a plan or unlock an individual enquiry. Your listing stays up either way, and enquiries you already received keep their details.' },
  { q: 'How much does a plan cost?', a: 'Plans are agreed with you directly and there is no charge to list. Ask us and we will tell you the current terms before you commit to anything.' },
  { q: 'Who sees a homeowner\'s phone number?', a: `Only firms that have access. Enquirers are told their contact details stay hidden from a firm until it unlocks the enquiry, and that if no firm unlocks it we delete their details after ${PURGE_DAYS} days.` },
  { q: 'Do you rank firms by who pays?', a: 'Directory pages show firms we have marked Featured first, labelled as Featured, and then the newest listings. Reviews and credential checks are never for sale.' },
  { q: 'How do I get the verified HDB licence or CaseTrust mark?', a: 'Add your licence number or CaseTrust tier to your profile. Our team checks it against the official lookups and records the date. If you later change the number or tier, the verified mark is removed until it is checked again. Until then it shows as self-declared.' },
  { q: 'Can I remove my profile?', a: 'Yes, at any time. Ask us and we will delete the profile, its projects and photos.' },
  { q: 'Whose photos can I upload?', a: 'Only photos you own or have written permission to publish. You confirm this each time you upload.' },
];

const HOW_FAQS = [
  { q: 'Does Layered recommend one firm over another?', a: 'No. We show firms that match your search. Firms marked Featured appear first and are labelled. We do not guarantee any firm\'s work, so compare itemised quotations and check credentials yourself.' },
  { q: 'Can a firm pay to change or remove a review?', a: 'No. Reviews are written by homeowners who enquired through Layered, after a firm marks the enquiry as won and asks us to invite them. We read every review before it appears and publish honest reviews whether they are positive or negative.' },
  { q: 'Who sees my phone number and email?', a: `A firm sees your project details straight away. Your name, phone number and email stay hidden until that firm has access, for example through a plan or by unlocking your enquiry. If no firm unlocks your enquiry we delete your contact details after ${PURGE_DAYS} days.` },
  { q: 'How does Layered make money?', a: `Homeowners use Layered for free. Firms can list for free and, after an initial ${TRIAL_MONTHS}-month period, take a plan or unlock individual enquiries to see homeowners' contact details.` },
  { q: 'What does "verified" mean on a badge?', a: 'Our team checked the licence number or CaseTrust tier against the official lookup and recorded the date. Registrations can lapse, so confirm it is still current before signing a contract. Without the mark, the credential is self-declared by the firm.' },
];

function page(res, ctx, { path, crumbs, title, description, body, faqs, extraLd = [] }) {
  const site = ctx.site;
  res.end(layout({
    title, description, path, site, business: ctx.business, flash: ctx.flash,
    body: `<section class="wrap page-head prose">${breadcrumbNav(crumbs)}${body}${faqHtml(faqs)}</section>`,
    jsonLd: [breadcrumbSchema(site, crumbs), faqSchema(faqs), ...extraLd],
  }));
}

export async function forDesignersRoute(req, res, ctx) {
  const path = '/for-designers';
  page(res, ctx, {
    path,
    crumbs: [{ name: 'Home', path: '/' }, { name: 'For designers', path }],
    title: 'List Your Interior Design Firm in Singapore (Free)',
    description: `List your Singapore interior design or renovation firm on Layered for free: show your projects, get your HDB licence and CaseTrust verified, and receive homeowner enquiries.`,
    faqs: FIRM_FAQS,
    body: `
    <span class="eyebrow">For interior designers and renovation firms</span>
    <h1>List your firm on Layered, free</h1>
    <p class="lead">Singapore homeowners use Layered to compare interior designers, check HDB licence and CaseTrust details, and plan a renovation. A profile takes about ten minutes, and enquiries go straight to your dashboard.</p>
    <p><a class="btn" href="/signup">Create your free profile</a> <a class="btn btn-outline" href="/designers">See how firms appear</a></p>

    <h2>What you get</h2>
    <ul>
      <li><strong>A profile and project gallery</strong> with your own photos, your styles, areas and the property types you take on.</li>
      <li><strong>Credential badges.</strong> Add your HDB licence and CaseTrust details. Once our team checks them against the official lookups, the badge shows the date we checked.</li>
      <li><strong>Enquiries in your dashboard</strong> from homeowners whose project matches your work, or sent straight from your profile.</li>
      <li><strong>Verified reviews.</strong> After you mark an enquiry as won, we can invite the homeowner to review you. We read every review before it is published.</li>
      <li><strong>Homeowners who are already planning.</strong> They arrive from free tools such as the <a href="/tools/renovation-budget-planner">budget planner</a>, the <a href="/tools/renovation-cost-estimator">cost estimator</a> and the <a href="/tools/room-planner">room planner</a>.</li>
    </ul>

    <h2>How it works</h2>
    <ol>
      <li><strong>Sign up</strong> with your business email and choose your type of business.</li>
      <li><strong>Add your profile and 3 to 6 projects</strong> with photos you own or have permission to publish.</li>
      <li><strong>Add your credentials</strong> so we can verify them.</li>
      <li><strong>Receive enquiries</strong> and reply to the homeowner directly.</li>
    </ol>

    <h2>The terms, in plain language</h2>
    <p>Listing is free. For the first ${TRIAL_MONTHS} months you see the full contact details of every homeowner who enquires. After that, enquiries still arrive with the project details, but the homeowner's name, phone and email are hidden unless you take a plan or unlock an enquiry. Homeowners are told this when they send an enquiry. You can remove your profile at any time. Questions before you sign up: ${contact()}.</p>
    <p>Credentials you add are shown as self-declared until we have checked them. We never show a verified mark for something we have not checked. See <a href="/how-layered-works">how Layered works</a> for our rules on credentials, reviews and listing order.</p>`,
  });
}

export async function howItWorksRoute(req, res, ctx) {
  const path = '/how-layered-works';
  page(res, ctx, {
    path,
    crumbs: [{ name: 'Home', path: '/' }, { name: 'How Layered works', path }],
    title: 'How Layered Works: Verification, Reviews and Our Rules',
    description: 'How Layered checks HDB licence and CaseTrust details, how reviews are collected and moderated, who sees your contact details and how the directory is ordered.',
    faqs: HOW_FAQS,
    body: `
    <h1>How Layered works</h1>
    <p class="lead">Choosing a renovation firm is a big decision. These are our rules, in plain language, so you know what you are looking at.</p>

    <h2>Credentials</h2>
    <p>Firms can list an HDB renovation contractor licence number and a CaseTrust tier. Until our team has checked it, a credential is labelled self-declared. To verify one, we look the firm up on the official HDB or CASE lookup and record the date. If the firm later changes the number or tier, the verified mark is removed until it is checked again, and a check older than a year no longer counts. Even a verified mark is a snapshot: confirm it is current before you sign. See <a href="/guides/casetrust-and-hdb-licence-explained">CaseTrust and HDB licence explained</a> and <a href="/blog/how-to-check-hdb-licensed-contractor">how to check an HDB-licensed contractor</a>.</p>

    <h2>Reviews</h2>
    <p>Reviews on Layered come only from homeowners who enquired through Layered. After a firm marks an enquiry as won, it can ask us to invite the homeowner, and we email a one-time review link. We read every review before it is published, and we publish honest reviews whether they are positive or negative. Firms cannot see a review before it appears, and cannot pay to change or remove one. Some firms also link to their Google reviews, which are written on Google and are not read or checked by us.</p>

    <h2>Your contact details</h2>
    <p>When you send an enquiry, a firm sees your project details straight away: property type, style, budget range, location and your message. Your name, phone number and email stay hidden until that firm has access, for example through a plan, or by unlocking your enquiry. If no firm unlocks it, we delete your name, phone number, email and message after ${PURGE_DAYS} days. Read our <a href="/privacy">privacy policy</a>.</p>

    <h2>Order of firms</h2>
    <p>Directory pages show firms marked <strong>Featured</strong> first, with a label, and then the newest listings. We do not rank firms by quality, and we do not guarantee any firm's work. Compare itemised quotations, ask for references and check credentials yourself. Our <a href="/guides/how-to-choose-an-interior-designer-singapore">guide to choosing a designer</a> shows how.</p>

    <h2>How Layered makes money</h2>
    <p>Homeowners use Layered for free. Firms list for free, and after an initial ${TRIAL_MONTHS}-month period they can take a plan or unlock individual enquiries to see homeowners' contact details. Read more on the <a href="/for-designers">page for designers</a>.</p>

    <h2>Free tools</h2>
    <p>Our tools use published 2026 Singapore unit rates and give indicative ranges, not quotes: the <a href="/tools/renovation-cost-calculator">cost calculator</a>, <a href="/tools/renovation-cost-estimator">itemised estimator</a>, <a href="/tools/renovation-budget-planner">budget planner</a> and <a href="/tools/room-planner">room planner</a>.</p>`,
  });
}
