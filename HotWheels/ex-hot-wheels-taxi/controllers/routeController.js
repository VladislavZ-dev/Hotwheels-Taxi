const Route = require('../models/route');
const { isValidObjectId } = require('mongoose');

const handleError = (res, error, status = 500) => {
    console.error(error);
    res.status(status).json({ error: error.message });
};

exports.getAllRoutes = async (req, res) => {
    try {
        const routes = await Route.find()
            .populate('departure arrival', 'name coordinates') 
            .select('departure arrival distanceTravelled createdAt');
        
        res.json(routes);
    } catch (error) {
        handleError(res, error);
    }
};

exports.getRoutesByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Both startDate and endDate are required' });
        }

        const routes = await Route.find({
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        })
        .populate('departure arrival', 'name coordinates')
        .select('departure arrival distanceTravelled createdAt');
        
        res.json(routes);
    } catch (error) {
        handleError(res, error);
    }
};

exports.getTotalDistance = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let match = {};
        if (startDate && endDate) {
            match.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const result = await Route.aggregate([
            { $match: match },
            { $group: { _id: null, totalDistance: { $sum: "$distanceTravelled" } } }
        ]);
        
        const totalDistance = result.length > 0 ? result[0].totalDistance : 0;
        res.json({ totalDistance });
    } catch (error) {
        handleError(res, error);
    }
};