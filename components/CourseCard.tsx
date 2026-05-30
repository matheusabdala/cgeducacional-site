"use client";


import React from 'react';
import { Course } from '../types';
import { Clock, Star } from 'lucide-react';
import { Button } from './Button';

interface CourseCardProps {
  course: Course;
  onViewDetails: (course: Course) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onViewDetails }) => {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:shadow-lg hover:-translate-y-1">
      <div className="relative aspect-video overflow-hidden bg-gray-100 cursor-pointer" onClick={() => onViewDetails(course)}>
        <img
          src={course.thumbnail}
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-cg-700 backdrop-blur-sm shadow-sm">
          {course.category}
        </div>
      </div>
      
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
            <Clock size={12} /> {course.duration}
          </span>
          <span className="flex items-center gap-1">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            {course.rating.toFixed(1)}
          </span>
        </div>
        
        <h3 
          className="mb-2 text-lg font-bold leading-tight text-slate-900 group-hover:text-cg-600 transition-colors cursor-pointer"
          onClick={() => onViewDetails(course)}
        >
          {course.title}
        </h3>
        
        <p className="mb-4 line-clamp-2 text-sm text-gray-500 flex-1">
          {course.description}
        </p>
        
        <div className="flex items-center gap-3 mb-4 pt-4 border-t border-gray-100">
           <img src={course.instructor.avatar} alt={course.instructor.name} className="w-8 h-8 rounded-full object-cover" />
           <div className="text-xs">
              <p className="font-medium text-slate-900">{course.instructor.name}</p>
              <p className="text-gray-500">{course.instructor.role}</p>
           </div>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">Por apenas</span>
            <span className="text-lg font-bold text-teal-600">
              R$ {course.price.toFixed(2).replace('.', ',')}
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={() => onViewDetails(course)}>
            Ver Detalhes
          </Button>
        </div>
      </div>
    </div>
  );
};