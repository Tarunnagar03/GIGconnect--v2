import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/currencyFormatter';

const FreelancerKanbanColumn = ({ title, icon, items, isGig, draggedItem, onDragStart, onDragEnd, onDrop }) => {
    return (
        <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, title)}
            className={`bg-white/50 border border-gray-200/60 rounded-3xl p-5 min-w-[300px] w-full max-w-[320px] flex-shrink-0 flex flex-col max-h-[600px] transition-colors ${draggedItem ? 'bg-blue-50/50 border-blue-200 border-dashed' : ''}`}
        >
            <div className="flex justify-between items-center mb-5 px-1 border-b border-gray-200/60 pb-3">
                <h3 className="font-extrabold text-gray-800 flex items-center gap-2">{icon} {title}</h3>
                <span className="bg-white border border-gray-200 text-gray-500 text-xs font-black px-2.5 py-1 rounded-full shadow-sm">{items.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                {items.map((item) => (
                    <div
                        key={item._id}
                        draggable
                        onDragStart={(e) => onDragStart(e, item, isGig, title)}
                        onDragEnd={onDragEnd}
                        className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-grab active:cursor-grabbing hover:border-blue-300 group"
                    >
                        <Link to={isGig ? `/gigs/${item._id}` : `/gigs/${item.gig?._id || item.gig}`} className="block">
                            <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                                {isGig ? item.title : item.gig?.title || 'Gig Title'}
                            </h4>
                            <div className="flex justify-between items-end mt-4">
                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                                    {isGig ? 'Budget' : 'Bid Amount'}
                                </span>
                                <span className="font-extrabold text-green-600">
                                    {formatCurrency(isGig ? item.budget : item.bidAmount)}
                                </span>
                            </div>
                        </Link>
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="h-28 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 text-sm font-bold bg-white/50">
                        Drop items here
                    </div>
                )}
            </div>
        </div>
    );
};

export default FreelancerKanbanColumn;