import React, { useState } from 'react';

const DynamicListInput = ({ name, label, items, onChange, placeholder, required }) => {
    const [inputValue, setInputValue] = useState('');

    const handleAdd = (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onChange(name, [...(items || []), inputValue.trim()]);
            setInputValue('');
        }
    };

    const handleRemove = (indexToRemove) => {
        onChange(name, (items || []).filter((_, index) => index !== indexToRemove));
    };

    return (
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{label} {required && <span className="text-red-500">*</span>}</label>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input type="text" placeholder={placeholder} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(e); }} className="flex-1 p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white" />
                <button type="button" onClick={handleAdd} className="bg-blue-100 text-blue-700 px-6 py-3.5 font-bold rounded-xl hover:bg-blue-200 transition-colors shadow-sm whitespace-nowrap">Add Item</button>
            </div>
            <div className="flex flex-wrap gap-2">
                {(items || []).map((item, index) => <div key={index} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm group"><span className="text-sm font-bold text-gray-700">{item}</span><button type="button" onClick={() => handleRemove(index)} className="text-gray-400 group-hover:text-red-500 font-bold focus:outline-none transition-colors">✕</button></div>)}
            </div>
        </div>
    );
};

export default DynamicListInput;