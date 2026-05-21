import React from 'react';

export const EducationSection = ({ items }) => {
    const safeItems = Array.isArray(items) ? items : (typeof items === 'string' ? items.split(',') : []);
    if (!safeItems || safeItems.length === 0) return null;
    return (
        <div className="border-t border-gray-100 mt-6 pt-6">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-800">Education</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {safeItems.map((item, index) => {
                    if (item === '[object Object]') return null;
                    let parsedItem = item;
                    let isObj = typeof item === 'object' && item !== null;
                    
                    if (!isObj && typeof item === 'string') {
                        try { parsedItem = JSON.parse(item); isObj = typeof parsedItem === 'object'; } catch (e) { }
                    }
                    const itemKey = isObj ? `${parsedItem.course}-${index}` : `${parsedItem}-${index}`;
                    return (
                        <div key={itemKey} className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 text-sm">🎓</div>
                            <div>
                                <p className="font-bold text-gray-800 text-sm">{isObj ? parsedItem.course : parsedItem}</p>
                                {isObj && parsedItem.college && <p className="text-xs text-gray-500 mt-0.5">{parsedItem.college}</p>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const InfoSection = ({ title, items }) => {
    const safeItems = Array.isArray(items) ? items : (typeof items === 'string' ? items.split(',') : []);
    if (!safeItems || safeItems.length === 0) return null;
    return (
        <div className="border-t border-gray-100 mt-6 pt-6">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-800">{title}</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
                {safeItems.map((item, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-purple-400 mt-0.5">•</span>
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export const getRichPortfolio = (portString) => {
    if (!portString) return [];
    if (portString.trim().startsWith('[')) {
        try { return JSON.parse(portString); } catch (e) { return []; }
    }
    if (portString.includes('http')) {
        return [{ title: 'Personal Website', link: portString }];
    }
    return [];
};