// src/lib/validations/auth.ts
/**
 * Schematy walidacji dla autoryzacji
 */

import { z } from 'zod';

export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email jest wymagany')
        .email('Nieprawidłowy format email'),
    password: z
        .string()
        .min(1, 'Hasło jest wymagane')
        .min(6, 'Hasło musi mieć minimum 6 znaków'),
});

export const registerSchema = z
    .object({
        full_name: z
            .string()
            .min(1, 'Imię i nazwisko jest wymagane')
            .min(2, 'Imię musi mieć minimum 2 znaki')
            .max(100, 'Imię może mieć maksymalnie 100 znaków'),
        email: z
            .string()
            .min(1, 'Email jest wymagany')
            .email('Nieprawidłowy format email'),
        password: z
            .string()
            .min(1, 'Hasło jest wymagane')
            .min(8, 'Hasło musi mieć minimum 8 znaków')
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                'Hasło musi zawierać małą literę, wielką literę i cyfrę'
            ),
        confirmPassword: z
            .string()
            .min(1, 'Potwierdzenie hasła jest wymagane'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Hasła muszą być identyczne',
        path: ['confirmPassword'],
    });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;