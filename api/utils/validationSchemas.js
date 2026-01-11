const { z } = require('zod');

// --- ORTAK TİPLER ---
const PrioritySchema = z.enum(['urgent', 'important', 'normal', 'low'], {
    required_error: "Öncelik zorunludur.",
    invalid_type_error: "Geçersiz öncelik değeri."
});

const DateStringSchema = z.union([
    z.string().datetime(), 
    z.string().length(0), 
    z.null(),             
    z.undefined()         
]).optional().transform(e => e === "" ? undefined : e);

// --- ALT GÖREV ŞEMASI ---
const SubtaskSchema = z.object({
    title: z.string().min(1, "Alt görev başlığı boş olamaz."),
    isCompleted: z.boolean().optional()
});

// --- TODO CREATE ŞEMASI ---
const createTodoSchema = z.object({
    title: z.string().min(1).max(100),
    description: z.string().max(1000).optional(),
    priority: PrioritySchema.optional(),
    dueDate: DateStringSchema,
    imageUrl: z.string().optional(),
    
    isRoutine: z.boolean().optional(),
    routineDays: z.array(z.number()).optional(),
    routineType: z.enum(['weekly', 'monthly']).optional(),
    
    reminderTime: z.number().optional(),
    subtasks: z.array(SubtaskSchema).optional()
});

// --- TODO UPDATE ŞEMASI ---
const updateTodoSchema = z.object({
    title: z.string().max(100).optional(),
    description: z.string().max(1000).optional(),
    priority: PrioritySchema.optional(),
    dueDate: DateStringSchema,
    imageUrl: z.string().optional(),
    status: z.enum(['pending', 'completed']).optional(),
    isPinned: z.boolean().optional(),
    
    isRoutine: z.boolean().optional(),
    routineDays: z.array(z.number()).optional(),
    routineType: z.enum(['weekly', 'monthly']).optional(),
    
    reminderTime: z.number().optional(),
    subtasks: z.array(SubtaskSchema).optional()
}).partial();

// --- AUTH ŞEMALARI ---
const registerSchema = z.object({
    username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalı"),
    email: z.string().email("Geçerli bir e-posta adresi giriniz"),
    password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

module.exports = {
    createTodoSchema,
    updateTodoSchema,
    registerSchema,
    loginSchema
};