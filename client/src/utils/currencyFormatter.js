export const formatCurrency = (amountInINR) => {
    if (amountInINR === undefined || amountInINR === null) return '';
    const inr = Number(amountInINR);
    // Assuming conversion rate: 1 USD = 83 INR (You can make this dynamic later)
    const usd = (inr / 83).toFixed(2);
    const usdDisplay = usd.endsWith('.00') ? parseInt(usd) : usd;
    return `₹${inr} ($${usdDisplay})`;
};
