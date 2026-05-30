"use client";

import React, { useState, useMemo } from 'react';
import { Course, CourseCategory, CourseLevel } from '../types';
import { COURSES } from '../constants';
import { CourseCard } from './CourseCard';
import { Search, Filter, BookOpen, SlidersHorizontal, X } from 'lucide-react';
import { Button } from './Button';

interface CoursesPageProps {
  onViewDetails: (course: Course) => void;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({ onViewDetails }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Toggle selection helper
  const toggleFilter = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const filteredCourses = useMemo(() => {
    return COURSES.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            course.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(course.category);
      const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(course.level);

      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [searchTerm, selectedCategories, selectedLevels]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedLevels([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-8">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Catálogo de Cursos</h1>
            <p className="mt-2 text-gray-500">
              Explore nossa biblioteca completa de neurociência e educação.
            </p>
          </div>
          <Button 
            variant="outline" 
            className="md:hidden self-start gap-2"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <SlidersHorizontal size={18} /> Filtros
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filters - Desktop & Mobile Drawer */}
          <aside className={`
            fixed inset-y-0 left-0 z-40 w-72 transform bg-white p-6 shadow-xl transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:w-64 lg:bg-transparent lg:p-0 lg:shadow-none
            ${showMobileFilters ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div className="flex items-center justify-between lg:hidden mb-6">
              <span className="text-lg font-bold text-slate-900">Filtros</span>
              <button onClick={() => setShowMobileFilters(false)}>
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Search in Sidebar for mobile or extra access */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-cg-500 focus:ring-1 focus:ring-cg-500"
                />
              </div>

              {/* Categories */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <BookOpen size={16} className="text-cg-600" /> Categorias
                </h3>
                <div className="space-y-2.5">
                  {Object.values(CourseCategory).map((category) => (
                    <label key={category} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`
                        w-5 h-5 rounded border flex items-center justify-center transition-colors
                        ${selectedCategories.includes(category) ? 'bg-cg-600 border-cg-600' : 'border-gray-300 group-hover:border-cg-400'}
                      `}>
                        {selectedCategories.includes(category) && <div className="w-2.5 h-2.5 rounded-sm bg-white" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleFilter(category, selectedCategories, setSelectedCategories)}
                      />
                      <span className={`text-sm ${selectedCategories.includes(category) ? 'text-cg-700 font-medium' : 'text-gray-600'}`}>
                        {category}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Levels */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Filter size={16} className="text-cg-600" /> Nível
                </h3>
                <div className="space-y-2.5">
                  {Object.values(CourseLevel).map((level) => (
                    <label key={level} className="flex items-center gap-3 cursor-pointer group">
                       <div className={`
                        w-5 h-5 rounded border flex items-center justify-center transition-colors
                        ${selectedLevels.includes(level) ? 'bg-cg-600 border-cg-600' : 'border-gray-300 group-hover:border-cg-400'}
                      `}>
                        {selectedLevels.includes(level) && <div className="w-2.5 h-2.5 rounded-sm bg-white" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={selectedLevels.includes(level)}
                        onChange={() => toggleFilter(level, selectedLevels, setSelectedLevels)}
                      />
                      <span className={`text-sm ${selectedLevels.includes(level) ? 'text-cg-700 font-medium' : 'text-gray-600'}`}>
                        {level}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {(selectedCategories.length > 0 || selectedLevels.length > 0 || searchTerm) && (
                 <Button variant="ghost" className="w-full text-red-500 hover:bg-red-50 hover:text-red-600" onClick={clearFilters}>
                   Limpar Filtros
                 </Button>
              )}
            </div>
          </aside>
          
          {/* Overlay for mobile sidebar */}
          {showMobileFilters && (
            <div 
              className="fixed inset-0 z-30 bg-black/50 lg:hidden"
              onClick={() => setShowMobileFilters(false)}
            />
          )}

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm text-gray-500 font-medium">
                Mostrando <strong>{filteredCourses.length}</strong> cursos
              </span>
              
              <div className="flex items-center gap-2">
                 <span className="text-sm text-gray-500 hidden sm:inline">Ordenar por:</span>
                 <select className="text-sm border-gray-200 rounded-md bg-white py-1.5 pl-3 pr-8 focus:ring-cg-500 focus:border-cg-500">
                    <option>Mais relevantes</option>
                    <option>Preço: Menor para Maior</option>
                    <option>Preço: Maior para Menor</option>
                 </select>
              </div>
            </div>

            {filteredCourses.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCourses.map((course) => (
                  <CourseCard 
                    key={course.id} 
                    course={course} 
                    onViewDetails={onViewDetails} 
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-96 flex-col items-center justify-center rounded-2xl bg-white border border-dashed border-gray-300 text-center p-8">
                 <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                 </div>
                 <h3 className="text-lg font-semibold text-gray-900">Nenhum curso encontrado</h3>
                 <p className="text-gray-500 max-w-xs mt-2">
                   Tente ajustar seus filtros ou buscar por outro termo.
                 </p>
                 <Button variant="outline" className="mt-6" onClick={clearFilters}>
                   Limpar todos os filtros
                 </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};