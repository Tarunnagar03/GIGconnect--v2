// Helper: Automatically assigns Icons & Colors based on keywords
export const getServiceTheme = (serviceName) => {
    const lower = serviceName.toLowerCase();
    if (/(web|app|dev|react|node|python|software|code|program|api|html|css)/.test(lower)) return { icon: '💻', color: 'text-blue-600 bg-blue-50 border-blue-100' };
    if (/(design|ui|ux|graphic|logo|art|draw|illustrat|figma|photoshop)/.test(lower)) return { icon: '🎨', color: 'text-pink-600 bg-pink-50 border-pink-100' };
    if (/(seo|market|ad|social|promot|sale|brand|growth)/.test(lower)) return { icon: '📈', color: 'text-green-600 bg-green-50 border-green-100' };
    if (/(write|content|translat|blog|copy|type|edit|proofread)/.test(lower)) return { icon: '✍️', color: 'text-yellow-600 bg-yellow-50 border-yellow-100' };
    if (/(video|animat|edit|photo|film|audio|sound|music)/.test(lower)) return { icon: '🎬', color: 'text-purple-600 bg-purple-50 border-purple-100' };
    if (/(business|consult|manag|admin|account|hr|finance|legal)/.test(lower)) return { icon: '💼', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' };
    return { icon: '✨', color: 'text-teal-600 bg-teal-50 border-teal-100' };
};

// Helper: Smart Skill Mapping Engine
export const getRelatedSkills = (serviceName, allSkills) => {
    if (!allSkills || !Array.isArray(allSkills)) return [];
    const lowerSrv = serviceName.toLowerCase();
    const isWeb = /(web|app|dev|code|software|program|api|html|css|react|node)/.test(lowerSrv);
    const isDesign = /(design|ui|ux|graphic|logo|art|illustrat|figma)/.test(lowerSrv);
    const isMarketing = /(seo|market|ad|social|promot|sale|brand)/.test(lowerSrv);
    const isWriting = /(write|content|translat|blog|copy|edit|proofread)/.test(lowerSrv);
    const isVideo = /(video|animat|film|audio|sound|music)/.test(lowerSrv);
    const isBusiness = /(business|consult|manag|admin|account|hr|finance|legal)/.test(lowerSrv);
    return allSkills.map(s => s.trim()).filter(skill => {
        if (!skill) return false;
        const s = skill.toLowerCase();
        if (isWeb && /(web|app|dev|code|software|program|api|html|css|js|javascript|typescript|react|node|python|java|c#|c\+\+|sql|mongo|aws|docker|git)/.test(s)) return true;
        if (isDesign && /(design|ui|ux|graphic|logo|art|illustrat|figma|photoshop|canva|adobe|sketch|color)/.test(s)) return true;
        if (isMarketing && /(seo|market|ad|social|promot|sale|brand|google|facebook|instagram|tiktok|email)/.test(s)) return true;
        if (isWriting && /(write|content|translat|blog|copy|edit|proofread|word|typing)/.test(s)) return true;
        if (isVideo && /(video|animat|film|audio|sound|music|premiere|after effects|vfx)/.test(s)) return true;
        if (isBusiness && /(business|consult|manag|admin|account|hr|finance|legal|excel|data entry)/.test(s)) return true;
        if (s.includes(lowerSrv) || lowerSrv.includes(s)) return true;
        return false;
    });
};