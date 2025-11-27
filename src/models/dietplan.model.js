import mongoose from "mongoose";


const NutritionSchema = new mongoose.Schema({
  calories: { type: Number, required: true },
  protein: { type: String, required: true },
  carbs: { type: String, required: true },
  fat: { type: String, required: true },
}, { _id: false });

const PlanItemSchema = new mongoose.Schema({
  time: { type: String, required: true },
  items: { type: String, required: true },
  nutrition: { type: NutritionSchema, required: true },
}, { _id: false });

const PURPOSE_OPTIONS = ["gain", "loose", "maintain"];
const CATEGORY_OPTIONS = ["eggetarian", "vegetarian", "non-vegetarian"];

const DietPlanSchema = new mongoose.Schema({
  purpose: { type: String, required: true, enum: PURPOSE_OPTIONS },
  category: { type: String, required: true, enum: CATEGORY_OPTIONS },
  plan: { type: [PlanItemSchema], required: true },
}, { timestamps: true });

export const DietPlan = mongoose.model("DietPlan", DietPlanSchema);
