
export enum CourseLevel {
  Iniciante = 'Iniciante',
  Intermediario = 'Intermediário',
  Avancado = 'Avançado'
}

export enum CourseCategory {
  Neurociencia = 'Neurociência',
  Pedagogia = 'Pedagogia',
  Gestao = 'Gestão Escolar',
  Inclusao = 'Inclusão'
}

export interface Instructor {
  id: string;
  name: string;
  avatar: string;
  role: string;
  bio?: string;
}

export interface SyllabusLesson {
  title: string;
  duration: string;
}

export interface SyllabusModule {
  title: string;
  lessons: SyllabusLesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  price: number;
  thumbnail: string;
  level: CourseLevel;
  category: CourseCategory;
  duration: string; // e.g., "40h"
  modules: number;
  rating: number;
  students: number;
  instructor: Instructor;
  syllabus?: SyllabusModule[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
