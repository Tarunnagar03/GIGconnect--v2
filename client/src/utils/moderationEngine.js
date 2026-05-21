const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const paymentRegex = /\b(paypal|venmo|cashapp|paytm|phonepe|gpay|google pay|bhim|upi|crypto|bitcoin|western union|payoneer|skrill|wise|bank transfer)\b/gi;

export const moderateHtmlText = (text) => {
    if (typeof text !== 'string') return text;
    
    return text
        .replace(emailRegex, `<span class="bg-red-100 text-red-800 font-extrabold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider cursor-help shadow-sm border border-red-200" title="Sharing emails is prohibited">🔒 Email Hidden</span>`)
        .replace(phoneRegex, `<span class="bg-red-100 text-red-800 font-extrabold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider cursor-help shadow-sm border border-red-200" title="Sharing phone numbers is prohibited">🔒 Phone Hidden</span>`)
        .replace(paymentRegex, `<span class="bg-red-100 text-red-800 font-extrabold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider cursor-help shadow-sm border border-red-200" title="External payments lead to bans">🚫 Payment Flagged</span>`);
};

export const formatPreviewText = (text) => {
    if (typeof text !== 'string') return text;
    
    if (text.startsWith('[ATTACHMENT]:::')) return '📎 Attachment';
    if (text.startsWith('[AUDIO]:::')) return '🎙️ Voice Message';
    if (text.startsWith('[CUSTOM_OFFER]:::')) return '📄 Custom Offer sent';
    if (text.startsWith('[OFFER_ACCEPTED]:::')) return '🤝 Offer Accepted!';
    if (text.startsWith('[MEETING]:::')) return '📹 Video Interview';

    return text
        .replace(emailRegex, '[Email Hidden]')
        .replace(phoneRegex, '[Phone Hidden]')
        .replace(paymentRegex, '[Payment Flagged]');
};

export const checkMessageViolations = (message) => {
    const paymentCheck = /\b(paypal|venmo|cashapp|paytm|phonepe|gpay|google pay|bhim|upi|crypto|bitcoin|western union|payoneer|skrill|wise|bank transfer)\b/i;
    const contactCheck = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/i;

    if (paymentCheck.test(message)) {
        return { action: 'BLOCK', msg: "🚨 TRUST & SAFETY ALERT: Attempting to process payments outside GigConnect violates our Terms of Service and will result in a permanent ban. Please use the platform escrow." };
    }
    if (contactCheck.test(message)) {
        return { action: 'WARN', msg: "⚠️ WARNING: Sharing direct contact information (emails/phones) before a contract is started is against our policies. Proceed anyway? (Message will be flagged)" };
    }
    return { action: 'ALLOW' };
};