import { Request, Response } from 'express';
import { ExerciseService } from '../services/exerciseService';
import { ExerciseCategory, ExerciseFilters, CreateExerciseDto, UpdateExerciseDto } from '../types/exercise';

export class ExerciseController {
  private exerciseService: ExerciseService;

  constructor() {
    this.exerciseService = new ExerciseService();
  }

  /**
   * GET /api/v1/exercises
   * Get all exercises with filters and pagination
   */
  getExercises = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: ExerciseFilters = {
        category: req.query.category as ExerciseCategory,
        muscle_groups: req.query.muscle_groups ? 
          (Array.isArray(req.query.muscle_groups) ? req.query.muscle_groups as string[] : [req.query.muscle_groups as string]) : undefined,
        equipment: req.query.equipment ? 
          (Array.isArray(req.query.equipment) ? req.query.equipment as string[] : [req.query.equipment as string]) : undefined,
        difficulty_level: req.query.difficulty_level ? parseInt(req.query.difficulty_level as string) : undefined,
        is_compound: req.query.is_compound === 'true' ? true : req.query.is_compound === 'false' ? false : undefined,
        is_bodyweight: req.query.is_bodyweight === 'true' ? true : req.query.is_bodyweight === 'false' ? false : undefined,
        is_active: req.query.is_active === 'false' ? false : true, // default to active only
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof ExerciseFilters] === undefined) {
          delete filters[key as keyof ExerciseFilters];
        }
      });

      const result = await this.exerciseService.getExercises(filters);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Exercises retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting exercises:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * GET /api/v1/exercises/:id
   * Get exercise by ID
   */
  getExerciseById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid exercise ID',
          message: 'Exercise ID must be a number'
        });
        return;
      }

      const exercise = await this.exerciseService.getExerciseById(id);
      
      res.status(200).json({
        success: true,
        data: exercise,
        message: 'Exercise retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting exercise by ID:', error);
      
      if (error instanceof Error && error.message === 'Exercise not found') {
        res.status(404).json({
          success: false,
          error: 'Exercise not found',
          message: 'Exercise with the specified ID does not exist'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  };

  /**
   * GET /api/v1/exercises/category/:category
   * Get exercises by category
   */
  getExercisesByCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const category = req.params.category as ExerciseCategory;
      
      if (!Object.values(ExerciseCategory).includes(category)) {
        res.status(400).json({
          success: false,
          error: 'Invalid category',
          message: `Category must be one of: ${Object.values(ExerciseCategory).join(', ')}`
        });
        return;
      }

      const exercises = await this.exerciseService.getExercisesByCategory(category);
      
      res.status(200).json({
        success: true,
        data: exercises,
        message: `Exercises for category '${category}' retrieved successfully`
      });
    } catch (error) {
      console.error('Error getting exercises by category:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * GET /api/v1/exercises/search
   * Search exercises by name
   */
  searchExercises = async (req: Request, res: Response): Promise<void> => {
    try {
      const searchTerm = req.query.q as string;
      
      if (!searchTerm) {
        res.status(400).json({
          success: false,
          error: 'Missing search term',
          message: 'Search term is required (query parameter: q)'
        });
        return;
      }

      const exercises = await this.exerciseService.searchExercises(searchTerm);
      
      res.status(200).json({
        success: true,
        data: exercises,
        message: `Search results for '${searchTerm}' retrieved successfully`
      });
    } catch (error) {
      console.error('Error searching exercises:', error);
      
      if (error instanceof Error && error.message.includes('at least 2 characters')) {
        res.status(400).json({
          success: false,
          error: 'Invalid search term',
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  };

  /**
   * POST /api/v1/exercises
   * Create new exercise
   */
  createExercise = async (req: Request, res: Response): Promise<void> => {
    try {
      const exerciseData: CreateExerciseDto = req.body;
      
      const exercise = await this.exerciseService.createExercise(exerciseData);
      
      res.status(201).json({
        success: true,
        data: exercise,
        message: 'Exercise created successfully'
      });
    } catch (error) {
      console.error('Error creating exercise:', error);
      
      if (error instanceof Error && (
        error.message.includes('required') ||
        error.message.includes('must be') ||
        error.message.includes('Invalid')
      )) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  };

  /**
   * PUT /api/v1/exercises/:id
   * Update exercise
   */
  updateExercise = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid exercise ID',
          message: 'Exercise ID must be a number'
        });
        return;
      }

      const exerciseData: UpdateExerciseDto = req.body;
      
      const exercise = await this.exerciseService.updateExercise(id, exerciseData);
      
      res.status(200).json({
        success: true,
        data: exercise,
        message: 'Exercise updated successfully'
      });
    } catch (error) {
      console.error('Error updating exercise:', error);
      
      if (error instanceof Error && error.message === 'Exercise not found') {
        res.status(404).json({
          success: false,
          error: 'Exercise not found',
          message: 'Exercise with the specified ID does not exist'
        });
      } else if (error instanceof Error && (
        error.message.includes('required') ||
        error.message.includes('must be') ||
        error.message.includes('Invalid')
      )) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  };

  /**
   * DELETE /api/v1/exercises/:id
   * Delete exercise (soft delete)
   */
  deleteExercise = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid exercise ID',
          message: 'Exercise ID must be a number'
        });
        return;
      }

      await this.exerciseService.deleteExercise(id);
      
      res.status(200).json({
        success: true,
        message: 'Exercise deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting exercise:', error);
      
      if (error instanceof Error && error.message === 'Exercise not found') {
        res.status(404).json({
          success: false,
          error: 'Exercise not found',
          message: 'Exercise with the specified ID does not exist'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  };

  /**
   * GET /api/v1/exercises/metadata
   * Get exercise metadata (muscle groups, equipment, etc.)
   */
  getExerciseMetadata = async (req: Request, res: Response): Promise<void> => {
    try {
      const metadata = await this.exerciseService.getExerciseMetadata();
      
      res.status(200).json({
        success: true,
        data: metadata,
        message: 'Exercise metadata retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting exercise metadata:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * GET /api/v1/exercises/stats
   * Get exercise statistics
   */
  getExerciseStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.exerciseService.getExerciseStats();
      
      res.status(200).json({
        success: true,
        data: stats,
        message: 'Exercise statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting exercise stats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}