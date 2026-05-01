import { successResponse } from '../../utils/responseHandler.js';

import { 
    getLearnerDashboardStats, 
    getLeaderboard, 
    getGradesForLearner,
    getInstructorDashboardStats 
} from './dashboard.service.js';

export const statsController = async (req, res, next) => {
	try {
		const stats = await getLearnerDashboardStats(req.user._id);
		return successResponse(res, {
			message: 'Stats fetched successfully',
			data: stats,
		});
	} catch (error) {
		return next(error);
	}
};

export const learnerDashboardController = async (req, res, next) => {
	try {
		const stats = await getLearnerDashboardStats(req.user._id);
		return successResponse(res, {
			message: 'Dashboard stats fetched successfully',
			data: stats,
		});
	} catch (error) {
		return next(error);
	}
};

export const leaderboardController = async (req, res, next) => {
	try {
		const leaderboard = await getLeaderboard();
		return successResponse(res, {
			message: 'Leaderboard fetched successfully',
			data: leaderboard,
		});
	} catch (error) {
		return next(error);
	}
};

export const gradesController = async (req, res, next) => {
	try {
		const grades = await getGradesForLearner(req.user._id);
		return successResponse(res, {
			message: 'Grades fetched successfully',
			data: grades,
		});
	} catch (error) {
		return next(error);
	}
};

export const instructorDashboardController = async (req, res, next) => {
	try {
		const stats = await getInstructorDashboardStats(req.user._id);
		return successResponse(res, {
			message: 'Instructor dashboard stats fetched successfully',
			data: stats,
		});
	} catch (error) {
		return next(error);
	}
};
