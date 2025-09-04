export interface BaseResponse {
  success: boolean;
  message?: string;
}
export interface ApiError {
  success: false;
  error: string;
  details?: any;
}
export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
export interface User {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
  profile?: UserProfile;
}
export interface UserProfile {
  user_id: number;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height_cm?: number;
  weight_kg?: number;
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal?: 'lose_weight' | 'maintain' | 'gain_weight' | 'gain_muscle';
  target_calories?: number;
  target_protein_g?: number;
  target_carbs_g?: number;
  target_fat_g?: number;
  target_water_ml?: number;
}
export interface LoginCredentials {
  email: string;
  password: string;
}
export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
}
export interface AuthResponse extends BaseResponse {
  data?: {
    user: User;
    token: string;
  };
}
export interface UserResponse extends BaseResponse {
  data?: {
    user: User;
  };
}
export interface Food {
  id: number;
  name: string;
  brand?: string;
  barcode?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g?: number;
  created_by_user_id?: number;
  created_at: string;
  updated_at: string;
  creator?: Pick<User, 'id' | 'email'>;
  category?: string;
}
export interface CreateFoodData {
  name: string;
  brand?: string;
  barcode?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g?: number;
}
export interface FoodSearchParams {
  q?: string;
  brand?: string;
  page?: number;
  limit?: number;
}
export interface FoodsResponse extends BaseResponse {
  data?: {
    foods: Food[];
    pagination: PaginationData;
  } | Food[];
}
export interface FoodResponse extends BaseResponse {
  data?: {
    food: Food;
  };
}
export interface RecipeIngredient {
  id: number;
  recipe_id: number;
  food_id: number;
  quantity_grams: number;
  food: Pick<Food, 'id' | 'name' | 'brand' | 'calories_per_100g' | 'protein_per_100g' | 'carbs_per_100g' | 'fat_per_100g'>;
}
export interface Recipe {
  id: number;
  name: string;
  user_id: number;
  instructions?: string;
  prep_time_minutes?: number;
  servings: number;
  created_at: string;
  updated_at: string;
  creator?: Pick<User, 'id' | 'email'>;
  ingredients: RecipeIngredient[];
  description?: string;
  cook_time_minutes?: number;
  calories_per_serving?: number;
}
export interface CreateRecipeIngredient {
  food_id: number;
  quantity_grams: number;
}
export interface CreateRecipeData {
  name: string;
  instructions?: string;
  prep_time_minutes?: number;
  servings: number;
  ingredients: CreateRecipeIngredient[];
}
export interface RecipeSearchParams {
  q?: string;
  page?: number;
  limit?: number;
}
export interface RecipesResponse extends BaseResponse {
  data?: {
    recipes: Recipe[];
    pagination: PaginationData;
  } | Recipe[];
}
export interface RecipeResponse extends BaseResponse {
  data?: {
    recipe: Recipe;
  };
}
export interface IntakeItem {
  id: number;
  intake_id: number;
  food_id?: number;
  recipe_id?: number;
  quantity_grams: number;
  food?: Pick<Food, 'id' | 'name' | 'brand' | 'calories_per_100g' | 'protein_per_100g' | 'carbs_per_100g' | 'fat_per_100g' | 'fiber_per_100g'>;
  recipe?: Pick<Recipe, 'id' | 'name' | 'servings'>;
}
export interface Intake {
  id: number;
  user_id: number;
  consumed_at: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  created_at: string;
  updated_at: string;
  items: IntakeItem[];
}
export interface CreateIntakeItem {
  food_id?: number;
  recipe_id?: number;
  quantity_grams: number;
}
export interface CreateIntakeData {
  consumed_at: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  items: CreateIntakeItem[];
}
export interface IntakeQueryParams {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
export interface IntakesResponse extends BaseResponse {
  data?: {
    intakes: Intake[];
    pagination: PaginationData;
  };
}
export interface IntakeResponse extends BaseResponse {
  data?: {
    intake: Intake;
  };
}
export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}
export interface MealNutrition extends NutritionTotals {
  breakfast: NutritionTotals;
  lunch: NutritionTotals;
  dinner: NutritionTotals;
  snack: NutritionTotals;
}
export interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
export interface NutritionProgress {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
export interface DailyNutrition {
  date: string;
  total: NutritionTotals;
  by_meal: MealNutrition;
  targets: NutritionTargets;
  progress: NutritionProgress;
  intakes: Intake[];
}
export interface DailyNutritionResponse extends BaseResponse {
  data?: {
    nutrition: DailyNutrition;
  };
}
export interface FoodRecommendation {
  id: number;
  name: string;
  brand?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g?: number;
  recommended_amount: number;
  fit_score: number;
  reasoning: string;
}
export interface NextMealRecommendations {
  remaining_calories: number;
  remaining_protein: number;
  remaining_carbs: number;
  remaining_fat: number;
  meal_type: string;
  recommended_foods: FoodRecommendation[];
  recommended_recipes: any[];
  nutrition_tips: string[];
}
export interface RecommendationResponse extends BaseResponse {
  data?: NextMealRecommendations;
}
export interface ValidationError {
  field: string;
  message: string;
}
export interface FormErrors {
  [key: string]: string;
}
export interface LoadingState {
  [key: string]: boolean;
}
export interface UIState {
  loading: LoadingState;
  errors: FormErrors;
  success: string | null;
}
export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string | string[];
  borderColor: string | string[];
  borderWidth?: number;
}
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}
export interface NutritionChartData extends ChartData {
  total: number;
  target: number;
  percentage: number;
}