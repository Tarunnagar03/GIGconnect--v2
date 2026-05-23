const getInitialRate = () => {
    try {
        const storedRate = localStorage.getItem('exchangeRateINR');
        if (storedRate && !isNaN(Number(storedRate))) {
            return Number(storedRate);
        }
    } catch (e) {
        console.error("Could not access localStorage", e);
    }
    return 83.5; // Ultimate fallback if absolutely no data exists
};

let cachedRate = getInitialRate();

// Fire and forget fetching real-time exchange rate on module load
try {
    fetch('https://open.er-api.com/v6/latest/USD')
        .then(res => res.json())
        .then(data => {
            if (data?.rates?.INR) {
                cachedRate = data.rates.INR;
                try {
                    localStorage.setItem('exchangeRateINR', cachedRate.toString());
                } catch (e) {}
            }
        })
        .catch(() => { console.warn("Using cached exchange rate:", cachedRate); }); 
} catch (e) {}

export const formatCurrency = (amountInINR) => {
    if (amountInINR === undefined || amountInINR === null) return '';
    const inr = Number(amountInINR);
    
    const usd = (inr / cachedRate).toFixed(2);
    const usdDisplay = usd.endsWith('.00') ? parseInt(usd) : usd;
    return `₹${inr} ($${usdDisplay})`;
};
