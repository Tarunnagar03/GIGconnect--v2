import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useQuery } from '@tanstack/react-query';

const FreelancerCardSkeleton = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse flex flex-col h-full">
        <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 bg-gray-200 rounded-full flex-shrink-0"></div>
            <div className="flex-1">
                <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="mt-2 mb-4 flex gap-2">
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        </div>
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="h-6 bg-gray-300 rounded w-16"></div>
            <div className="h-8 bg-gray-200 rounded-full w-24"></div>
        </div>
    </div>
);

const FindFreelancers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    skills: searchParams.get('skills') || '',
    minRate: searchParams.get('minRate') || '',
    maxRate: searchParams.get('maxRate') || '',
    minRating: searchParams.get('minRating') || '',
    sort: searchParams.get('sort') || 'rating_desc'
  });

  // Use string representation for stable dependency to prevent infinite loops
  const searchString = searchParams.toString();

  const { data: profiles = [], isLoading: loading, error: queryError } = useQuery({
      queryKey: ['freelancersSearch', searchString],
      queryFn: async () => {
          const currentParams = new URLSearchParams(searchString);
          const params = new URLSearchParams();
          currentParams.forEach((value, key) => { if (value) params.set(key, value); });
          const res = await api.get(`/profiles/search?${params.toString()}`);
          return Array.isArray(res.data) 
              ? res.data.filter(p => p.user?.role === 'Freelancer') 
              : [];
      }
  });
  
  const error = queryError ? (queryError.response?.data?.msg || 'Failed to load freelancers.') : '';

  const onChange = (e) => setFilters((p) => ({ ...p, [e.target.name]: e.target.value }));
  const onSubmit = (e) => {
    e.preventDefault();
    setSearchParams(filters, { replace: true });
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <Link to="/dashboard" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-blue-600 font-semibold bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm hover:shadow hover:border-blue-200 transition-all group">
          <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Dashboard
      </Link>
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">Find Freelancers</h1>
        <p className="text-lg text-gray-500 font-medium">
          Discover and connect with top-rated professionals.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6" role="alert">
          {error}
        </div>
      )}

      {/* --- TOP-BAR FILTERS --- */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-end">
              <div className="lg:col-span-3">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Search Skills</label>
                  <input name="skills" value={filters.skills} onChange={onChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white" placeholder="e.g. React.js, Figma" />
              </div>
              
              <div className="lg:col-span-3">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Hourly Rate (₹)</label>
                  <div className="flex items-center gap-2">
                      <input type="number" name="minRate" value={filters.minRate} onChange={onChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white" placeholder="Min" />
                      <span className="text-gray-400 font-bold">-</span>
                      <input type="number" name="maxRate" value={filters.maxRate} onChange={onChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white" placeholder="Max" />
                  </div>
              </div>
              
              <div className="lg:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Minimum Rating</label>
                  <div className="relative">
                      <select name="minRating" value={filters.minRating} onChange={(e) => { onChange(e); setSearchParams({ ...filters, [e.target.name]: e.target.value }, { replace: true }); }} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white appearance-none cursor-pointer">
                          <option value="">Any Rating</option>
                          <option value="4">4 Stars & Up</option>
                          <option value="3">3 Stars & Up</option>
                          <option value="2">2 Stars & Up</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                  </div>
              </div>

              <div className="lg:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Sort By</label>
                  <div className="relative">
                      <select name="sort" value={filters.sort} onChange={(e) => { onChange(e); setSearchParams({ ...filters, [e.target.name]: e.target.value }, { replace: true }); }} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 hover:bg-white focus:bg-white appearance-none cursor-pointer">
                          <option value="rating_desc">Top Rated</option>
                          <option value="rate_asc">Rate: Low to High</option>
                          <option value="rate_desc">Rate: High to Low</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7-7m0 0l7-7m-7 7h18"></path></svg>
                      </div>
                  </div>
              </div>
              
              <div className="lg:col-span-2">
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold p-3 rounded-xl hover:bg-blue-700 hover:-translate-y-1 shadow-md transition-all">
                      Search
                  </button>
              </div>
          </form>
      </div>

      {/* --- RESULTS HEADER --- */}
      <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
              <span className="text-blue-600">{profiles.length}</span> freelancers found
          </h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FreelancerCardSkeleton />
            <FreelancerCardSkeleton />
            <FreelancerCardSkeleton />
            <FreelancerCardSkeleton />
            <FreelancerCardSkeleton />
            <FreelancerCardSkeleton />
        </div>
      ) : profiles.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((p) => (
            <div key={p._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-full group">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
                    {p.user?.name?.charAt(0).toUpperCase() || 'F'}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-xl text-gray-800 line-clamp-1">{p.user?.name}</h3>
                            <p className="text-sm text-blue-600 font-medium line-clamp-1">{p.headline || `@${p.user?.username}`}</p>
                        </div>
                        <div className="text-right bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100 flex-shrink-0 ml-2">
                            <p className="font-bold text-yellow-600 text-sm">{(p.ratingAvg || 0).toFixed(1)} ★</p>
                            <p className="text-xs text-yellow-600/80">{p.ratingCount || 0} revs</p>
                        </div>
                    </div>
                </div>
              </div>
              
              {p.locationText && <p className="text-sm text-gray-500 mb-3 flex items-center gap-1"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>{p.locationText}</p>}
              
              <div className="mt-2 mb-6 flex flex-wrap gap-2">
                {(Array.isArray(p.skills) ? p.skills : typeof p.skills === 'string' ? p.skills.split(',') : []).slice(0, 4).map((s) => (
                  <span key={s} className="bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold px-3 py-1.5 rounded-full">{s}</span>
                ))}
                {(p.skills && (Array.isArray(p.skills) ? p.skills : p.skills.split(',')).length > 4) && <span className="bg-gray-50 text-gray-500 border border-gray-200 text-xs font-semibold px-2 py-1.5 rounded-full">+{p.skills.length - 4}</span>}
              </div>
              
              <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                    {typeof p.rate === 'number' ? <p className="text-lg font-extrabold text-gray-800">₹{p.rate}<span className="text-sm text-gray-500 font-medium">/hr</span></p> : <p className="text-sm text-gray-400 font-medium">Rate varies</p>}
                </div>
                <Link to={`/profile/${p.user?._id}`} className="bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-1.5 px-5 rounded-full transition-colors text-sm shadow-sm">
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="w-24 h-24 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No freelancers found</h3>
          <p className="text-gray-500">Try adjusting your filters or searching for different skills.</p>
        </div>
      )}
    </div>
  );
};

export default FindFreelancers;
