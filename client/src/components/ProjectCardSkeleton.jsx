import React from 'react';

const ProjectCardSkeleton = () => (
    <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
        <div className="h-7 bg-gray-300 rounded w-3/4 mb-3"></div>
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="h-16 bg-gray-100 rounded-lg"></div>
    </div>
);

export default ProjectCardSkeleton;