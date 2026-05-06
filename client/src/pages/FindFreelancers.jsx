import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';

const FindFreelancers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    skills: searchParams.get('skills') || '',
    minRate: searchParams.get('minRate') || '',
    maxRate: searchParams.get('maxRate') || '',
    minRating: searchParams.get('minRating') || '',
    radiusKm: searchParams.get('radiusKm') || '',
    sort: searchParams.get('sort') || 'rating_desc'
  });
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams(filters);
      for (const [key, value] of params.entries()) if (!value) params.delete(key);

      if (filters.radiusKm) {
        const me = await api.get('/profiles/me');
        const coords = me.data?.geo?.coordinates;
        if (Array.isArray(coords) && coords.length === 2) {
          params.set('lng', String(coords[0]));
          params.set('lat', String(coords[1]));
        }
      }

      const res = await api.get(`/profiles/search?${params.toString()}`);
      setProfiles(res.data);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to load freelancers.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const onChange = (e) => setFilters((p) => ({ ...p, [e.target.name]: e.target.value }));
  const onSubmit = (e) => {
    e.preventDefault();
    setSearchParams(filters, { replace: true });
    fetchProfiles();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Link to="/dashboard" className="inline-block mb-6 text-blue-600 hover:underline">
        &larr; Back to Dashboard
      </Link>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold mb-4">Find Freelancers</h1>
        <p className="text-gray-600 max-w-2xl">
          Search by skills, hourly rate, rating, and “near me” radius. Tip: save your GPS from Profile → Use my GPS.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Skills</label>
          <input name="skills" value={filters.skills} onChange={onChange} className="mt-1 w-full p-2 border rounded-md" placeholder="React, Node, UI/UX" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Min rate</label>
          <input type="number" name="minRate" value={filters.minRate} onChange={onChange} className="mt-1 w-full p-2 border rounded-md" placeholder="0" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Max rate</label>
          <input type="number" name="maxRate" value={filters.maxRate} onChange={onChange} className="mt-1 w-full p-2 border rounded-md" placeholder="100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Min rating</label>
          <input type="number" name="minRating" value={filters.minRating} onChange={onChange} min="1" max="5" className="mt-1 w-full p-2 border rounded-md" placeholder="4" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Near me (km)</label>
          <input type="number" name="radiusKm" value={filters.radiusKm} onChange={onChange} className="mt-1 w-full p-2 border rounded-md" placeholder="10" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Sort</label>
          <select name="sort" value={filters.sort} onChange={onChange} className="mt-1 w-full p-2 border rounded-md">
            <option value="rating_desc">Top rated</option>
            <option value="rate_asc">Rate: low to high</option>
            <option value="rate_desc">Rate: high to low</option>
          </select>
        </div>

        <div className="md:col-span-4 flex items-end justify-end">
          <button type="submit" className="bg-blue-600 text-white font-semibold px-5 py-2 rounded hover:bg-blue-700">
            Search
          </button>
        </div>
      </form>

      {loading ? (
        <p>Loading freelancers...</p>
      ) : profiles.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((p) => (
            <div key={p._id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-lg">{p.user?.name}</h3>
                  <p className="text-sm text-gray-500">@{p.user?.username}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{(p.ratingAvg || 0).toFixed(1)} ★</p>
                  <p className="text-xs text-gray-500">{p.ratingCount || 0} reviews</p>
                </div>
              </div>
              {p.locationText && <p className="text-sm text-gray-600 mt-2">{p.locationText}</p>}
              {typeof p.rate === 'number' && <p className="text-sm mt-2"><span className="font-semibold">${p.rate}</span>/hr</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {(p.skills || []).slice(0, 6).map((s) => (
                  <span key={s} className="text-xs bg-gray-100 px-2 py-1 rounded">{s}</span>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <Link to={`/profile/${p.user?._id}`} className="text-blue-600 hover:underline font-medium">
                  View profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-500">No freelancers match your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default FindFreelancers;

