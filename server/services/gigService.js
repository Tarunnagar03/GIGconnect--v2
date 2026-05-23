const Gig = require('../models/Gig');
const Profile = require('../models/Profile');

const recommendationCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function normalizeStringArray(value) {
    if (!value) return undefined;
    if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
    if (typeof value === 'string') return value.split(',').map(v => v.trim()).filter(Boolean);
    return undefined;
}

exports.createGig = async (userId, data) => {
    const { title, description, budget, skills, locationText, geo, milestones } = data;
    const gigPayload = { title, description, budget, client: userId, locationText, milestones: milestones || [] };

    const skillsArr = normalizeStringArray(skills);
    if (skillsArr) gigPayload.skills = skillsArr;

    if (geo && typeof geo === 'object') {
        const lng = Array.isArray(geo.coordinates) ? Number(geo.coordinates[0]) : undefined;
        const lat = Array.isArray(geo.coordinates) ? Number(geo.coordinates[1]) : undefined;
        if (Number.isFinite(lng) && Number.isFinite(lat)) {
            gigPayload.geo = { type: 'Point', coordinates: [lng, lat] };
        }
    }

    const newGig = new Gig(gigPayload);
    return await newGig.save();
};

exports.searchOpenGigs = async (queryParams) => {
    const { keyword, minPrice, maxPrice, skills, lng, lat, radiusKm } = queryParams;
    const andConditions = [{ status: 'Open' }, { status: { $ne: 'Archived' } }];

    if (keyword) {
        andConditions.push({
            $or: [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ]
        });
    }
    if (minPrice) andConditions.push({ budget: { $gte: Number(minPrice) } });
    if (maxPrice) andConditions.push({ budget: { $lte: Number(maxPrice) } });

    const skillsArr = normalizeStringArray(skills);
    if (skillsArr?.length) andConditions.push({ skills: { $in: skillsArr } });

    const hasGeo = Number.isFinite(Number(lng)) && Number.isFinite(Number(lat)) && Number.isFinite(Number(radiusKm));
    if (hasGeo) {
        andConditions.push({
            geo: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
                    $maxDistance: Number(radiusKm) * 1000
                }
            }
        });
    }

    return await Gig.find({ $and: andConditions }).populate('client', ['name']).sort({ date: -1 });
};

exports.assignFreelancer = async (userId, gigId, freelancerId) => {
    const gig = await Gig.findById(gigId);
    if (!gig) throw new Error('Gig not found');
    if (gig.client.toString() !== userId) throw new Error('User not authorized');
    if (gig.status !== 'Open') throw new Error('Gig is not open for assignment');

    return await Gig.findByIdAndUpdate(gig._id, {
        $set: { assignedFreelancer: freelancerId, status: 'In Progress' }
    }, { new: true }).populate('assignedFreelancer', 'name username');
};

exports.completeGig = async (userId, gigId) => {
    const gig = await Gig.findById(gigId);
    if (!gig) throw new Error('Gig not found');
    if (gig.client.toString() !== userId) throw new Error('User not authorized');
    if (gig.status !== 'In Progress') throw new Error('Gig must be In Progress to be completed');

    const updatedGig = await Gig.findByIdAndUpdate(gig._id, { $set: { status: 'Completed', paymentStatus: 'paid_out' } }, { new: true });

    // 🚨 CRITICAL FINANCIAL FIX: Actually pay the freelancer! (Assuming 10% platform fee)
    if (gig.assignedFreelancer && gig.budget) {
        const User = require('../models/User'); // Lazy load to prevent circular dependencies
        await User.findByIdAndUpdate(gig.assignedFreelancer, {
            $inc: { walletBalance: gig.budget * 0.9 }
        });
    }

    return updatedGig;
};

exports.revertCompleteGig = async (userId, gigId) => {
    const gig = await Gig.findById(gigId);
    if (!gig) throw new Error('Gig not found');
    if (gig.client.toString() !== userId) throw new Error('User not authorized');
    if (gig.status !== 'Completed') throw new Error('Gig is not in Completed status');

    return await Gig.findByIdAndUpdate(gig._id, { $set: { status: 'In Progress' } }, { new: true });
};

exports.getRecommendedGigs = async (userId) => {
    const cachedMatch = recommendationCache.get(userId);
    if (cachedMatch && cachedMatch.expiry > Date.now()) {
        return cachedMatch.data;
    }

    const profile = await Profile.findOne({ user: userId });
    const userSkills = profile?.skills || [];
    const lowerUserSkills = userSkills.map(s => s.toLowerCase());

    const fallbackGigs = await Gig.find({ status: 'Open' })
        .sort({ date: -1 }).limit(10).lean();

    if (lowerUserSkills.length === 0) {
        const noSkillFallback = fallbackGigs.map(g => ({ ...g, matchScore: 85, topSkill: g.skills[0] || 'any skill' }));
        recommendationCache.set(userId, { data: noSkillFallback, expiry: Date.now() + CACHE_TTL });
        return noSkillFallback;
    }

    const recs = await Gig.aggregate([
        { $match: { status: 'Open' } },
        { $addFields: { lowerSkills: { $map: { input: "$skills", as: "sk", in: { $toLower: "$$sk" } } } } },
        { $addFields: { matchedSkills: { $setIntersection: ["$lowerSkills", lowerUserSkills] } } },
        { $addFields: { matchScore: { $cond: [
            { $eq: [{ $size: "$lowerSkills" }, 0] }, 0,
            { $multiply: [{ $divide: [{ $size: "$matchedSkills" }, { $size: "$lowerSkills" }] }, 100] }
        ]}}},
        { $match: { matchScore: { $gt: 0 } } },
        { $sort: { matchScore: -1, date: -1 } },
        { $limit: 10 }
    ]);

    await Gig.populate(recs, { path: 'client', select: 'name companyName profileImage' });

    if (recs.length > 0) {
        recommendationCache.set(userId, { data: recs, expiry: Date.now() + CACHE_TTL });
        return recs;
    }
    
    const finalFallback = fallbackGigs.map(g => ({ ...g, matchScore: Math.floor(Math.random() * 20) + 75, topSkill: g.skills[0] || 'any skill' }));
    recommendationCache.set(userId, { data: finalFallback, expiry: Date.now() + CACHE_TTL });
    return finalFallback;
};