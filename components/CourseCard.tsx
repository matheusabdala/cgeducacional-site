"use client";

import React from "react";
import { Course } from "../types";
import { Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseCover } from "@/components/ui/course-cover";
import { InitialsAvatar } from "@/components/ui/initials-avatar";

interface CourseCardProps {
  course: Course;
  onViewDetails: (course: Course) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onViewDetails,
}) => {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 ease-expo-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-card-hover">
      <div
        className="relative aspect-video cursor-pointer"
        onClick={() => onViewDetails(course)}
      >
        <CourseCover category={course.category} className="h-full w-full" />
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur">
            {course.category}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5">
            <Clock size={12} /> {course.duration}
          </span>
          <span className="flex items-center gap-1">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            {course.rating.toFixed(1)}
          </span>
        </div>

        <h3
          className="mb-2 cursor-pointer text-lg font-semibold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary"
          onClick={() => onViewDetails(course)}
        >
          {course.title}
        </h3>

        <p className="mb-4 line-clamp-2 flex-1 text-sm text-muted-foreground">
          {course.description}
        </p>

        <div className="mb-4 flex items-center gap-3 border-t border-border pt-4">
          <InitialsAvatar
            name={course.instructor.name}
            className="h-8 w-8 text-[10px]"
          />
          <div className="text-xs">
            <p className="font-medium text-foreground">
              {course.instructor.name}
            </p>
            <p className="text-muted-foreground">{course.instructor.role}</p>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Por apenas</span>
            <span className="text-lg font-bold text-teal">
              R$ {course.price.toFixed(2).replace(".", ",")}
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
